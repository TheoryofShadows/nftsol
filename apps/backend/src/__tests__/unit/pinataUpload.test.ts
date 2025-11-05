/**
 * Unit Tests: Pinata Upload Utility
 */

import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { uploadToPinata } from '../../utils/pinataUpload';
import axios from 'axios';
import FormData from 'form-data';

jest.mock('axios');
// Don't mock form-data - it's a CommonJS module that doesn't work well with Jest

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Pinata Upload Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PINATA_JWT = 'test-jwt-token';
  });

  describe('uploadToPinata', () => {
    it('should upload file to Pinata successfully', async () => {
      const mockBuffer = Buffer.from('test video content');
      const mockFilename = 'test-video.mp4';
      const mockIpfsHash = 'QmTestHash123';

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          IpfsHash: mockIpfsHash,
          PinSize: mockBuffer.length,
          Timestamp: new Date().toISOString(),
        },
      });

      const result = await uploadToPinata(mockBuffer, mockFilename);

      expect(result).toBe(mockIpfsHash);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
          }),
        })
      );
    });

    it('should throw error if PINATA_JWT is not set', async () => {
      delete process.env.PINATA_JWT;

      await expect(
        uploadToPinata(Buffer.from('test'), 'test.mp4')
      ).rejects.toThrow('PINATA_JWT environment variable is not set');
    });

    it('should throw error if Pinata API returns invalid response', async () => {
      process.env.PINATA_JWT = 'test-jwt';

      mockedAxios.post.mockResolvedValueOnce({
        data: { invalid: 'response' },
      });

      await expect(
        uploadToPinata(Buffer.from('test'), 'test.mp4')
      ).rejects.toThrow('Invalid response from Pinata API');
    });

    it('should handle network errors', async () => {
      process.env.PINATA_JWT = 'test-jwt';

      mockedAxios.post.mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        uploadToPinata(Buffer.from('test'), 'test.mp4')
      ).rejects.toThrow('Failed to upload to Pinata');
    });
  });
});

