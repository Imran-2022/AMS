import React, { useState, useRef } from 'react';
import { uploadFile } from '@/lib/api/files';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string) => void;
  onFileSelected?: (file: File) => void;
  allowedTypesText?: string;
  maxSizeBytes?: number;
  initialFileUrl?: string;
  initialFileName?: string;
}

export function FileUpload({
  onFileUploaded,
  onFileSelected,
  allowedTypesText = 'PDF, DOCX, TXT, ZIP, PNG, JPG (Max 10MB)',
  maxSizeBytes = 10 * 1024 * 1024,
  initialFileUrl,
  initialFileName,
}: FileUploadProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl || null);
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > maxSizeBytes) {
      setError(`File size exceeds limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (onFileSelected) {
        // defer upload to caller
        setFileName(file.name);
        onFileSelected(file);
      } else {
        const result = await uploadFile(file);
        setFileUrl(result.fileUrl);
        setFileName(result.fileName);
        onFileUploaded(result.fileUrl, result.fileName);
      }
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = () => {
    setFileUrl(null);
    setFileName(null);
    onFileUploaded('', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {fileUrl ? (
        <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl transition-all duration-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-medium text-xs">
              FILE
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-800 truncate">{fileName || 'Uploaded File'}</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                View / Download Attachment
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Remove file"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/70 scale-[1.005]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-indigo-600">Uploading file...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                ↑
              </div>
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag & drop file
              </p>
              <p className="text-xs text-slate-400">{allowedTypesText}</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
