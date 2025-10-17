// ...existing code...
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import type { User } from 'firebase/auth';
import Chat from './Chat';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, getDocs } from 'firebase/firestore';

type MyChatsProps = {
  user: User;
  highlightedChatId?: string;
};

const MyChats = ({ user, highlightedChatId }: MyChatsProps) => {
  const [newChatEmail, setNewChatEmail] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  // Highlight chat if highlightedChatId is passed from Layout
  useEffect(() => {
    if (highlightedChatId) {
      setSelectedChatId(highlightedChatId);
    }
  }, [highlightedChatId]);

  // Start a new chat with another user by email
  const handleStartChat = async () => {
    if (!newChatEmail.trim() || newChatEmail === user.email) return;
    setStartingChat(true);
    try {
      // Look up recipient UID by email
      const usersRef = collection(db, 'users');
      const userQ = query(usersRef, where('email', '==', newChatEmail.trim()));
      const userSnap = await getDocs(userQ);
      if (userSnap.empty) {
        alert('No user found with that email.');
        setStartingChat(false);
        return;
      }
      const recipientDoc = userSnap.docs[0];
      const recipient = recipientDoc.data();
      const recipientUid = recipient.uid;
      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.uid)
      );
      const snapshot = await getDocs(q);
      let existingChatId = '';
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if ((data.buyerId === recipientUid || data.sellerId === recipientUid) && data.ticketId === '') {
          existingChatId = docSnap.id;
        }
      });
      if (existingChatId) {
        setSelectedChatId(existingChatId);
        setNewChatEmail('');
        setStartingChat(false);
        return;
      }
      // Create new chat
      const docRef = await addDoc(chatsRef, {
        ticketId: '', // No ticket, just direct chat
        participants: [user.uid, recipientUid],
        buyerId: user.uid,
        buyerName: user.displayName || user.email || 'User',
        buyerEmail: user.email || '',
        sellerId: recipientUid,
        sellerName: recipient.displayName || '',
        sellerEmail: recipient.email || '',
        createdAt: new Date(),
      });
      setSelectedChatId(docRef.id);
      setNewChatEmail('');
    } catch (e) {
      alert('Failed to start chat.');
    }
    setStartingChat(false);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList: any[] = [];
      snapshot.forEach((doc) => {
        chatList.push({ id: doc.id, ...doc.data() });
      });
      setChats(chatList);
      if (chatList.length && !selectedChatId) {
        setSelectedChatId(chatList[0].id);
      }
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!selectedChatId) return;
    const chat = chats.find((c) => c.id === selectedChatId);
    setSelectedChat(chat || null);
    if (chat) {
      // Fetch ticket info
      const ticketRef = doc(db, 'listings', chat.ticketId);
      getDoc(ticketRef).then((ticketSnap) => {
        if (ticketSnap.exists()) {
          setSelectedTicket(ticketSnap.data());
          setIsSeller(ticketSnap.data().sellerId === user.uid);
        }
      });
    }
  }, [selectedChatId, chats, user.uid]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 border-r bg-white p-4">
        <h2 className="text-lg font-bold mb-4">My Chats</h2>
        <div className="mb-4">
          <input
            type="email"
            value={newChatEmail}
            onChange={e => setNewChatEmail(e.target.value)}
            placeholder="Enter user email to start chat"
            className="w-full rounded border px-2 py-1 mb-2"
          />
          <button
            onClick={handleStartChat}
            disabled={startingChat || !newChatEmail.trim() || newChatEmail === user.email}
            className="w-full rounded bg-violet-600 text-white py-2 font-semibold"
          >
            {startingChat ? 'Starting...' : 'Start Chat'}
          </button>
        </div>
        <ul>
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                className={`w-full text-left px-3 py-2 rounded mb-2 ${selectedChatId === chat.id ? 'bg-violet-100 font-bold' : 'bg-slate-100'}`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                {chat.buyerName === user.displayName || chat.buyerEmail === user.email
                  ? `Seller: ${chat.sellerName}`
                  : `Buyer: ${chat.buyerName}`}
                <br />
                <span className="text-xs text-slate-500">{chat.ticketId}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 p-8">
        {selectedChatId && selectedChat ? (
          <Chat
            user={user}
            chatId={selectedChat.id}
            ticket={selectedTicket || { title: 'Direct Chat', id: '', buyerId: user.uid, buyerName: user.displayName || user.email, buyerEmail: user.email, sellerId: '', sellerName: '', sellerEmail: '', status: 'available' }}
            isSeller={isSeller}
          />
        ) : (
          <div className="text-slate-500">Select a chat to view conversation.</div>
        )}
      </main>
    </div>
  );
};

export default MyChats;
