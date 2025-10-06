


export interface UploadResult {
  success: boolean;
  url?: string;
  hash?: string;
  permanentUrl?: string;
  error?: string;
}

export async function uploadToIPFS(file: File): Promise<UploadResult> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const uniqueFilename = `nft-${timestamp}-${randomId}.${fileExtension}`;
    

    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', uniqueFilename);
    formData.append('permanent', 'true'); // Flag for permanent storage
    
    const response = await fetch('/api/nfts/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('File uploaded to permanent storage:', data);
    
    return {
      success: true,
      url: data.url,
      permanentUrl: data.permanentUrl,
      hash: data.filename
    };
    
  } catch (error) {
    console.error('File upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export async function uploadJSONToIPFS(jsonData: any): Promise<UploadResult> {
  try {
    // Create metadata with enhanced structure
    const enhancedMetadata = {
      ...jsonData,
      timestamp: Date.now(),
      version: "1.0",
      platform: "NFTSol",
      uploadedAt: new Date().toISOString()
    };
    
    // Convert JSON to blob with proper formatting
    const jsonString = JSON.stringify(enhancedMetadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `metadata-${timestamp}-${randomId}.json`;
    
    const file = new File([blob], filename, { type: 'application/json' });
    
    return await uploadToIPFS(file);
  } catch (error) {
    console.error('JSON upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JSON upload failed'
    };
  }
}

export async function verifyIPFSHash(hash: string): Promise<boolean> {
  try {
    // Check if file exists in permanent storage
    const response = await fetch(`/api/storage/verify/${hash}`, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('File verification failed:', error);
    return false;
  }
}

export function getIPFSUrl(hash: string): string {
  // Return permanent storage URL
  return `/api/storage/${hash}`;
}

export function getPermanentUrl(hash: string): string {
  // Return CDN-style permanent URL
  return `${window.location.origin}/api/storage/${hash}`;
}
