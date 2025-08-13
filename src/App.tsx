import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { signOutUser } from './firebase/auth'
import { subscribeToProducts, subscribeToProductsByMonth, addProduct, updateProduct, type Product } from './firebase/database'
import Auth from './components/Auth'
import './App.css'
import { Link } from 'react-router-dom'

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date)
}

type FirestoreTimestampLike = { toDate: () => Date }
function isFirestoreTimestamp(value: unknown): value is FirestoreTimestampLike {
  return value instanceof Date || 
    typeof (value as { toDate?: unknown }).toDate === 'function'
}

function App() {
  const { user, loading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [nameInput, setNameInput] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    if (user) {
      let unsubscribe: () => void
      
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number)
        unsubscribe = subscribeToProductsByMonth(year, month, (products) => {
          setProducts(products)
        })
      } else {
        unsubscribe = subscribeToProducts((products) => {
          setProducts(products)
        })
      }

      return () => unsubscribe()
    }
  }, [user, selectedMonth])

  // Get current month for default value
  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(currentMonth)
  }, [])

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

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(event.target.value)
  }

  const clearMonthFilter = () => {
    setSelectedMonth('')
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
        <h1>Snack Request</h1>
        <div className="header-controls">
          <Link to="/admin" className="admin-link">Admin</Link>
          <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
        </div>
      </header>

      <form onSubmit={handleAddProduct} className="add-form">
        <div className="field">
          <label htmlFor="name">Snack Name</label>
          <input
            id="name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter snack name"
            disabled={isLoading}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="image">Image URL (optional)</label>
          <input
            id="image"
            type="url"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={isLoading}
          />
        </div>
        <div className="field">
          <label htmlFor="month">Filter by Month</label>
          <div className="month-filter-controls">
            <input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="month-input"
            />
            {selectedMonth && (
              <button 
                type="button" 
                onClick={clearMonthFilter}
                className="clear-filter-btn"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <button type="submit" className="add-btn" disabled={isLoading}>
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
                    target.src = 'https://via.placeholder.com/300x200?text=Snack'
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
          <div className="empty">
            {selectedMonth ? `No snacks added in ${formatMonthYear(new Date(selectedMonth + '-01'))}` : 'No snacks yet. Add your first one!'}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
