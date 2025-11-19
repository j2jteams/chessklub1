// User roles
export type UserRole = 'owner' | 'admin' | null;

// User document structure in Firestore
export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Event document structure in Firestore
export interface EventData {
  id?: string;
  title: string;
  date: string;
  location: string;
  price: string;
  description?: string;
  image?: string;
  createdBy: string; // User UID
  createdByEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string; // Owner UID who approved
  approvedAt?: Date;
}

