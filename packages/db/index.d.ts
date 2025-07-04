import * as Client from './generated/prisma';
export declare const UserRole: {
  PRACTITIONER: 'PRACTITIONER';
  CLIENT: 'CLIENT';
};
export declare const ClientStatus: {
  ACTIVE: 'ACTIVE';
  NEEDS_INTAKE: 'NEEDS_INTAKE';
  INTAKE_COMPLETED: 'INTAKE_COMPLETED';
};
export declare const InvitationStatus: {
  PENDING: 'PENDING';
  ACCEPTED: 'ACCEPTED';
  EXPIRED: 'EXPIRED';
};
export declare const QuestionType: {
  SHORT_ANSWER: 'SHORT_ANSWER';
  LONG_ANSWER: 'LONG_ANSWER';
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE';
  CHECKBOXES: 'CHECKBOXES';
  SCALE: 'SCALE';
  DROPDOWN: 'DROPDOWN';
  FILE_UPLOAD: 'FILE_UPLOAD';
  RATING: 'RATING';
  MULTIPLE_CHOICE_GRID: 'MULTIPLE_CHOICE_GRID';
  TICK_BOX_GRID: 'TICK_BOX_GRID';
};
export declare const SessionStatus: {
  UPLOADING: 'UPLOADING';
  TRANSCRIBING: 'TRANSCRIBING';
  REVIEW_READY: 'REVIEW_READY';
  COMPLETED: 'COMPLETED';
};
export declare const PlanStatus: {
  DRAFT: 'DRAFT';
  PUBLISHED: 'PUBLISHED';
  ARCHIVED: 'ARCHIVED';
};
export declare const ActionItemSource: {
  AI_SUGGESTED: 'AI_SUGGESTED';
  MANUAL: 'MANUAL';
};
export declare const ResourceType: {
  LINK: 'LINK';
  PDF: 'PDF';
};
export declare const PrismaClient: typeof Client.PrismaClient;
export declare const Prisma: typeof Client.Prisma;
export * from './generated/prisma';
declare const prisma: Client.PrismaClient<
  Client.Prisma.PrismaClientOptions,
  never,
  import('./generated/prisma/runtime/library').DefaultArgs
>;
export default prisma;
//# sourceMappingURL=index.d.ts.map
