import {  useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

type Category = 'All Tickets' | 'Football' | 'Basketball' | "Women's Field Hockey"

type TicketListing = {
  id: number
  category: Category
  title: string
  gameDate: string
  price: number
  quantity: number
  section: string
  notes: string
  postedBy: string
}

type Offer = {
  listingId: number
  buyerName: string
  buyerEmail: string
  message: string
}

type FormState = {
  category: Category
  title: string
  gameDate: string
  price: string
  quantity: string
  section: string
  notes: string
}

const categories: Category[] = ['All Tickets', 'Football', 'Basketball', "Women's Field Hockey"]

const seedListings: TicketListing[] = [
  {
    id: 1,
    category: 'Football',
    title: 'Northwestern vs UCLA',
    gameDate: 'Sat · Oct 19 · 6:30 PM',
    price: 65,
    quantity: 1,
    section: 'Wildside 312',
    notes: 'Digital transfer through Wildside. Must be a Northwestern student.',
    postedBy: 'David Z.',
  },
  {
    id: 2,
    category: 'Football',
    title: 'Northwestern vs Wisconsin',
    gameDate: 'Sat · Nov 2 · 11:00 AM',
    price: 55,
    quantity: 2,
    section: 'Section 134 · Row 12',
    notes: 'Seats together. Will transfer as soon as Venmo is confirmed.',
    postedBy: 'Katie L.',
  },
  {
    id: 3,
    category: 'Basketball',
    title: 'Northwestern vs Purdue',
    gameDate: 'Wed · Jan 15 · 7:00 PM',
    price: 40,
    quantity: 2,
    section: 'Student Corner · GA',
    notes: 'Great view of the court. Pickup at Norris or digital transfer.',
    postedBy: 'Marcus H.',
  },
  {
    id: 4,
    category: "Women's Field Hockey",
    title: 'Northwestern vs Michigan',
    gameDate: 'Sun · Sep 29 · 1:00 PM',
    price: 12,
    quantity: 2,
    section: 'General Admission',
    notes: 'Can meet outside Lakeside Field 30 minutes before the match.',
    postedBy: 'Anya P.',
  },
]

const defaultOffer: Offer = {
  listingId: 1,
  buyerName: 'Joe Hampton',
  buyerEmail: 'joe.h@u.northwestern.edu',
  message: `Hi David! I saw your listing for the Northwestern vs UCLA game. I'm ready to take the ticket and can transfer Wildside points right now if it's still available. Let me know!`,
}

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All Tickets')
  const [listings, setListings] = useState<TicketListing[]>(seedListings)
  const [formData, setFormData] = useState<FormState>({
    category: 'Football',
    title: '',
    gameDate: '',
    price: '',
    quantity: '1',
    section: '',
    notes: '',
  })
  const [formError, setFormError] = useState('')
  const [activeOffer, setActiveOffer] = useState<Offer | null>(defaultOffer)
  const [phoneShared, setPhoneShared] = useState(false)
  // Track requested ticket IDs
  const [requestedTickets, setRequestedTickets] = useState<number[]>([])

  const filteredListings = useMemo(
    () =>
      selectedCategory === 'All Tickets'
        ? listings
        : listings.filter((listing) => listing.category === selectedCategory),
    [listings, selectedCategory],
  )

  const activeOfferListing = activeOffer
    ? listings.find((listing) => listing.id === activeOffer.listingId)
    : undefined

  const updateFormData = (updates: Partial<FormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target

    switch (name) {
      case 'category':
        updateFormData({ category: value as Category })
        break
      case 'title':
        updateFormData({ title: value })
        break
      case 'gameDate':
        updateFormData({ gameDate: value })
        break
      case 'price':
        updateFormData({ price: value })
        break
      case 'quantity':
        updateFormData({ quantity: value })
        break
      case 'section':
        updateFormData({ section: value })
        break
      case 'notes':
        updateFormData({ notes: value })
        break
      default:
        break
    }
  }

  const handleListingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!formData.title.trim() || !formData.gameDate.trim() || !formData.price.trim()) {
      setFormError('Please provide a title, date, and price to post your ticket.')
      return
    }

    const parsedPrice = Number.parseFloat(formData.price)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Enter a valid price greater than or equal to zero.')
      return
    }

    const parsedQuantity = Number.parseInt(formData.quantity, 10)
    const correctedQuantity = Number.isNaN(parsedQuantity) || parsedQuantity <= 0 ? 1 : parsedQuantity

    const newListing: TicketListing = {
      id: Date.now(),
      category: formData.category,
      title: formData.title.trim(),
      gameDate: formData.gameDate.trim(),
      price: Math.round(parsedPrice * 100) / 100,
      quantity: correctedQuantity,
      section: formData.section.trim() || 'General Admission',
      notes: formData.notes.trim(),
      postedBy: 'You',
    }

    setListings((prev) => [newListing, ...prev])
    setSelectedCategory(formData.category)
    setFormData((prev) => ({
      ...prev,
      title: '',
      gameDate: '',
      price: '',
      quantity: '1',
      section: '',
      notes: '',
    }))
  }

  // Handle request to buy (move to top-level)
  function handleRequestToBuy(listingId: number) {
    setRequestedTickets((prev) => [...prev, listingId])
  }

  const handleSimulateOffer = (listing: TicketListing) => {
    const buyers = [
      {
        name: 'Sasha Lee',
        email: 'sasha.lee@u.northwestern.edu',
        intro: 'I can meet at Norris tonight or send the transfer immediately.',
      },
      {
        name: 'Priya Natarajan',
        email: 'priya.n@u.northwestern.edu',
        intro: 'Happy to pay through Zelle and grab the tickets before practice.',
      },
      {
        name: 'Owen Ramirez',
        email: 'owen.r@u.northwestern.edu',
        intro: 'Let me know if the seats are still open — I need two together.',
      },
    ]

    const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)]

    setActiveOffer({
      listingId: listing.id,
      buyerName: randomBuyer.name,
      buyerEmail: randomBuyer.email,
      message: `Hey! I saw your post for ${listing.title} (${listing.gameDate}). ${randomBuyer.intro}`,
    })
    setPhoneShared(false)
  }

  const handleSharePhoneNumber = () => {
    setPhoneShared(true)
  }

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category)
  }

  const handleDismissOffer = () => {
    setActiveOffer(null)
    setPhoneShared(false)
  }

  const phoneNumber = '(312) 555-0184'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">TicketExchange</h1>
            <p className="text-sm text-slate-500">
              A trusted marketplace for Northwestern students to pass their tickets.
            </p>
          </div>
          <div className="rounded-full bg-violet-100 px-4 py-1 text-sm font-medium text-violet-700">
            Wildside verified community
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div className="flex flex-wrap gap-3">
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

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Available tickets</h2>
              <p className="text-sm text-slate-500">
                Browse student-to-student posts. Click “Simulate buyer offer” to see how offers arrive.
              </p>
            </div>

            {filteredListings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No tickets have been posted in this category yet. Post yours using the form on the right.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredListings.map((listing) => {
                  const isRequested = requestedTickets.includes(listing.id)
                  return (
                    <article
                      key={listing.id}
                      className={`flex h-full flex-col gap-4 rounded-lg border p-5 shadow-sm ${
                        isRequested
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {isRequested ? (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                          <h3 className="text-2xl font-bold text-emerald-700 mb-2">Thanks for requesting to buy!</h3>
                          <p className="text-sm text-emerald-800 mb-1">Your order and details have been sent to the seller.</p>
                          <p className="text-xs text-emerald-700">If the seller accepts your contact request, you will receive an email with the seller's phone number and email to continue communication.</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-violet-500">{listing.category}</p>
                              <h3 className="text-lg font-semibold text-slate-900">{listing.title}</h3>
                              <p className="text-sm text-slate-500">{listing.gameDate}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-slate-900">${listing.price.toFixed(2)}</p>
                              <p className="text-xs text-slate-500">{listing.quantity} ticket{listing.quantity > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            <p className="font-medium text-slate-700">Section</p>
                            <p>{listing.section}</p>
                          </div>
                          {listing.notes && (
                            <p className="text-sm text-slate-600">{listing.notes}</p>
                          )}
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3 text-sm text-slate-500">
                            <span>Posted by {listing.postedBy}</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                                onClick={() => handleRequestToBuy(listing.id)}
                              >
                                Request to buy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSimulateOffer(listing)}
                                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                              >
                                Simulate buyer offer
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Post a ticket</h2>
              <p className="text-sm text-slate-500">Share details so classmates can reach out with offers.</p>
            </div>
            <form className="space-y-4" onSubmit={handleListingSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="title">
                  Opponent or event name
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Northwestern vs UCLA"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="gameDate">
                  Date & time
                </label>
                <input
                  id="gameDate"
                  name="gameDate"
                  value={formData.gameDate}
                  onChange={handleFormChange}
                  placeholder="Sat · Oct 19 · 6:30 PM"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="price">
                    Price per ticket
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="65"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="quantity">
                    Number of tickets
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="section">
                  Section or transfer details
                </label>
                <input
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleFormChange}
                  placeholder="Wildside 312"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                  Notes for buyers
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Can meet before the game or transfer digitally."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>
              {formError && <p className="text-sm text-rose-600">{formError}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Post ticket
              </button>
            </form>
          </section>

          <section className="space-y-4 rounded-lg border border-violet-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Incoming offer</h2>
                <p className="text-sm text-slate-500">
                  Incoming offers from students interested in your tickets will appear here.
                </p>
              </div>
              {activeOffer && (
                <button
                  type="button"
                  onClick={handleDismissOffer}
                  className="text-xs font-medium text-slate-400 underline underline-offset-2 hover:text-slate-600"
                >
                  Dismiss
                </button>
              )}
            </div>

            {activeOffer && activeOfferListing ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-wide text-violet-500">Ticket</p>
                  <p className="font-medium text-slate-800">{activeOfferListing.title}</p>
                  <p>{activeOfferListing.gameDate}</p>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">From {activeOffer.buyerName}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{activeOffer.buyerEmail}</p>
                  <p>{activeOffer.message}</p>
                </div>
                {!phoneShared ? (
                  <button
                    type="button"
                    onClick={handleSharePhoneNumber}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Share phone number
                  </button>
                ) : (
                  <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                    <p>
                      You shared <span className="font-semibold">{phoneNumber}</span> with {activeOffer.buyerName}. We also sent them an email so you can finish the transfer.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No active offers yet. Choose “Simulate buyer offer” on any ticket to preview the flow.
              </div>
            )}
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
