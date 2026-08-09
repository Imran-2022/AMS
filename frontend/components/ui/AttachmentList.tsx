"use client";

import { useEffect, useState } from 'react';
import { listAttachments } from '@/lib/api';
import type { AttachmentDto } from '@/lib/api';

type AttachmentListProps = {
  ownerType: string;
  ownerId: string;
};

export function AttachmentList({ ownerType, ownerId }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const items = await listAttachments(ownerType, ownerId);
        setAttachments(items);
      } catch (err: any) {
        setError(err?.message || 'Unable to load attachments.');
      } finally {
        setLoading(false);
      }
    }

    if (ownerId) {
      void load();
    }
  }, [ownerType, ownerId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading attachments…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!attachments.length) {
    return <p className="text-sm text-slate-500">No attachments for this assignment.</p>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          {attachment.originalFileName}
        </a>
      ))}
    </div>
  );
}
