export type NotificationTypeKey =
  | 'AssignmentPublished'
  | 'SubmissionReceived'
  | 'SubmissionGraded'
  | 'ResubmissionRequested'
  | 'SubmissionResubmitted'
  | 'SubmissionResubmissionGraded';

export type NotificationDefinition = {
  type: NotificationTypeKey;
  title: string;
  description: string;
  checked: boolean;
};

export const NOTIFICATION_DEFINITIONS: Record<NotificationTypeKey, Omit<NotificationDefinition, 'type' | 'checked'>> = {
  AssignmentPublished: {
    title: 'Assignment published',
    description: 'Receive a notification when a new assignment is published.',
  },
  SubmissionReceived: {
    title: 'Submission received',
    description: 'Notify me when a student submits work for one of my assignments.',
  },
  SubmissionGraded: {
    title: 'Submission graded',
    description: 'Notify me when a submission has been graded.',
  },
  ResubmissionRequested: {
    title: 'Resubmission requested',
    description: 'Prompt me when a resubmission is requested.',
  },
  SubmissionResubmitted: {
    title: 'Submission resubmitted',
    description: 'Notify me when a student resubmits work after being requested.',
  },
  SubmissionResubmissionGraded: {
    title: 'Resubmission graded',
    description: 'Notify me when my resubmitted work has been graded.',
  },
};

export function getNotificationDefinitionsForRole(role: 'Admin' | 'Teacher' | 'Student'): NotificationDefinition[] {
  const base = Object.entries(NOTIFICATION_DEFINITIONS).map(([type, info]) => ({
    type: type as NotificationTypeKey,
    ...info,
    checked: true,
  }));

  switch (role) {
    case 'Student':
      return [
        { type: 'AssignmentPublished', ...NOTIFICATION_DEFINITIONS.AssignmentPublished, checked: true },
        { type: 'SubmissionGraded', ...NOTIFICATION_DEFINITIONS.SubmissionGraded, checked: true },
        { type: 'ResubmissionRequested', ...NOTIFICATION_DEFINITIONS.ResubmissionRequested, checked: true },
        { type: 'SubmissionResubmissionGraded', ...NOTIFICATION_DEFINITIONS.SubmissionResubmissionGraded, checked: true },
      ];
    case 'Teacher':
      return [
        { type: 'SubmissionReceived', ...NOTIFICATION_DEFINITIONS.SubmissionReceived, checked: true },
        { type: 'SubmissionResubmitted', ...NOTIFICATION_DEFINITIONS.SubmissionResubmitted, checked: true },
      ];
    default:
      return base;
  }
}
