import { addDoc, collection } from 'firebase/firestore'
import { db } from './config'

export type OrderItem = {
  id: string
  name: string
  imageUrl: string
  upvotes: number
  downvotes: number
}

export type Order = {
  items: OrderItem[]
  createdBy: string
  createdAt: Date
  totalNetScore: number
}

export async function addOrder(order: Order): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), order)
  return docRef.id
}
