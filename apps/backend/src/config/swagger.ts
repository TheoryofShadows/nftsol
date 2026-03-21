import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

export function loadSwaggerDocs(): Record<string, any> {
  try {
    const swaggerPath = join(__dirname, '../docs/openapi.yaml');
    const fileContents = readFileSync(swaggerPath, 'utf8');
    const swaggerDoc = yaml.load(fileContents) as Record<string, any>;
    return swaggerDoc;
  } catch (error) {
    console.error('Failed to load Swagger documentation:', error);
    // Return a basic fallback
    return {
      openapi: '3.0.0',
      info: {
        title: 'NFTSol API',
        version: '1.0.0',
        description: 'NFTSol - Revolutionary NFT Marketplace on Solana'
      },
      servers: [
        {
          url: 'https://api.nftsol.app',
          description: 'Production API'
        },
        {
          url: 'http://localhost:3001',
          description: 'Development API'
        }
      ]
    };
  }
}
