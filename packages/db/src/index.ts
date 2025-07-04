import * as Client from './generated/client/index.js';

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

export * from './generated/client/index.js';

const prisma = new PrismaClient();

export function getPrismaClient(): typeof prisma {
  return prisma;
}

export default prisma;

export const VERSION = '1.0.0';
