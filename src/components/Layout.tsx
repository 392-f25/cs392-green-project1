import { useState } from 'react';
import type { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import BuyTickets from './BuyTickets';
import PostListing from './PostListing';
import MyListings from './MyListings';
import MyChats from './MyChats';

type Props = {
  user: User;
};

const Layout = ({ user }: Props) => {
  const [activeSection, setActiveSection] = useState<'buy' | 'post' | 'my-listings' | 'my-chats'>('buy');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (section: string) => activeSection === section;

  const handleStartChat = () => {
    setActiveSection('my-chats');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <button className="flex-shrink-0 bg-transparent border-none cursor-pointer" onClick={() => setActiveSection('buy')}>
                <h1 className="text-2xl font-bold text-slate-900">TicketExchange</h1>
              </button>
              <nav className="hidden md:flex gap-4">
                <button
                  onClick={() => setActiveSection('buy')}
                  className={'rounded-full px-4 py-2 text-sm font-medium transition ' + (isActive('buy') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
                >
                  Buy Tickets
                </button>
                <button
                  onClick={() => setActiveSection('post')}
                  className={'rounded-full px-4 py-2 text-sm font-medium transition ' + (isActive('post') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
                >
                  Post Ticket
                </button>
                <button
                  onClick={() => setActiveSection('my-listings')}
                  className={'rounded-full px-4 py-2 text-sm font-medium transition ' + (isActive('my-listings') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
                >
                  My Listings
                </button>
                <button
                  onClick={() => setActiveSection('my-chats')}
                  className={'rounded-full px-4 py-2 text-sm font-medium transition ' + (isActive('my-chats') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
                >
                  My Chats
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
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

          <nav className="md:hidden flex gap-2 pb-3">
            <button
              onClick={() => setActiveSection('buy')}
              className={'flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ' + (isActive('buy') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveSection('post')}
              className={'flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ' + (isActive('post') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
            >
              Post
            </button>
            <button
              onClick={() => setActiveSection('my-listings')}
              className={'flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ' + (isActive('my-listings') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
            >
              Listings
            </button>
            <button
              onClick={() => setActiveSection('my-chats')}
              className={'flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ' + (isActive('my-chats') ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
            >
              Chats
            </button>
          </nav>
        </div>
      </header>

      <main>
        {activeSection === 'buy' && <BuyTickets user={user} onStartChat={handleStartChat} />}
        {activeSection === 'post' && <PostListing user={user} />}
        {activeSection === 'my-listings' && <MyListings user={user} />}
        {activeSection === 'my-chats' && <MyChats user={user} />}
      </main>

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
  );
};

export default Layout;
