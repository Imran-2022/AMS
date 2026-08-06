"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../../layout/AppShell';
import { Button, Card, Metric, PageHeader, Pill, RoleBadge, Th, Td, UserFormModal } from '../../ui';
import { ASSIGNMENTS, USERS as INITIAL_USERS, CLASSES as INITIAL_CLASSES, SUBJECTS as INITIAL_SUBJECTS, SUBMISSIONS } from '../../data';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getSubmissions, getUsers as apiGetUsers, getClassCourses as apiGetClassCourses } from '@/lib/api';
import { MoreVertical, UserPlus, UserCheck, BookOpen, ClipboardList } from 'lucide-react';
import { createUser, deleteUser, getClassCourses, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment, getEnrollments } from '@/lib/api/enrollments';

export function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setIsLoading(true);
      const list = await getAssignments();
      setAssignments(list);
    } catch (err) {
      console.error(err);
      setAssignments(ASSIGNMENTS as any[]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await publishAssignment(id);
      await loadAssignments();
    } catch (err) {
      console.error(err);
      alert('Unable to publish assignment.');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete assignment?')) return;
    try {
      await deleteAssignment(id);
      await loadAssignments();
    } catch (err) {
      console.error(err);
      alert('Unable to delete assignment.');
    }
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Assignments">
      <PageHeader eyebrow="Administration" title="Assignments" action={<Button>Add assignment</Button>} />
      <div className="space-y-4">
        {(isLoading ? ASSIGNMENTS : assignments).map((assignment: any) => (
          <Card key={assignment.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-slate-900">{assignment.title}</p>
                <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                  {assignment.status}
                </Pill>
              </div>
              <p className="text-sm text-slate-500">{assignment.subjectName ?? assignment.subject ?? assignment.subject} Â· {assignment.classCourseName ?? assignment.cls} Â· {assignment.teacherName ?? assignment.teacher}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{assignment.deadline}</p>
              <p>{assignment.submissions ?? assignment.submittedCount}/{assignment.total ?? ''} submitted</p>
              <div className="mt-2 flex gap-2 justify-end">
                {assignment.status !== 'Published' && (
                  <Button onClick={() => handlePublish(assignment.id)}>Publish</Button>
                )}
                <Button variant="secondary" onClick={() => handleDelete(assignment.id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
