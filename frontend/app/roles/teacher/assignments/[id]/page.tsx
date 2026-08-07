import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getAssignment } from '@/lib/api';
import type { AssignmentDto } from '@/lib/api';

type Props = {
  params: {
    id: string;
  };
};

export default async function TeacherAssignmentDetailPage({ params }: Props) {
  let assignment: AssignmentDto | null = null;

  try {
    assignment = await getAssignment(params.id);
  } catch (error) {
    console.error('Assignment load failed', error);
  }

  if (!assignment) {
    notFound();
  }

  return (
    <AppShell role="Teacher" breadcrumb={`Teacher / Assignment / ${assignment.title}`}>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase  text-slate-400">Assignment details</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{assignment.title}</h1>
              <p className="mt-3 text-sm text-slate-500">Read-only details for this assignment. Use the menu on the assignment list to edit or manage it.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm">
              <p className="font-semibold text-slate-900">Status</p>
              <p className="mt-1">{assignment.status}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-sm font-semibold uppercase  text-slate-400">Description</h2>
                <p className="mt-4 text-sm leading-7 text-slate-700">{assignment.description || 'No description provided.'}</p>
              </section>

              <section className="rounded-3xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold uppercase  text-slate-400">Attachment</h2>
                {assignment.attachmentName && assignment.attachmentUrl ? (
                  <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                    {assignment.attachmentName}
                  </a>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No attachment uploaded for this assignment.</p>
                )}
              </section>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm font-semibold uppercase  text-slate-400">Class</h3>
                <p className="mt-3 text-base font-semibold text-slate-900">{assignment.classCourseName} — {assignment.classCourseSection}</p>
                <p className="mt-2 text-sm text-slate-500">{assignment.subjectName}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm font-semibold uppercase  text-slate-400">Deadline</h3>
                <p className="mt-3 text-base font-semibold text-slate-900">{new Date(assignment.deadline).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm font-semibold uppercase  text-slate-400">Max marks</h3>
                <p className="mt-3 text-base font-semibold text-slate-900">{assignment.maxMarks}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
