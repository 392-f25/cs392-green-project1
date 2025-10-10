import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

type Category = 'All Tickets' | 'Football' | 'Basketball' | "Women's Field Hockey"

type TicketListing = {
  id: string
  category: string
  title: string
  gameDate: string
  price: number
  quantity: number
  section: string
  notes: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  buyerId: string | null
  buyerName: string | null
  buyerEmail: string | null
  status: 'available' | 'sold'
}

const categories: Category[] = ['All Tickets', 'Football', 'Basketball', "Women's Field Hockey"]

type Props = {
  user: User
}

const BuyTickets = ({ user }: Props) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All Tickets')
  const [listings, setListings] = useState<TicketListing[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)

  useEffect(() => {
    // Query available listings
    const q = query(collection(db, 'listings'), where('status', '==', 'available'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listingsData: TicketListing[] = []
      snapshot.forEach((doc) => {
        listingsData.push({ id: doc.id, ...doc.data() } as TicketListing)
      })
      // Sort by creation date (newest first)
      listingsData.sort((a, b) => b.id.localeCompare(a.id))
      setListings(listingsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredListings =
    selectedCategory === 'All Tickets'
      ? listings
      : listings.filter((listing) => listing.category === selectedCategory)

  const handleBuy = async (listingId: string) => {
    setPurchasingId(listingId)

    try {
      const listingRef = doc(db, 'listings', listingId)
      await updateDoc(listingRef, {
        buyerId: user.uid,
        buyerName: user.displayName || 'Anonymous',
        buyerEmail: user.email || '',
        status: 'sold',
      })

      // The listing will be automatically removed from view due to the real-time listener
      setTimeout(() => {
        setPurchasingId(null)
      }, 1000)
    } catch (error) {
      console.error('Error purchasing ticket:', error)
      alert('Failed to purchase ticket. Please try again.')
      setPurchasingId(null)
    }
  }

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600"></div>
          <p className="mt-4 text-sm text-slate-600">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Buy Tickets</h1>
          <p className="mt-2 text-slate-600">
            Browse available tickets posted by Northwestern students.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryClick(category)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedCategory === category
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-medium text-slate-600">No tickets available</p>
            <p className="mt-2 text-sm text-slate-500">
              {selectedCategory === 'All Tickets'
                ? 'No tickets have been posted yet. Check back later!'
                : `No ${selectedCategory} tickets available at the moment.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => {
              const isPurchasing = purchasingId === listing.id
              const isOwnListing = listing.sellerId === user.uid

              return (
                <article
                  key={listing.id}
                  className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wide text-violet-500">
                      {listing.category}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">{listing.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{listing.gameDate}</p>
                  </div>

                  <div className="mb-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${listing.price.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        per ticket
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">
                      {listing.quantity} ticket{listing.quantity > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="mb-4 rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium text-slate-700">Section</p>
                    <p className="mt-1 text-sm text-slate-900">{listing.section}</p>
                  </div>

                  {listing.notes && (
                    <p className="mb-4 text-sm text-slate-600">{listing.notes}</p>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <p className="mb-3 text-xs text-slate-500">
                      Posted by {listing.sellerName}
                    </p>
                    
                    {isOwnListing ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
                      >
                        Your Listing
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuy(listing.id)}
                        disabled={isPurchasing}
                        className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPurchasing ? 'Processing...' : 'Buy Ticket'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyTickets

