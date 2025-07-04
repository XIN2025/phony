import * as Client from './generated/prisma';

export const UserRole = Client.UserRole;
export const ClientStatus = Client.ClientStatus;
export const InvitationStatus = Client.InvitationStatus;
export const QuestionType = Client.QuestionType;
export const SessionStatus = Client.SessionStatus;
export const PlanStatus = Client.PlanStatus;
export const ActionItemSource = Client.ActionItemSource;
export const ResourceType = Client.ResourceType;

export const PrismaClient = Client.PrismaClient;
export const Prisma = Client.Prisma;

export * from './generated/prisma';

const prisma = new PrismaClient();
export default prisma;
