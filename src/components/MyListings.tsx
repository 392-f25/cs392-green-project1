import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

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

type InterestedBuyer = {
  buyerId: string
  buyerName: string
  buyerEmail: string
  chatId: string
}

type Props = {
  user: User
}

const MyListings = ({ user }: Props) => {
  const [listings, setListings] = useState<TicketListing[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [interestedBuyers, setInterestedBuyers] = useState<Record<string, InterestedBuyer[]>>({})
  const [sellingTo, setSellingTo] = useState<string | null>(null)

  useEffect(() => {
    // Query listings where the current user is the seller
    const q = query(collection(db, 'listings'), where('sellerId', '==', user.uid))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const listingsData: TicketListing[] = []
      snapshot.forEach((doc) => {
        listingsData.push({ id: doc.id, ...doc.data() } as TicketListing)
      })
      // Sort by creation date (newest first)
      listingsData.sort((a, b) => b.id.localeCompare(a.id))
      setListings(listingsData)
      
      // Fetch interested buyers for each available listing
      const buyersMap: Record<string, InterestedBuyer[]> = {}
      for (const listing of listingsData) {
        if (listing.status === 'available') {
          const chatsQuery = query(
            collection(db, 'chats'),
            where('ticketId', '==', listing.id),
            where('sellerId', '==', user.uid)
          )
          const chatsSnapshot = await getDocs(chatsQuery)
          const buyers: InterestedBuyer[] = []
          chatsSnapshot.forEach((chatDoc) => {
            const chatData = chatDoc.data()
            buyers.push({
              buyerId: chatData.buyerId,
              buyerName: chatData.buyerName,
              buyerEmail: chatData.buyerEmail,
              chatId: chatDoc.id,
            })
          })
          buyersMap[listing.id] = buyers
        }
      }
      setInterestedBuyers(buyersMap)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user.uid])

  const handleDelete = async (listingId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing? This action cannot be undone.'
    )

    if (!confirmed) return

    setDeletingId(listingId)

    try {
      const listingRef = doc(db, 'listings', listingId)
      await deleteDoc(listingRef)
      // The listing will be automatically removed from view due to the real-time listener
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Failed to delete listing. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSellTo = async (listingId: string, buyer: InterestedBuyer) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this ticket as sold to ${buyer.buyerName}?`
    )

    if (!confirmed) return

    setSellingTo(listingId)

    try {
      const listingRef = doc(db, 'listings', listingId)
      await updateDoc(listingRef, {
        buyerId: buyer.buyerId,
        buyerName: buyer.buyerName,
        buyerEmail: buyer.buyerEmail,
        status: 'sold',
        pendingBuyerId: null,
        pendingBuyerName: null,
        pendingBuyerEmail: null,
      })
      alert(`Ticket marked as sold to ${buyer.buyerName}!`)
    } catch (error) {
      console.error('Error marking ticket as sold:', error)
      alert('Failed to mark ticket as sold. Please try again.')
    } finally {
      setSellingTo(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600"></div>
          <p className="mt-4 text-sm text-slate-600">Loading your listings...</p>
        </div>
      </div>
    )
  }

  const availableListings = listings.filter((listing) => listing.status === 'available')
  const soldListings = listings.filter((listing) => listing.status === 'sold')

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Listings</h1>
          <p className="mt-2 text-slate-600">
            Manage your posted tickets. You can delete listings at any time.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-medium text-slate-600">No listings yet</p>
            <p className="mt-2 text-sm text-slate-500">
              You haven't posted any tickets. Go to the "Post Ticket" page to create your first listing!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Available Listings */}
            {availableListings.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">
                  Available ({availableListings.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableListings.map((listing) => {
                    const isDeleting = deletingId === listing.id
                    const isSelling = sellingTo === listing.id
                    const buyers = interestedBuyers[listing.id] || []

                    return (
                      <article
                        key={listing.id}
                        className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-wide text-violet-500">
                            {listing.category}
                          </p>
                          <h3 className="mt-1 text-xl font-semibold text-slate-900">
                            {listing.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">{listing.gameDate}</p>
                        </div>

                        <div className="mb-4 flex items-baseline justify-between">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              ${listing.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">per ticket</p>
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

                        {/* Interested Buyers Section */}
                        {buyers.length > 0 && (
                          <div className="mb-4 rounded-lg bg-violet-50 border border-violet-200 p-3">
                            <p className="text-xs font-semibold text-violet-900 mb-2">
                              Interested Buyers ({buyers.length})
                            </p>
                            <div className="space-y-2">
                              {buyers.map((buyer) => (
                                <div
                                  key={buyer.buyerId}
                                  className="flex items-center justify-between gap-2 rounded bg-white p-2"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                      {buyer.buyerName}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                      {buyer.buyerEmail}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSellTo(listing.id, buyer)}
                                    disabled={isSelling}
                                    className="flex-shrink-0 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isSelling ? '...' : 'Sell'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {buyers.length === 0 && (
                          <div className="mb-4 rounded-lg bg-slate-100 border border-slate-200 p-3 text-center">
                            <p className="text-xs text-slate-600">No offers yet</p>
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleDelete(listing.id)}
                            disabled={isDeleting}
                            className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete Listing'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sold Listings */}
            {soldListings.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">
                  Sold ({soldListings.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {soldListings.map((listing) => {
                    const isDeleting = deletingId === listing.id

                    return (
                      <article
                        key={listing.id}
                        className="flex h-full flex-col rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm opacity-75"
                      >
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wide text-violet-500">
                              {listing.category}
                            </p>
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                              Sold
                            </span>
                          </div>
                          <h3 className="mt-1 text-xl font-semibold text-slate-900">
                            {listing.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">{listing.gameDate}</p>
                        </div>

                        <div className="mb-4 flex items-baseline justify-between">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">
                              ${listing.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">per ticket</p>
                          </div>
                          <p className="text-sm text-slate-600">
                            {listing.quantity} ticket{listing.quantity > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="mb-4 rounded-md bg-white px-3 py-2">
                          <p className="text-xs font-medium text-slate-700">Section</p>
                          <p className="mt-1 text-sm text-slate-900">{listing.section}</p>
                        </div>

                        {listing.buyerName && (
                          <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
                            <p className="text-xs font-medium text-emerald-700">Sold to</p>
                            <p className="mt-1 text-sm text-slate-900">{listing.buyerName}</p>
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleDelete(listing.id)}
                            disabled={isDeleting}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? 'Deleting...' : 'Remove from History'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyListings
