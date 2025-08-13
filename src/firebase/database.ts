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
};

// Add a new product
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'products'), {
    ...product,
    createdAt: new Date()
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

// Get products filtered by month
export const getProductsByMonth = async (year: number, month: number): Promise<Product[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  
  const q = query(
    collection(db, 'products'),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    orderBy('createdAt', 'desc')
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

// Listen to products filtered by month in real-time
export const subscribeToProductsByMonth = (year: number, month: number, callback: (products: Product[]) => void) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  
  const q = query(
    collection(db, 'products'),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  });
};
