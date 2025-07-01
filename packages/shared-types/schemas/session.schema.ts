import { z } from 'zod';
import {
  SessionStatus,
  PlanStatus,
  SuggestedActionItemStatus,
  ActionItemSource,
  ResourceType,
} from '../types/session.types.js';

// Session schemas
export const createSessionSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
});

// Plan schemas
export const createPlanSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  practitionerId: z.string().min(1, 'Practitioner ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
});

export const updatePlanSchema = z.object({
  status: z.nativeEnum(PlanStatus).optional(),
});

// Action Item schemas
export const createActionItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
  target: z.string().optional(),
  frequency: z.string().optional(),
});

export const updateActionItemSchema = z.object({
  description: z.string().min(1, 'Description is required').optional(),
  category: z.string().optional(),
  target: z.string().optional(),
  frequency: z.string().optional(),
});

// Suggested Action Item schemas
export const updateSuggestedActionItemSchema = z.object({
  description: z.string().min(1, 'Description is required').optional(),
  category: z.string().optional(),
  target: z.string().optional(),
  frequency: z.string().optional(),
});

// Resource schemas
export const createResourceSchema = z.object({
  type: z.nativeEnum(ResourceType),
  url: z.string().url('Must be a valid URL'),
  title: z.string().optional(),
});

export const updateResourceSchema = z.object({
  type: z.nativeEnum(ResourceType).optional(),
  url: z.string().url('Must be a valid URL').optional(),
  title: z.string().optional(),
});

// Action Item Completion schemas
export const createActionItemCompletionSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  journalEntry: z.string().optional(),
  achievedValue: z.string().optional(),
});

export const updateActionItemCompletionSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  journalEntry: z.string().optional(),
  achievedValue: z.string().optional(),
});

// Type exports
export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
export type CreatePlanDto = z.infer<typeof createPlanSchema>;
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
export type CreateActionItemDto = z.infer<typeof createActionItemSchema>;
export type UpdateActionItemDto = z.infer<typeof updateActionItemSchema>;
export type UpdateSuggestedActionItemDto = z.infer<typeof updateSuggestedActionItemSchema>;
export type CreateResourceDto = z.infer<typeof createResourceSchema>;
export type UpdateResourceDto = z.infer<typeof updateResourceSchema>;
export type CreateActionItemCompletionDto = z.infer<typeof createActionItemCompletionSchema>;
export type UpdateActionItemCompletionDto = z.infer<typeof updateActionItemCompletionSchema>;
