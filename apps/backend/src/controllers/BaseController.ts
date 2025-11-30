import { Request, Response } from 'express';
import { Pool, PoolClient } from 'pg';
import { pool } from '../lib/db';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('BaseController');

export abstract class BaseController {
  protected tableName: string;
  protected requiredFields: string[];
  protected primaryKey: string;

  constructor(tableName: string, requiredFields: string[] = [], primaryKey: string = 'id') {
    this.tableName = tableName;
    this.requiredFields = requiredFields;
    this.primaryKey = primaryKey;
  }

  protected async handleTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await (pool as unknown as Pool).connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  protected validateFields(data: Record<string, any>): { valid: boolean; message?: string } {
    for (const field of this.requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return { 
          valid: false, 
          message: `Missing or invalid required field: ${field}` 
        };
      }
    }
    return { valid: true };
  }

  protected handleSuccess(res: Response, data: any, statusCode: number = 200) {
    res.status(statusCode).json({
      success: true,
      data
    });
  }

  protected handleError(res: Response, error: any, statusCode: number = 500) {
    console.error(`[${this.constructor.name} Error]:`, error);
    
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    
    if (error.code === '23505') { // Unique violation
      errorMessage = 'A record with these details already exists';
      errorCode = 'DUPLICATE_RECORD';
      statusCode = 409;
    } else if (error.code === '23503') { // Foreign key violation
      errorMessage = 'Referenced record not found';
      errorCode = 'REFERENCE_ERROR';
      statusCode = 400;
    } else if (error.code === '22P02') { // Invalid text representation
      errorMessage = 'Invalid data format';
      errorCode = 'INVALID_INPUT';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || errorCode
    });
  }

  protected checkOwnership(resource: any, userId: string, isAdmin: boolean = false): boolean {
    return isAdmin || (resource && resource.user_id === userId);
  }

  // CRUD Operations
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = `SELECT * FROM ${this.tableName}`;
      const values: any[] = [];
      const conditions: string[] = [];
      
      // Add filters
      Object.entries(filters).forEach(([key, value], index) => {
        if (value) {
          conditions.push(`${key} = $${index + 1}`);
          values.push(value);
        }
      });
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      // Add pagination
      values.push(Number(limit), offset);
      query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
      
      const result = await pool.query(query, values);
      this.handleSuccess(res, {
        items: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.rowCount
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return this.handleError(res, new Error('Resource not found'), 404);
      }
      
      this.handleSuccess(res, result.rows[0]);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      
      // Validate required fields
      const { valid, message } = this.validateFields(data);
      if (!valid) {
        return this.handleError(res, new Error(message), 400);
      }
      
      // Add created_by if not provided
      if (req.user?.id && !data.created_by) {
        data.created_by = req.user.id;
      }
      
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.handleTransaction(async (client) => {
        return client.query(query, values);
      });
      
      this.handleSuccess(res, result.rows[0], 201);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: Record<string, any> = req.body;
      
      // Check if resource exists and user has permission
      const existing = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
        [id]
      );
      
      if (existing.rows.length === 0) {
        return this.handleError(res, new Error('Resource not found'), 404);
      }
      
      if (!this.checkOwnership(existing.rows[0], req.user?.id, req.user?.is_admin)) {
        return this.handleError(res, new Error('Not authorized to update this resource'), 403);
      }
      
      // Prepare update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && key !== this.primaryKey) {
          updates.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      }
      
      if (updates.length === 0) {
        return this.handleError(res, new Error('No valid fields to update'), 400);
      }
      
      values.push(id);
      const query = `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE ${this.primaryKey} = $${paramIndex}
        RETURNING *
      `;
      
      const result = await this.handleTransaction(async (client) => {
        return client.query(query, values);
      });
      
      this.handleSuccess(res, result.rows[0]);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if resource exists and user has permission
      const existing = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
        [id]
      );
      
      if (existing.rows.length === 0) {
        return this.handleError(res, new Error('Resource not found'), 404);
      }
      
      if (!this.checkOwnership(existing.rows[0], req.user?.id, req.user?.is_admin)) {
        return this.handleError(res, new Error('Not authorized to delete this resource'), 403);
      }
      
      await this.handleTransaction(async (client) => {
        await client.query(
          `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`,
          [id]
        );
      });
      
      this.handleSuccess(res, { id, deleted: true });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
