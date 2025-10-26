"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleIPFSService = void 0;
class SimpleIPFSService {
    constructor() {
        this.pinataApiKey = process.env.PINATA_API_KEY || '';
        this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '';
    }
    /**
     * Upload file to IPFS using Pinata
     */
    async uploadFile(file, filename) {
        try {
            if (!this.pinataApiKey || !this.pinataSecretKey) {
                throw new Error('Pinata API keys not configured');
            }
            const formData = new FormData();
            formData.append('file', new Blob([new Uint8Array(file)]), filename);
            formData.append('pinataMetadata', JSON.stringify({
                name: filename,
                keyvalues: {
                    source: 'nftsol-platform'
                }
            }));
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey,
                },
                body: formData
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Pinata upload failed: ${response.status} ${errorText}`);
            }
            const result = await response.json();
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
            return {
                success: true,
                ipfsUrl,
                hash: result.IpfsHash
            };
        }
        catch (error) {
            console.error('IPFS upload failed:', error);
            return {
                success: false,
                error: error.message || 'Upload failed'
            };
        }
    }
    /**
     * Upload JSON metadata to IPFS using Pinata
     */
    async uploadJSON(metadata, name) {
        try {
            if (!this.pinataApiKey || !this.pinataSecretKey) {
                throw new Error('Pinata API keys not configured');
            }
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey,
                },
                body: JSON.stringify({
                    pinataContent: metadata,
                    pinataMetadata: {
                        name: name,
                        keyvalues: {
                            source: 'nftsol-platform',
                            type: 'nft-metadata'
                        }
                    }
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Pinata JSON upload failed: ${response.status} ${errorText}`);
            }
            const result = await response.json();
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
            return {
                success: true,
                ipfsUrl,
                hash: result.IpfsHash
            };
        }
        catch (error) {
            console.error('IPFS JSON upload failed:', error);
            return {
                success: false,
                error: error.message || 'JSON upload failed'
            };
        }
    }
}
exports.SimpleIPFSService = SimpleIPFSService;
