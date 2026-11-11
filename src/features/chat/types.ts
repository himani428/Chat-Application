export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type Filter = 'all' | 'unread' | 'groups';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
  status: DeliveryStatus;
  replyToId?: string;
  edited?: boolean;
  deleted?: boolean;
  /** emoji -> ids of users who reacted */
  reactions: Record<string, string[]>;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  memberIds: string[];
  unread: number;
  lastMessageAt: number;
}

export interface ChatData {
  users: Record<string, User>;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
}

export const ME = 'me';
