export type UserRole = 'user' | 'admin' | 'owner' | null;

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  savedEvents: string[];
  registeredEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected';
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

