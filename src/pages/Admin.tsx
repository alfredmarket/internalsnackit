import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../utils/auth'
import { subscribeToProducts, subscribeToProductsByMonth, deleteProduct, type Product } from '../firebase/database'
import { addOrder } from '../firebase/orders'
import { useNavigate } from 'react-router-dom'

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date)
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    if (!loading && !isAdmin(user)) {
      navigate('/')
    }
  }, [loading, user, navigate])

  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(currentMonth)
  }, [])

  useEffect(() => {
    let unsub: () => void
    
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number)
      unsub = subscribeToProductsByMonth(year, month, setProducts)
    } else {
      unsub = subscribeToProducts(setProducts)
    }
    
    return () => unsub()
  }, [selectedMonth])

  const handlePurchaseOne = async (product: Product) => {
    if (!user || !product.id) return
    setError('')
    setSubmittingId(product.id)
    try {
      await addOrder({
        items: [{ id: product.id, name: product.name, imageUrl: product.imageUrl, upvotes: product.upvotes, downvotes: product.downvotes }],
        createdBy: user.uid,
        createdAt: new Date(),
        totalNetScore: product.upvotes - product.downvotes,
      })
      await deleteProduct(product.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create order')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(event.target.value)
  }

  const clearMonthFilter = () => {
    setSelectedMonth('')
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!isAdmin(user)) return null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Admin</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="month-filter-section">
        <div className="field">
          <label htmlFor="admin-month">Filter by Month</label>
          <div className="month-filter-controls">
            <input
              id="admin-month"
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
      </div>

      <div className="grid">
        {products.map((product) => {
          const net = product.upvotes - product.downvotes
          const isSubmitting = submittingId === product.id
          return (
            <div key={product.id} className="card">
              <div className="image-wrap">
                <img className="product-image" src={product.imageUrl} alt={product.name} />
              </div>
              <div className="card-body">
                <h3 className="product-name">{product.name}</h3>
                <div className="vote-bar">
                  <span className="count up-count" title="Upvotes">👍 {product.upvotes}</span>
                  <span className="count down-count" title="Downvotes">👎 {product.downvotes}</span>
                  <span className={`net ${net >= 0 ? 'pos' : 'neg'}`} title="Net score">
                    {net >= 0 ? `+${net}` : net}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <button className="add-btn" onClick={() => handlePurchaseOne(product)} disabled={isSubmitting}>
                    {isSubmitting ? 'Purchasing...' : 'Purchase'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {products.length === 0 && (
          <div className="empty">
            {selectedMonth ? `No products to purchase in ${formatMonthYear(new Date(selectedMonth + '-01'))}` : 'No products to purchase'}
          </div>
        )}
      </div>
    </div>
  )
}
