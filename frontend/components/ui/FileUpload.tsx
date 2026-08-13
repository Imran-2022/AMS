import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { uploadFile } from '@/lib/api/files';

interface ExistingAttachment {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  sizeBytes: number;
}

interface FileUploadProps {
  onFileUploaded?: (fileUrl: string, fileName: string) => void;
  onFileSelected?: (file: File) => void;
  onFilesSelected?: (files: File[]) => void;
  selectedFiles?: File[];
  allowedTypesText?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
  initialFileUrl?: string;
  initialFileName?: string;
  existingAttachments?: ExistingAttachment[];
  onRemoveExistingAttachment?: (id: string) => void;
  onRenameExistingAttachment?: (id: string, name: string) => void;
}

function formatFileSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '0 KB';
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function FileUpload({
  onFileUploaded,
  onFileSelected,
  onFilesSelected,
  selectedFiles = [],
  allowedTypesText = 'PDF, DOCX, TXT, ZIP, PNG, JPG (Max 10MB)',
  maxSizeBytes = 10 * 1024 * 1024,
  multiple = false,
  initialFileUrl,
  initialFileName,
  existingAttachments = [],
  onRemoveExistingAttachment,
  onRenameExistingAttachment,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>(selectedFiles);
  const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl || null);
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState<string | null>(null);
  const [editingFileKey, setEditingFileKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const areFilesEqual = (left: File[], right: File[]) => {
    if (left.length !== right.length) return false;

    return left.every((file, index) => {
      const other = right[index];
      return !!other
        && file.name === other.name
        && file.size === other.size
        && file.type === other.type
        && file.lastModified === other.lastModified;
    });
  };

  useEffect(() => {
    if (!areFilesEqual(files, selectedFiles)) {
      setFiles(selectedFiles);
    }
  }, [files, selectedFiles]);

  useEffect(() => {
    setFileUrl(initialFileUrl || null);
    setFileName(initialFileName || null);
  }, [initialFileUrl, initialFileName]);

  useEffect(() => {
    if (activeMenuKey === null) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenuKey(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeMenuKey]);

  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const newFiles = Array.from(filesList);
    const oversized = newFiles.find((file) => file.size > maxSizeBytes);
    if (oversized) {
      setError(`File size exceeds limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (multiple && onFilesSelected) {
        const combined = [...files, ...newFiles];
        setFiles(combined);
        onFilesSelected(combined);
        setFileUrl(null);
        setFileName(null);
      } else if (onFilesSelected) {
        const combined = [...newFiles];
        setFiles(combined);
        onFilesSelected(combined);
        setFileName(combined[0].name);
        setFileUrl(null);
      } else if (onFileSelected) {
        const file = newFiles[0];
        setFiles([file]);
        setFileName(file.name);
        setFileUrl(null);
        onFileSelected(file);
      } else {
        const file = newFiles[0];
        const result = await uploadFile(file);
        setFileUrl(result.fileUrl);
        setFileName(result.fileName);
        setFiles([file]);
        if (onFileUploaded) {
          onFileUploaded(result.fileUrl, result.fileName);
        }
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

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
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

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelected?.(updated);
    setActiveMenuKey(null);
    if (updated.length <= 0) {
      setFileUrl(null);
      setFileName(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRename = (key: string, currentName: string) => {
    setEditingFileKey(key);
    setActiveMenuKey(null);
    setEditingName(currentName);
  };

  const saveRename = () => {
    if (!editingFileKey) return;
    if (editingFileKey.startsWith('file-')) {
      const index = Number(editingFileKey.replace('file-', ''));
      if (Number.isNaN(index) || index < 0 || index >= files.length) return;
      const updatedFiles = [...files];
      const file = updatedFiles[index];
      const dotIndex = file.name.lastIndexOf('.');
      const extension = dotIndex >= 0 ? file.name.slice(dotIndex) : '';
      const newName = editingName.trim() || file.name;
      updatedFiles[index] = new File([file], newName.endsWith(extension) ? newName : `${newName}${extension}`, { type: file.type });
      setFiles(updatedFiles);
      onFilesSelected?.(updatedFiles);
    } else if (editingFileKey.startsWith('existing-')) {
      const id = editingFileKey.replace('existing-', '');
      renameExistingAttachment(id, editingName.trim());
    }
    setEditingFileKey(null);
  };

  const cancelRename = () => {
    setEditingFileKey(null);
    setEditingName('');
  };

  const removeExistingAttachment = (id: string) => {
    if (onRemoveExistingAttachment) onRemoveExistingAttachment(id);
  };

  const renameExistingAttachment = (id: string, name: string) => {
    if (onRenameExistingAttachment) onRenameExistingAttachment(id, name);
  };

  return (
    <div ref={containerRef} className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        onChange={(e) => {
          handleFiles(e.target.files);
          if (e.target) e.target.value = '';
        }}
      />

      {(files.length > 0 || fileUrl || fileName || existingAttachments.length > 0) ? (
        <div className="space-y-3">
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
                  {existingAttachments.map((attachment) => (
              <div key={`existing-${attachment.id}`} className="relative flex items-center justify-between gap-3 rounded bg-white px-4 py-3 mb-2 last:mb-0 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                    {attachment.originalFileName.split('.').pop()?.slice(0, 3).toUpperCase() || 'FILE'}
                  </div>
                  <div className="min-w-0">
                    {editingFileKey === `existing-${attachment.id}` ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        />
                        <button type="button" onClick={saveRename} className="cursor-pointer rounded bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">Save</button>
                        <button type="button" onClick={cancelRename} className="cursor-pointer rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-900 truncate">{attachment.originalFileName}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(attachment.sizeBytes)} · Existing attachment</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveMenuKey(activeMenuKey === `existing-${attachment.id}` ? null : `existing-${attachment.id}`);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors duration-200"
                    aria-label="Open file actions"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  {activeMenuKey === `existing-${attachment.id}` && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded border border-slate-200 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={() => startRename(`existing-${attachment.id}`, attachment.originalFileName)}
                        className="cursor-pointer w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Edit file name
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(attachment.id)}
                        className="cursor-pointer w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        Delete this file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {files.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="relative flex items-center justify-between gap-3 rounded bg-white px-4 py-3 mb-2 last:mb-0 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                    {file.name.split('.').pop()?.slice(0, 3).toUpperCase() || 'FILE'}
                  </div>
                  <div className="min-w-0">
                    {editingFileKey === `file-${index}` ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        />
                        <button type="button" onClick={saveRename} className="cursor-pointer rounded bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">Save</button>
                        <button type="button" onClick={cancelRename} className="cursor-pointer rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveMenuKey(activeMenuKey === `file-${index}` ? null : `file-${index}`);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors duration-200"
                    aria-label="Open file actions"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>

                  {activeMenuKey === `file-${index}` && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded border border-slate-200 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={() => startRename(`file-${index}`, file.name)}
                        className="cursor-pointer w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Edit file name
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="cursor-pointer w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        Delete this file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="w-full rounded border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
          >
            Add More Files
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/70 scale-[1.005]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded animate-spin" />
              <p className="text-sm font-medium text-indigo-600">Uploading file...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="w-10 h-10 mx-auto rounded bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                ↑
              </div>
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag & drop file{multiple ? 's' : ''}
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
