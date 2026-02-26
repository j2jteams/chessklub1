/**
 * Firestore Pagination Utilities
 * Safe pagination for subcollection reads
 */

import { Firestore } from "firebase-admin/firestore";

export interface PaginationOptions {
  pageSize: number;
  startAfter?: FirebaseFirestore.DocumentSnapshot;
}

export interface PaginationResult<T> {
  items: T[];
  lastDoc: FirebaseFirestore.DocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Paginate a Firestore query
 */
export async function paginateQuery<T>(
  query: FirebaseFirestore.Query,
  options: PaginationOptions
): Promise<PaginationResult<T>> {
  let q = query.limit(options.pageSize);

  if (options.startAfter) {
    q = q.startAfter(options.startAfter);
  }

  const snapshot = await q.get();

  const items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];

  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  const hasMore = snapshot.docs.length === options.pageSize;

  return {
    items,
    lastDoc,
    hasMore,
  };
}

/**
 * Get all documents from a subcollection with pagination
 */
export async function getAllSubcollectionDocs<T>(
  db: Firestore,
  parentCollection: string,
  parentId: string,
  subcollection: string,
  pageSize: number = 100
): Promise<T[]> {
  const allItems: T[] = [];
  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
  let hasMore = true;

  const baseQuery = db
    .collection(parentCollection)
    .doc(parentId)
    .collection(subcollection);

  while (hasMore) {
    const result: PaginationResult<T> = await paginateQuery<T>(baseQuery, {
      pageSize,
      startAfter: lastDoc || undefined,
    });

    allItems.push(...result.items);
    lastDoc = result.lastDoc;
    hasMore = result.hasMore;
  }

  return allItems;
}

