// Chat types - separated for clean imports

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  user_id?: string;
  title?: string;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}
