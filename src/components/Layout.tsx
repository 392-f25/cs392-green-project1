import { Link, Outlet, useLocation } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useState, useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import ChatWidget from './ChatWidget'

type Props = {
  user: User
}

interface ActiveChat {
  id: string;
  ticketId: string;
  ticketTitle: string;
  otherUserName: string;
  otherUserId: string;
  lastMessageTime: any;
  unreadCount: number;
}

const Layout = ({ user }: Props) => {
  const location = useLocation()
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([])
  const [showChatList, setShowChatList] = useState(false)
  const [openChatId, setOpenChatId] = useState<string | null>(null)
  const chatDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Listen for chats where user is a participant
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chats: ActiveChat[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();
        
        // Get ticket info
        const ticketRef = doc(db, 'listings', chatData.ticketId);
        const ticketSnap = await getDoc(ticketRef);
        const ticketData = ticketSnap.exists() ? ticketSnap.data() : null;
        
        // Determine the other user
        const isSeller = chatData.sellerId === user.uid;
        const otherUserName = isSeller ? chatData.buyerName : chatData.sellerName;
        const otherUserId = isSeller ? chatData.buyerId : chatData.sellerId;
        
        chats.push({
          id: chatDoc.id,
          ticketId: chatData.ticketId,
          ticketTitle: ticketData?.title || 'Unknown Ticket',
          otherUserName: otherUserName || 'Unknown User',
          otherUserId: otherUserId,
          lastMessageTime: chatData.createdAt,
          unreadCount: 0, // We can implement this later if needed
        });
      }
      
      setActiveChats(chats);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (chatDropdownRef.current && !chatDropdownRef.current.contains(event.target as Node)) {
        setShowChatList(false);
      }
    };

    if (showChatList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatList]);

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const handleOpenChat = (chatId: string) => {
    setOpenChatId(chatId);
    setShowChatList(false);
  }

  const handleCloseChat = () => {
    setOpenChatId(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/buy" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-slate-900">TicketExchange</h1>
              </Link>
              
              <nav className="hidden md:flex gap-4">
                <Link
                  to="/buy"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive('/buy') || isActive('/')
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Buy Tickets
                </Link>
                <Link
                  to="/post"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive('/post')
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Post Ticket
                </Link>
                <Link
                  to="/my-listings"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive('/my-listings')
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  My Listings
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Chat Button */}
              <div className="relative" ref={chatDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowChatList(!showChatList)}
                  className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  title="Messages"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {activeChats.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                      {activeChats.length}
                    </span>
                  )}
                </button>

                {/* Chat List Dropdown */}
                {showChatList && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-xl z-50">
                    <div className="border-b border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-900">Messages</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {activeChats.length === 0 ? (
                        <div className="p-8 text-center">
                          <svg className="h-12 w-12 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="text-sm text-slate-500">No active chats</p>
                          <p className="text-xs text-slate-400 mt-1">Start a conversation by buying a ticket</p>
                        </div>
                      ) : (
                        activeChats.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => handleOpenChat(chat.id)}
                            className="w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">{chat.otherUserName}</p>
                                <p className="text-sm text-slate-600 truncate">{chat.ticketTitle}</p>
                              </div>
                              {chat.unreadCount > 0 && (
                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full border-2 border-violet-200"
                  />
                )}
                <span className="hidden sm:inline text-sm font-medium text-slate-700">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex gap-2 pb-3">
            <Link
              to="/buy"
              className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                isActive('/buy') || isActive('/')
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Buy Tickets
            </Link>
            <Link
              to="/post"
              className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                isActive('/post')
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Post Ticket
            </Link>
            <Link
              to="/my-listings"
              className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                isActive('/my-listings')
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              My Listings
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      {/* Chat Widget */}
      {openChatId && (
        <ChatWidget
          user={user}
          chatId={openChatId}
          onClose={handleCloseChat}
        />
      )}

      <footer className="mt-16 border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="font-medium">Wildside verified community</span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              A trusted marketplace for Northwestern students
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout

