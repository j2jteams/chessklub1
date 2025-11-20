import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserData, UserRole } from './types';

function fromFirestoreUser(data: any): UserData {
  return {
    uid: data.uid,
    email: data.email,
    role: (data.role ?? 'user') as UserRole,
    savedEvents: data.savedEvents ?? [],
    registeredEvents: data.registeredEvents ?? [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function createUserDocument(uid: string, email: string, role: UserRole = 'user') {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(userRef, {
    uid,
    email,
    role,
    savedEvents: [],
    registeredEvents: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return 'user';
  }

  return (snapshot.data().role ?? 'user') as UserRole;
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return fromFirestoreUser(snapshot.data());
}

export async function updateUserRole(uid: string, role: UserRole) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllUsers(): Promise<UserData[]> {
  const usersSnap = await getDocs(collection(db, 'users'));
  return usersSnap.docs.map((docSnap) => fromFirestoreUser(docSnap.data()));
}

export async function isOwner(uid: string) {
  const role = await getUserRole(uid);
  return role === 'owner';
}

export async function isAdminOrOwner(uid: string) {
  const role = await getUserRole(uid);
  return role === 'admin' || role === 'owner';
}

