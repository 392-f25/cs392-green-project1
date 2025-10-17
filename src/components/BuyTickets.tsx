import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
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
  pendingBuyerId?: string | null
  pendingBuyerName?: string | null
  pendingBuyerEmail?: string | null
}

const categories: Category[] = ['All Tickets', 'Football', 'Basketball', "Women's Field Hockey"]

type Props = {
  user: User
  onStartChat: () => void
}

const BuyTickets = ({ user, onStartChat }: Props) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All Tickets')
  const [listings, setListings] = useState<TicketListing[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmModalListing, setConfirmModalListing] = useState<TicketListing | null>(null)

  useEffect(() => {
    // Query available listings
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'available')
    )

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

  // Only show tickets that are not pending for another buyer
  const visibleListings = listings.filter(
    (listing) => !listing.pendingBuyerId || listing.pendingBuyerId === ''
  );
  const filteredListings =
    selectedCategory === 'All Tickets'
      ? visibleListings
      : visibleListings.filter((listing) => listing.category === selectedCategory)

  const handleBuyClick = (listing: TicketListing) => {
    setConfirmModalListing(listing)
  }

  // Accept callback from Layout to switch to MyChats and highlight chat
  const handleConfirmPurchase = async () => {
    if (!confirmModalListing) return;
    setConfirmModalListing(null);
    try {
      // Mark ticket as pending for this buyer
      const ticketRef = doc(db, 'listings', confirmModalListing.id);
      await updateDoc(ticketRef, {
        pendingBuyerId: user.uid,
        pendingBuyerName: user.displayName || user.email || 'User',
        pendingBuyerEmail: user.email || '',
      });

      // Always create a new chat between buyer and seller for this ticket
      // Look up seller in users collection to get correct UID
      const usersRef = collection(db, 'users');
      const sellerQ = query(usersRef, where('email', '==', confirmModalListing.sellerEmail));
      const sellerSnap = await getDocs(sellerQ);
      let sellerUid = confirmModalListing.sellerId;
      let sellerName = confirmModalListing.sellerName;
      let sellerEmail = confirmModalListing.sellerEmail;
      if (!sellerSnap.empty) {
        const sellerDoc = sellerSnap.docs[0].data();
        sellerUid = sellerDoc.uid;
        sellerName = sellerDoc.displayName || sellerName;
        sellerEmail = sellerDoc.email || sellerEmail;
      }

      const chatsRef = collection(db, 'chats');
      // Check if a chat already exists for this ticket and these participants
      const chatQ = query(
        chatsRef,
        where('ticketId', '==', confirmModalListing.id),
        where('participants', 'array-contains', user.uid)
      );
      const chatSnap = await getDocs(chatQ);
      if (chatSnap.empty) {
        // Create new chat
        await addDoc(chatsRef, {
          ticketId: confirmModalListing.id,
          participants: [user.uid, sellerUid],
          buyerId: user.uid,
          buyerName: user.displayName || user.email || 'User',
          buyerEmail: user.email || '',
          sellerId: sellerUid,
          sellerName: sellerName,
          sellerEmail: sellerEmail,
          createdAt: serverTimestamp(),
        });
      }
    } finally {
      // Switch to My Chats tab
      onStartChat();
    }
  };

  const handleCancelPurchase = () => {
    setConfirmModalListing(null)
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
    <>
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
                        onClick={() => handleBuyClick(listing)}
                        className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        Buy Ticket
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Confirm Purchase</h2>
            <div className="mb-6 space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Event</p>
                <p className="text-base text-slate-900">{confirmModalListing.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Date & Time</p>
                <p className="text-base text-slate-900">{confirmModalListing.gameDate}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Price</p>
                  <p className="text-base text-slate-900">${confirmModalListing.price.toFixed(2)} per ticket</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Quantity</p>
                  <p className="text-base text-slate-900">{confirmModalListing.quantity} ticket{confirmModalListing.quantity > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Section</p>
                <p className="text-base text-slate-900">{confirmModalListing.section}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Seller</p>
                <p className="text-base text-slate-900">{confirmModalListing.sellerName}</p>
              </div>
              {confirmModalListing.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Notes</p>
                  <p className="text-base text-slate-900">{confirmModalListing.notes}</p>
                </div>
              )}
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6">
              <p className="text-sm text-amber-800">
                Are you sure you want to contact the seller to purchase this ticket?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelPurchase}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default BuyTickets

