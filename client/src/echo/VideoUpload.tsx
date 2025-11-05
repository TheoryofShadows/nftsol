import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNotification } from '../components/NotificationSystem';

interface VideoUploadProps {
  onSuccess: (videoUrl: string, metadataUri: string, verification?: {
    verified: boolean;
    score: number;
    summary: string;
  }) => void;
  onError?: (error: string) => void;
}

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function VideoUpload({ onSuccess, onError }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const { addNotification } = useNotification();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload to backend
      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('name', file.name);
        formData.append('description', `Video: ${file.name}`);

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setUploading(false);
              setProgress(100);
              onSuccess(
                response.data.videoUrl,
                response.data.metadataUri,
                response.data.verification || undefined
              );
              const verificationMsg = response.data.verification
                ? ` (${response.data.verification.verified ? 'Verified' : 'Needs Review'}: ${response.data.verification.score}%)`
                : '';
              addNotification({
                type: 'success',
                title: 'Video Uploaded',
                message: `Video uploaded successfully!${verificationMsg} Ready to mint.`,
                duration: 5000,
              });
            } else {
              throw new Error(response.error || 'Upload failed');
            }
          } else {
            throw new Error(`Upload failed: ${xhr.statusText}`);
          }
        });

        xhr.addEventListener('error', () => {
          throw new Error('Network error during upload');
        });

        xhr.open('POST', `${API_BASE}/api/video/upload`);
        xhr.send(formData);
      } catch (error: any) {
        setUploading(false);
        const errorMessage = error.message || 'Failed to upload video';
        onError?.(errorMessage);
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: errorMessage,
          duration: 5000,
        });
      }
    },
    [onSuccess, onError, addNotification]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mpeg'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive ? 'border-purple-400 bg-purple-500/10' : 'border-gray-600 hover:border-purple-500'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        {uploading ? (
          <div className="space-y-4">
            <div className="loading-spinner mx-auto"></div>
            <div className="text-white font-semibold">Uploading video...</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-gray-400 text-sm">{Math.round(progress)}%</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📹</div>
            <div className="text-white font-semibold text-lg">
              {isDragActive ? 'Drop video here' : 'Drag & drop video or click to upload'}
            </div>
            <div className="text-gray-400 text-sm">
              MP4, WebM, MOV (max 100MB)
            </div>
          </div>
        )}
      </div>

      {preview && !uploading && (
        <div className="mt-4 rounded-lg overflow-hidden">
          <video
            src={preview}
            controls
            className="w-full rounded-lg"
            loading="lazy"
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}

