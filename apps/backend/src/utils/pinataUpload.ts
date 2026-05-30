/**
 * Pinata Upload Utility
 * Free 1GB tier for video storage
 * Uploads files to IPFS via Pinata pinning service
 */

import logger from './logger';
import FormData from 'form-data';
import axios from 'axios';

export interface PinataUploadResult {
  ipfsHash: string;
  pinSize: number;
  timestamp: string;
}

/**
 * Upload file to Pinata IPFS
 * @param buffer - File buffer to upload
 * @param filename - Original filename
 * @returns IPFS hash (CID)
 */
export async function uploadToPinata(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
      throw new Error('PINATA_JWT environment variable is not set');
    }

    const form = new FormData();
    form.append('file', buffer, filename);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      form,
      {
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
          ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (!response.data || !response.data.IpfsHash) {
      throw new Error('Invalid response from Pinata API');
    }

    return response.data.IpfsHash;
  } catch (error) {
    logger.error('Pinata upload failed:', error);
    throw new Error(
      `Failed to upload to Pinata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

