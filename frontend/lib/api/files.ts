import { getStoredToken } from '../auth';

export interface FileUploadResult {
  fileUrl: string;
  fileName: string;
  sizeBytes: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function uploadFile(file: File): Promise<FileUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'File upload failed' }));
    throw new Error(errorData.error || 'Failed to upload file');
  }

  return response.json();
}
