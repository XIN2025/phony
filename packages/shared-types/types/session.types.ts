// Session-related types for the AI-assisted therapy platform

export enum SessionStatus {
  UPLOADING = 'UPLOADING',
  TRANSCRIBING = 'TRANSCRIBING',
  AI_PROCESSING = 'AI_PROCESSING',
  REVIEW_READY = 'REVIEW_READY',
  COMPLETED = 'COMPLETED',
}

export enum PlanStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum SuggestedActionItemStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ActionItemSource {
  AI_SUGGESTED = 'AI_SUGGESTED',
  MANUAL = 'MANUAL',
}

export enum ResourceType {
  LINK = 'LINK',
  PDF = 'PDF',
}

export interface Session {
  id: string;
  practitionerId: string;
  clientId: string;
  title?: string;
  notes?: string;
  recordedAt: Date;
  status: SessionStatus;
  audioFileUrl?: string;
  transcript?: string;
  filteredTranscript?: string;
  aiSummary?: string;
  transcriptionJobId?: string;
}

export interface SuggestedActionItem {
  id: string;
  planId: string;
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
  status: SuggestedActionItemStatus;
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  planId: string;
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
  source: ActionItemSource;
  resources?: Resource[];
  completions?: ActionItemCompletion[];
}

export interface Resource {
  id: string;
  actionItemId: string;
  type: ResourceType;
  url: string;
  title?: string;
}

export interface ActionItemCompletion {
  id: string;
  actionItemId: string;
  clientId: string;
  completedAt: Date;
  rating?: number;
  journalEntry?: string;
  achievedValue?: string;
}

export interface Plan {
  id: string;
  sessionId: string;
  practitionerId: string;
  clientId: string;
  status: PlanStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  actionItems?: ActionItem[];
  suggestedActionItems?: SuggestedActionItem[];
  session?: {
    id: string;
    recordedAt: Date;
    status: SessionStatus;
    transcript?: string;
    filteredTranscript?: string;
    aiSummary?: string;
  };
  practitioner?: {
    id: string;
    firstName: string;
    lastName?: string;
    profession?: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
  };
}

// API request/response types
export interface CreateSessionRequest {
  clientId: string;
  title?: string;
  notes?: string;
}

export interface UpdateSessionRequest {
  title?: string;
  notes?: string;
  status?: SessionStatus;
}

export interface CreateActionItemRequest {
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
}

export interface UpdateSuggestedActionItemRequest {
  description?: string;
  category?: string;
  target?: string;
  frequency?: string;
}

// AI-related types
export interface SessionSummary {
  title: string;
  summary: string;
}

export interface ActionItemSuggestion {
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
}

export interface ActionItemSuggestions {
  suggestions: ActionItemSuggestion[];
}

export interface AIProcessingResult {
  filteredTranscript: string;
  summary: SessionSummary;
  actionItemSuggestions: ActionItemSuggestions;
}
