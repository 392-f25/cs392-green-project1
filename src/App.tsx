import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'
import SignIn from './components/SignIn'
import Layout from './components/Layout'
import PostListing from './components/PostListing'
import BuyTickets from './components/BuyTickets'
import MyListings from './components/MyListings'
import ChatPage from './components/ChatPage'

const App = () => {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600"></div>
          <p className="mt-4 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign-in page if not authenticated
  if (!user) {
    return <SignIn />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<Navigate to="/buy" replace />} />
          <Route path="buy" element={<BuyTickets user={user} />} />
          <Route path="post" element={<PostListing user={user} />} />
          <Route path="my-listings" element={<MyListings user={user} />} />
        </Route>
        <Route path="/chat/:chatId" element={<ChatPage user={user} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
