import { type User } from 'firebase/auth'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PostListing from './components/PostListing'
import BuyTickets from './components/BuyTickets'

const App = () => {
  // Mock user for development - TODO: Re-enable authentication when ready
  const user = {
    uid: 'dev-user-123',
    email: 'dev@u.northwestern.edu',
    displayName: 'Dev User',
  } as User

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<Navigate to="/buy" replace />} />
          <Route path="buy" element={<BuyTickets user={user} />} />
          <Route path="post" element={<PostListing user={user} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
