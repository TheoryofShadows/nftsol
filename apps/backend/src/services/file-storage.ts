/**
 * File Storage Service
 * Handles uploading files to decentralized storage (IPFS via Pinata, with Arweave fallback)
 * Converts uploaded file buffers to accessible URLs
 */

import FormData from 'form-data';
import fetch from 'node-fetch';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('fileStorage');

interface StorageResponse {
  success: boolean;
  url?: string;
  hash?: string;
  error?: string;
}

export class FileStorageService {
  private pinataJwt: string | undefined;
  private pinataPinName: string = 'nftsol-uploads';

  constructor() {
    this.pinataJwt = process.env.PINATA_JWT;

    if (!this.pinataJwt) {
      log.warn('⚠️ PINATA_JWT not configured. File uploads will use fallback storage.');
    }
  }

  /**
   * Upload file to IPFS via Pinata
   * Falls back to data URL if Pinata is not available
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<StorageResponse> {
    try {
      // If Pinata is configured, try to use it
      if (this.pinataJwt) {
        return await this.uploadToPinata(fileBuffer, fileName, mimeType);
      }

      // Fallback: Use data URL (good for small images during development)
      return this.createDataUrl(fileBuffer, mimeType);
    } catch (error) {
      log.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      };
    }
  }

  /**
   * Upload to Pinata (IPFS)
   */
  private async uploadToPinata(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<StorageResponse> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType,
      });

      // Add metadata
      const metadata = {
        name: fileName,
        keyvalues: {
          app: 'nftsol',
          uploadedAt: new Date().toISOString(),
        },
      };

      formData.append('pinataMetadata', JSON.stringify(metadata));

      // Set pin policy to Pinata's IPFS nodes
      const pinPolicy = {
        regions: [
          {
            name: 'FRA1',
            desiredReplicationCount: 1,
          },
          {
            name: 'NYC1',
            desiredReplicationCount: 1,
          },
        ],
      };

      formData.append('pinataOptions', JSON.stringify(pinPolicy));

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.pinataJwt}`,
        },
        body: formData as any,
      });

      if (!response.ok) {
        throw new Error(`Pinata error: ${response.statusText}`);
      }

      const result = await response.json() as any;

      if (!result.IpfsHash) {
        throw new Error('No IPFS hash returned from Pinata');
      }

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

      log.info(`✅ File uploaded to IPFS: ${ipfsUrl}`);

      return {
        success: true,
        url: ipfsUrl,
        hash: result.IpfsHash,
      };
    } catch (error) {
      log.error('Pinata upload failed:', error);

      // Fallback to data URL if Pinata fails
      log.info('Falling back to data URL for image storage');
      return this.createDataUrl(fileBuffer, mimeType);
    }
  }

  /**
   * Create a data URL from file buffer (fallback for development)
   * Good for small images, not recommended for production
   */
  private createDataUrl(fileBuffer: Buffer, mimeType: string): StorageResponse {
    try {
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // For demo purposes, limit data URL size
      if (dataUrl.length > 5 * 1024 * 1024) {
        // 5MB limit for data URLs
        return {
          success: false,
          error: 'File too large for data URL storage. Please configure Pinata JWT.',
        };
      }

      log.info('📦 Using data URL for image storage (development/fallback)');

      return {
        success: true,
        url: dataUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create data URL',
      };
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): { valid: boolean; error?: string } {
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit (got ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`,
      };
    }

    // Check mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
      };
    }

    // Check file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

/**
 * Export singleton instance
 */
export const fileStorageService = new FileStorageService();
