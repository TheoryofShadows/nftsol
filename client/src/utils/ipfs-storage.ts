export interface UploadResult {
  success: boolean;
  url?: string;
  hash?: string;
  permanentUrl?: string;
  error?: string;
}

export async function uploadToPermanentStorage(
  file: File | Blob,
  contentType = file instanceof File && file.type ? file.type : "application/octet-stream",
) {
  const res = await fetch("/api/upload", { method: "POST", body: file, headers: { "Content-Type": contentType } });
  if (!res.ok) throw new Error(Upload failed: );
  const data = (await res.json()) as { ok: boolean; key: string; url: string };
  if (!data.ok) throw new Error("Upload failed");
  return { cid: data.key, url: data.url };
}

export async function uploadToIPFS(file: File): Promise<UploadResult> {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const uniqueFilename = 
ft--.;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', uniqueFilename);
    formData.append('permanent', 'true');

    const response = await fetch('/api/nfts/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(Upload failed: );
    }

    const data = await response.json();

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
