// UPDATED: role-based routing and approval flows - Phase 0.5
export type UserRole = 'player' | 'admin' | 'owner' | null;

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  isGodOwner?: boolean; // UPDATED: God Owner system - only God Owner can transfer ownership
  savedEvents: string[];
  registeredEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventStatus = 'draft' | 'pendingApproval' | 'approved' | 'rejected';
export type EventCategory = 'tournament' | 'event' | 'workshop' | 'simul' | 'other';

export interface EventData {
  id?: string;
  title: string;
  date: string;
  time?: string; // e.g., "10:00 AM - 5:00 PM" or "9:00 AM"
  location: string;
  price: string;
  description?: string;
  image?: string;
  category: EventCategory; // Tournament, Event, Workshop, Simul, or Other
  contactEmail?: string; // Contact email for the event
  contactPhone?: string; // Contact phone for the event
  createdBy: string;
  createdByEmail: string;
  status: EventStatus;
  registeredUsers: string[];
  savedByUsers: string[];
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

