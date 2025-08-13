import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

export type Product = {
  id?: string;
  name: string;
  imageUrl: string;
  upvotes: number;
  downvotes: number;
  userId?: string;
  createdAt?: Date;
  effectiveOrderMonth?: Date; // The month this snack will be ordered
};

// Calculate the effective month for ordering based on business rules
// Orders close 7 days before month end
export function calculateEffectiveOrderMonth(requestDate: Date): Date {
  const currentMonth = requestDate.getMonth();
  const currentYear = requestDate.getFullYear();
  const currentDay = requestDate.getDate();
  
  // Calculate the deadline for the current month (7 days before month end)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const deadlineDay = lastDayOfMonth - 7;
  
  if (currentDay <= deadlineDay) {
    // Request is before deadline, goes to next month's order
    return new Date(currentYear, currentMonth + 1, 1);
  } else {
    // Request is after deadline, goes to month after next month's order
    return new Date(currentYear, currentMonth + 2, 1);
  }
}

// Add a new product
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'effectiveOrderMonth'>): Promise<string> => {
  const now = new Date();
  const effectiveMonth = calculateEffectiveOrderMonth(now);
  
  const docRef = await addDoc(collection(db, 'products'), {
    ...product,
    createdAt: now,
    effectiveOrderMonth: effectiveMonth
  });
  return docRef.id;
};

// Update a product
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  const productRef = doc(db, 'products', id);
  await updateDoc(productRef, updates);
};

// Delete a product
export const deleteProduct = async (id: string): Promise<void> => {
  const productRef = doc(db, 'products', id);
  await deleteDoc(productRef);
};

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[];
};

// Get products filtered by month (using effective order month)
export const getProductsByMonth = async (year: number, month: number): Promise<Product[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  
  const q = query(
    collection(db, 'products'),
    where('effectiveOrderMonth', '>=', startTimestamp),
    where('effectiveOrderMonth', '<=', endTimestamp),
    orderBy('effectiveOrderMonth', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[];
};

// Listen to products changes in real-time
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  });
};

// Listen to products filtered by month in real-time (using effective order month)
export const subscribeToProductsByMonth = (year: number, month: number, callback: (products: Product[]) => void) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  
  const q = query(
    collection(db, 'products'),
    where('effectiveOrderMonth', '>=', startTimestamp),
    where('effectiveOrderMonth', '<=', endTimestamp),
    orderBy('effectiveOrderMonth', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  });
};
