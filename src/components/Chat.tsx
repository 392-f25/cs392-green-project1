import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from 'firebase/auth';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
}

interface ChatProps {
  user: User;
  chatId: string;
  ticket: any;
  isSeller: boolean;
}

const Chat = ({ user, chatId, ticket, isSeller }: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: user.uid,
      senderName: user.displayName || user.email || 'User',
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
    });
    setNewMessage('');
  };

  const handleSellTicket = async () => {
    setSelling(true);
    try {
      const ticketRef = doc(db, 'listings', ticket.id);
      await updateDoc(ticketRef, {
        buyerId: ticket.buyerId,
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        status: 'sold',
      });
      // Optionally, send a message in chat
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || user.email || 'User',
        text: 'Ticket marked as sold.',
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      alert('Failed to mark ticket as sold.');
    }
    setSelling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl flex flex-col h-[80vh]">
        <h2 className="text-xl font-bold mb-2">Chat about: {ticket.title}</h2>
        <div className="flex-1 overflow-y-auto border rounded p-2 mb-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-2 ${msg.senderId === user.uid ? 'text-right' : 'text-left'}`}> 
              <span className="block text-xs text-slate-500">{msg.senderName}</span>
              <span className="inline-block px-2 py-1 rounded bg-violet-100 text-slate-900">{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="flex gap-2 mb-2">
          <input
            className="flex-1 rounded border px-2 py-1"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="rounded bg-violet-600 text-white px-4 py-1">Send</button>
        </form>
        {isSeller && ticket.status !== 'sold' && (
          <button
            className="w-full rounded bg-emerald-600 text-white py-2 font-semibold mt-2"
            onClick={handleSellTicket}
            disabled={selling}
          >
            {selling ? 'Processing...' : 'Sell Ticket'}
          </button>
        )}
        <button className="w-full rounded bg-slate-200 text-slate-700 py-2 font-semibold mt-2" onClick={() => window.location.reload()}>Close</button>
      </div>
    </div>
  );
};

export default Chat;
