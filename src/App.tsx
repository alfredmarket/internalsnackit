import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { signOutUser } from './firebase/auth'
import { subscribeToProducts, addProduct, updateProduct, type Product } from './firebase/database'
import Auth from './components/Auth'
import './App.css'
import { Link } from 'react-router-dom'
import { isAdmin } from './utils/auth'

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date)
}

type FirestoreTimestampLike = { toDate: () => Date }
function isFirestoreTimestamp(value: unknown): value is FirestoreTimestampLike {
  return typeof value === 'object' && value !== null && 'toDate' in (value as Record<string, unknown>) &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
}

function App() {
  const { user, loading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [nameInput, setNameInput] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      // Subscribe to real-time updates from Firestore
      const unsubscribe = subscribeToProducts((products) => {
        setProducts(products)
      })

      return () => unsubscribe()
    }
  }, [user])

  async function handleAddProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = nameInput.trim()
    const trimmedImage = imageInput.trim()
    if (!trimmedName || !user) return

    setIsLoading(true)
    try {
      await addProduct({
        name: trimmedName,
        imageUrl: trimmedImage || 'https://via.placeholder.com/300x200?text=Snack',
        upvotes: 0,
        downvotes: 0,
        userId: user.uid
      })
      setNameInput('')
      setImageInput('')
    } catch (error) {
      console.error('Error adding product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVote(productId: string, type: 'up' | 'down') {
    if (!productId) return

    const product = products.find(p => p.id === productId)
    if (!product) return

    try {
      await updateProduct(productId, {
        upvotes: type === 'up' ? product.upvotes + 1 : product.upvotes,
        downvotes: type === 'down' ? product.downvotes + 1 : product.downvotes,
      })
    } catch (error) {
      console.error('Error updating vote:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Snack Requester</h1>
        <div className="user-info">
          {isAdmin(user) && (
            <Link to="/admin" className="sign-out-btn" style={{ textDecoration: 'none' }}>
              Admin
            </Link>
          )}
          <span>Welcome, {user.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </header>

      <form className="add-form" onSubmit={handleAddProduct}>
        <div className="field">
          <label htmlFor="name">Product name</label>
          <input
            id="name"
            type="text"
            placeholder="e.g., Spicy Chips"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="field">
          <label htmlFor="image">Image URL (optional)</label>
          <input
            id="image"
            type="url"
            placeholder="https://..."
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button className="add-btn" type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Snack'}
        </button>
      </form>

      <div className="grid">
        {products.map((product) => {
          const netScore = product.upvotes - product.downvotes
          const createdAtUnknown = (product as { createdAt?: unknown }).createdAt
          let monthLabel = 'Unknown'
          if (createdAtUnknown instanceof Date) {
            monthLabel = formatMonthYear(createdAtUnknown)
          } else if (isFirestoreTimestamp(createdAtUnknown)) {
            monthLabel = formatMonthYear(createdAtUnknown.toDate())
          }

          return (
            <div key={product.id} className="card">
              <div className="image-wrap">
                <img
                  className="product-image"
                  src={product.imageUrl}
                  alt={product.name}
                  onError={(e) => {
                    const target = e.currentTarget
                    target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                  }}
                />
              </div>
              <div className="card-body">
                <h3 className="product-name">{product.name}</h3>
                <div className="requested-for">Added: {monthLabel}</div>
                <div className="vote-bar">
                  <button className="vote-btn up" onClick={() => handleVote(product.id!, 'up')} aria-label={`Thumbs up for ${product.name}`}>
                    👍
                  </button>
                  <span className="count up-count" title="Upvotes">{product.upvotes}</span>
                  <button className="vote-btn down" onClick={() => handleVote(product.id!, 'down')} aria-label={`Thumbs down for ${product.name}`}>
                    👎
                  </button>
                  <span className="count down-count" title="Downvotes">{product.downvotes}</span>
                  <span className={`net ${netScore >= 0 ? 'pos' : 'neg'}`} title="Net score">
                    {netScore >= 0 ? `+${netScore}` : netScore}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {products.length === 0 && (
          <div className="empty">No snacks yet. Add your first one!</div>
        )}
      </div>
    </div>
  )
}

export default App
