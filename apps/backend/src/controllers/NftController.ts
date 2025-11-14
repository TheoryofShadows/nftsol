import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { pool } from '../lib/db';

export class NftController extends BaseController {
  constructor() {
    super('nfts', [
      'name',
      'description',
      'image_url',
      'owner_id',
      'token_id',
      'contract_address'
    ], 'id');
  }

  // Override create to add additional validation
  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      
      // Set owner from authenticated user if not provided
      if (!data.owner_id && req.user) {
        data.owner_id = req.user.id;
      }
      
      // Validate required fields
      const { valid, message } = this.validateFields(data);
      if (!valid) {
        return this.handleError(res, new Error(message), 400);
      }
      
      // Check if NFT with same token_id and contract_address already exists
      const existing = await pool.query(
        'SELECT * FROM nfts WHERE token_id = $1 AND contract_address = $2',
        [data.token_id, data.contract_address]
      );
      
      if (existing.rows.length > 0) {
        return this.handleError(res, new Error('NFT with this token ID and contract already exists'), 409);
      }
      
      // Add metadata if not provided
      if (!data.metadata) {
        data.metadata = {
          created_at: new Date().toISOString(),
          attributes: []
        };
      }
      
      // Call parent create method
      return super.create(req, res);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Get NFTs by owner
  async getByOwner(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      // Check if requesting own NFTs or has admin access
      if (ownerId !== req.user?.id && !req.user?.is_admin) {
        return this.handleError(res, new Error('Not authorized to view these NFTs'), 403);
      }
      
      const offset = (Number(page) - 1) * Number(limit);
      
      const query = `
        SELECT * FROM nfts 
        WHERE owner_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const countQuery = 'SELECT COUNT(*) FROM nfts WHERE owner_id = $1';
      
      const [result, countResult] = await Promise.all([
        pool.query(query, [ownerId, Number(limit), offset]),
        pool.query(countQuery, [ownerId])
      ]);
      
      this.handleSuccess(res, {
        items: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10)
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Transfer NFT ownership
  async transferOwnership(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { new_owner_id } = req.body;
      
      if (!new_owner_id) {
        return this.handleError(res, new Error('New owner ID is required'), 400);
      }
      
      await client.query('BEGIN');
      
      // Get the NFT with FOR UPDATE to lock the row
      const nftResult = await client.query(
        'SELECT * FROM nfts WHERE id = $1 FOR UPDATE',
        [id]
      );
      
      if (nftResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return this.handleError(res, new Error('NFT not found'), 404);
      }
      
      const nft = nftResult.rows[0];
      
      // Check if current user is the owner or admin
      if (nft.owner_id !== req.user?.id && !req.user?.is_admin) {
        await client.query('ROLLBACK');
        return this.handleError(res, new Error('Not authorized to transfer this NFT'), 403);
      }
      
      // Update ownership
      const updateResult = await client.query(
        `UPDATE nfts 
         SET owner_id = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [new_owner_id, id]
      );
      
      // Create transfer history
      await client.query(
        `INSERT INTO nft_transfers 
         (nft_id, from_address, to_address, transaction_hash, block_number) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          nft.owner_id,
          new_owner_id,
          req.body.transaction_hash || null,
          req.body.block_number || null
        ]
      );
      
      await client.query('COMMIT');
      this.handleSuccess(res, updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.handleError(res, error);
    } finally {
      client.release();
    }
  }

  // List NFTs with filters
  async list(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        owner_id,
        collection_id,
        min_price,
        max_price,
        sort_by = 'created_at',
        sort_order = 'DESC',
        search
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      const queryParams: any[] = [];
      const whereClauses: string[] = [];
      
      // Add filters
      if (owner_id) {
        queryParams.push(owner_id);
        whereClauses.push(`owner_id = $${queryParams.length}`);
      }
      
      if (collection_id) {
        queryParams.push(collection_id);
        whereClauses.push(`collection_id = $${queryParams.length}`);
      }
      
      if (min_price) {
        queryParams.push(min_price);
        whereClauses.push(`price >= $${queryParams.length}`);
      }
      
      if (max_price) {
        queryParams.push(max_price);
        whereClauses.push(`price <= $${queryParams.length}`);
      }
      
      if (search) {
        queryParams.push(`%${search}%`);
        whereClauses.push(`(name ILIKE $${queryParams.length} OR description ILIKE $${queryParams.length})`);
      }
      
      // Build the query
      let query = 'SELECT * FROM nfts';
      let countQuery = 'SELECT COUNT(*) FROM nfts';
      
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
        countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
      }
      
      // Add sorting
      const validSortFields = ['created_at', 'price', 'name'];
      const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at';
      const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY ${sortField} ${sortDir} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      
      // Add pagination params
      queryParams.push(Number(limit), offset);
      
      // Execute queries in parallel
      const [result, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2)) // Exclude limit and offset for count
      ]);
      
      this.handleSuccess(res, {
        items: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10)
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
