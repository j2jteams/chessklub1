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

export interface EventData {
  id?: string;
  title: string;
  date: string;
  location: string;
  price: string;
  description?: string;
  image?: string;
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

