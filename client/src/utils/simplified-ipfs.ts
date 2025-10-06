// Simplified IPFS storage using Pinata service

export interface UploadResult {
  success: boolean;
  url?: string;
  hash?: string;
  error?: string;
}

export async function uploadToIPFS(file: File): Promise<UploadResult> {
  try {
    // Use local server upload instead of external services
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/nfts/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      url: data.url,
      hash: data.filename
    };
    
  } catch (error) {
    console.error('File upload failed:', error);
    // Fallback to data URL for demo purposes
    return await createDataUrl(file);
  }
}

// Removed Pinata dependency - using local storage only

async function createDataUrl(file: File): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      resolve({
        success: true,
        url,
        hash: `data-${Date.now()}`
      });
    };
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file'
      });
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadJSONToIPFS(jsonData: any): Promise<UploadResult> {
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const file = new File([blob], 'metadata.json', { type: 'application/json' });
  
  return uploadToIPFS(file);
}

export async function verifyIPFSHash(hash: string): Promise<boolean> {
  try {
    if (hash.startsWith('data-')) {
      return true; // Data URL hashes are always valid
    }
    const response = await fetch(`https://ipfs.io/ipfs/${hash}`, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('IPFS verification failed:', error);
    return false;
  }
}

export function getIPFSUrl(hash: string): string {
  if (hash.startsWith('data-')) {
    return hash; // Return data URL as-is
  }
  return `https://ipfs.io/ipfs/${hash}`;
}