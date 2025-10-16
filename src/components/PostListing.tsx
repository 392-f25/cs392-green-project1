import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import ClockTimePicker from './ClockTimePicker'

type Category = 'Football' | 'Basketball' | "Women's Field Hockey"

type FormState = {
  category: Category
  title: string
  gameDate: string
  gameTime: string
  allDay: boolean
  price: string
  quantity: string
  section: string
  notes: string
}

const categories: Category[] = ['Football', 'Basketball', "Women's Field Hockey"]

type Props = {
  user: User
}

const PostListing = ({ user }: Props) => {
  const [formData, setFormData] = useState<FormState>({
    category: 'Football',
    title: '',
    gameDate: '',
    gameTime: '',
    allDay: false,
    price: '',
    quantity: '1',
    section: '',
    notes: '',
  })
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      case 'gameTime':
        updateFormData({ gameTime: value })
        break
      case 'allDay':
        updateFormData({ allDay: (event.target as HTMLInputElement).checked })
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

  const handleListingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    if (!formData.title.trim() || !formData.gameDate.trim() || !formData.price.trim()) {
      setFormError('Please provide a title, date, and price to post your ticket.')
      return
    }

    if (!formData.allDay && !formData.gameTime.trim()) {
      setFormError('Please provide a time for the event or check "All day".')
      return
    }

    const parsedPrice = Number.parseFloat(formData.price)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Enter a valid price greater than or equal to zero.')
      return
    }

    const parsedQuantity = Number.parseInt(formData.quantity, 10)
    const correctedQuantity = Number.isNaN(parsedQuantity) || parsedQuantity <= 0 ? 1 : parsedQuantity

    setIsSubmitting(true)

    try {
      // Add listing to Firestore
      await addDoc(collection(db, 'listings'), {
        category: formData.category,
        title: formData.title.trim(),
        gameDate: formData.allDay
          ? formData.gameDate.trim()
          : formData.gameTime
          ? `${formData.gameDate} ${formData.gameTime}`
          : formData.gameDate.trim(),
        price: Math.round(parsedPrice * 100) / 100,
        quantity: correctedQuantity,
        section: formData.section.trim() || 'General Admission',
        notes: formData.notes.trim(),
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
        sellerEmail: user.email || '',
        buyerId: null,
        buyerName: null,
        buyerEmail: null,
        status: 'available',
        createdAt: serverTimestamp(),
      })

      setSuccessMessage('Ticket posted successfully!')
      
      // Reset form
      setFormData({
        category: 'Football',
        title: '',
        gameDate: '',
        gameTime: '',
        allDay: false,
        price: '',
        quantity: '1',
        section: '',
        notes: '',
      })

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error posting listing:', error)
      setFormError('Failed to post listing. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Post a Ticket</h1>
          <p className="mt-2 text-slate-600">
            Share your ticket details so other students can find and purchase them.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleListingSubmit}>
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
                Opponent or Event Name
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
                Date & Time
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="gameDate"
                  name="gameDate"
                  type="date"
                  value={formData.gameDate}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  required
                />

                <ClockTimePicker
                  value={formData.gameTime}
                  onChange={(time) => updateFormData({ gameTime: time })}
                  disabled={formData.allDay}
                />

                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    id="allDay"
                    name="allDay"
                    type="checkbox"
                    checked={formData.allDay}
                    onChange={handleFormChange}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  All day
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">Pick a date and time — or check "All day" if time doesn't apply.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="price">
                  Price per Ticket
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
                  Number of Tickets
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
                Section or Transfer Details
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
                Notes for Buyers
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Can meet before the game or transfer digitally."
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {formError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PostListing

