import { useState } from 'react'
import './App.css'

type Product = {
  id: string
  name: string
  imageUrl: string
  upvotes: number
  downvotes: number
  date: string
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [nameInput, setNameInput] = useState('')
  const [imageInput, setImageInput] = useState('')

  function computeRequestedForDate(baseDate: Date = new Date()): Date {
    const year = baseDate.getFullYear()
    const monthIndex = baseDate.getMonth() // 0-11
    const day = baseDate.getDate()
    const lastDay = new Date(year, monthIndex + 1, 0).getDate()
    const lastSevenStart = lastDay - 6
    let targetMonthIndex = day >= lastSevenStart ? monthIndex + 2 : monthIndex + 1
    let targetYear = year
    if (targetMonthIndex >= 12) {
      targetMonthIndex -= 12
      targetYear += 1
    }
    return new Date(targetYear, targetMonthIndex, 1)
  }

  function formatMonthYear(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }

  function handleAddProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = nameInput.trim()
    const trimmedImage = imageInput.trim()
    if (!trimmedName) return

    const requestedFor = computeRequestedForDate(new Date())
    const newProduct: Product = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: trimmedName,
      imageUrl: trimmedImage || 'https://via.placeholder.com/300x200?text=Snack',
      upvotes: 0,
      downvotes: 0,
      date: new Date(Date.UTC(requestedFor.getFullYear(), requestedFor.getMonth(), requestedFor.getDate())).toISOString(),
    }
    setProducts((prev) => [newProduct, ...prev])
    setNameInput('')
    setImageInput('')
  }

  function handleVote(productId: string, type: 'up' | 'down') {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              upvotes: type === 'up' ? p.upvotes + 1 : p.upvotes,
              downvotes: type === 'down' ? p.downvotes + 1 : p.downvotes,
            }
          : p,
      ),
    )
  }

  return (
    <div className="app">
      <h1>Snack Requester</h1>

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
          />
        </div>
        <div className="field">
          <label>Requested for</label>
          <input
            type="text"
            value={formatMonthYear(computeRequestedForDate(new Date()))}
            readOnly
          />
        </div>
        <button className="add-btn" type="submit">Add Snack</button>
      </form>

      <div className="grid">
        {products.map((product) => {
          const netScore = product.upvotes - product.downvotes
          const requestedForLabel = formatMonthYear(new Date(product.date))
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
                <div className="requested-for">Requested for: {requestedForLabel}</div>
                <div className="vote-bar">
                  <button className="vote-btn up" onClick={() => handleVote(product.id, 'up')} aria-label={`Thumbs up for ${product.name}`}>
                    👍
                  </button>
                  <span className="count up-count" title="Upvotes">{product.upvotes}</span>
                  <button className="vote-btn down" onClick={() => handleVote(product.id, 'down')} aria-label={`Thumbs down for ${product.name}`}>
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
