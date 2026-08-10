"use client";

import { useMemo, useState } from 'react';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui';
import type { ClassCourseDto, SubjectDto } from '@/lib/api';

type AssignmentCreatePayload = {
  title: string;
  description: string;
  classCourseId: string;
  subjectId: string;
  deadline: string;
  maxMarks: number;
  attachmentFiles?: File[];
  attachmentUrl?: string;
  attachmentName?: string;
};

type TeacherAssignmentCreateModalProps = {
  open: boolean;
  onClose: () => void;
  classes: ClassCourseDto[];
  subjects: SubjectDto[];
  onSaveDraft?: (payload: AssignmentCreatePayload) => Promise<void> | void;
  onPublish?: (payload: AssignmentCreatePayload) => Promise<void> | void;
};

export function TeacherAssignmentCreateModal({
  open,
  onClose,
  classes,
  subjects,
  onSaveDraft,
  onPublish,
}: TeacherAssignmentCreateModalProps) {
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState('20');
  const [subjectId, setSubjectId] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const classNames = useMemo(
    () => Array.from(new Set(classes.map((cls) => cls.name))),
    [classes]
  );

  const sectionOptions = useMemo(
    () => classes.filter((cls) => cls.name === selectedClassName).map((cls) => cls.section),
    [classes, selectedClassName]
  );

  const selectedClass = useMemo(
    () => classes.find((cls) => cls.name === selectedClassName && cls.section === selectedSection),
    [classes, selectedClassName, selectedSection]
  );

  const availableSubjectsForForm = useMemo(
    () => subjects.filter((subject) => subject.classCourseId === selectedClass?.id),
    [subjects, selectedClass]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Create assignment</h2>
            <p className="mt-1 text-sm text-slate-500">Fill in the details, then save as a draft or publish.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-slate-800">Title <span className="text-rose-500">*</span></label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} type="text" placeholder="e.g. Algebraic Expressions — Set 4" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-slate-800">Description <span className="text-rose-500">*</span></label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Instructions for students…" className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-800">Class <span className="text-rose-500">*</span></label>
              <select value={selectedClassName} onChange={(event) => {
                  setSelectedClassName(event.target.value);
                  const nextSection = classes.find((cls) => cls.name === event.target.value)?.section ?? '';
                  setSelectedSection(nextSection);
                }} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                <option value="" disabled>
                  Select class
                </option>
                {classNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-800">Section <span className="text-rose-500">*</span></label>
              <select value={selectedSection} onChange={(event) => setSelectedSection(event.target.value)} className={`w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${!selectedClassName ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-700'}`} disabled={!selectedClassName}>
                <option value="" disabled>
                  {selectedClassName ? 'Select section' : 'Select class first'}
                </option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-800">Subject <span className="text-rose-500">*</span></label>
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" disabled={!selectedClass}>
                <option value="" disabled>
                  {selectedClass ? 'Select subject' : 'Select class first'}
                </option>
                {availableSubjectsForForm.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-800">Deadline <span className="text-rose-500">*</span></label>
              <input value={deadline} onChange={(event) => setDeadline(event.target.value)} type="datetime-local" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-slate-800">Max marks <span className="text-rose-500">*</span></label>
              <input value={maxMarks} onChange={(event) => setMaxMarks(event.target.value)} type="number" placeholder="e.g. 20" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-slate-800">Attachments <span className="text-slate-400 font-normal">(optional)</span></label>
            <FileUpload
              multiple
              selectedFiles={attachmentFiles}
              existingAttachments={[]}
              onFilesSelected={(files) => {
                setAttachmentFiles(files);
              }}
              onFileSelected={(file) => {
                setAttachmentFiles([file]);
              }}
              onRemoveExistingAttachment={() => undefined}
              onRenameExistingAttachment={() => undefined}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-3xl border-t border-slate-100 bg-slate-50/80 px-7 py-5">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={async () => {
              if (!title.trim() || !description.trim() || !selectedClass || !subjectId || !deadline.trim()) return;

              await onSaveDraft?.({
                title: title.trim(),
                description: description.trim(),
                classCourseId: selectedClass.id,
                subjectId,
                deadline,
                maxMarks: Number(maxMarks || 20),
                attachmentFiles,
              });

              onClose();
            }}>Save as draft</Button>
            <Button type="button" onClick={async () => {
              if (!title.trim() || !description.trim() || !selectedClass || !subjectId || !deadline.trim()) return;

              await onPublish?.({
                title: title.trim(),
                description: description.trim(),
                classCourseId: selectedClass.id,
                subjectId,
                deadline,
                maxMarks: Number(maxMarks || 20),
                attachmentFiles,
              });

              onClose();
            }}>Publish</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
