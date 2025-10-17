import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

type Chat = {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  ticketId: string;
  createdAt: any;
};

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
};

type Props = {
  user: User;
};

const MyChats = ({ user }: Props) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData: Chat[] = [];
      snapshot.forEach((doc) => {
        chatsData.push({ id: doc.id, ...doc.data() } as Chat);
      });
      chatsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedChatId]);

  const handleSendMessage = async () => {
    if (!selectedChatId || !newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email || 'User',
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const otherParticipant = selectedChat
    ? selectedChat.buyerId === user.uid
      ? { name: selectedChat.sellerName, email: selectedChat.sellerEmail }
      : { name: selectedChat.buyerName, email: selectedChat.buyerEmail }
    : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600"></div>
          <p className="mt-4 text-sm text-slate-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Chats</h1>

        {chats.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-medium text-slate-600">No chats yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Start a chat by purchasing a ticket from the Buy Tickets page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Conversations</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {chats.map((chat) => {
                  const otherUser =
                    chat.buyerId === user.uid
                      ? { name: chat.sellerName, email: chat.sellerEmail }
                      : { name: chat.buyerName, email: chat.buyerEmail };
                  const isSelected = selectedChatId === chat.id;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={'w-full text-left p-4 transition hover:bg-slate-50 ' + (isSelected ? 'bg-violet-50 border-l-4 border-violet-600' : '')}
                    >
                      <p className="font-medium text-slate-900">{otherUser.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{otherUser.email}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col" style={{ height: '600px' }}>
              {selectedChatId ? (
                <>
                  <div className="p-4 border-b border-slate-200">
                    <p className="font-semibold text-slate-900">{otherParticipant?.name}</p>
                    <p className="text-xs text-slate-500">{otherParticipant?.email}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.senderId === user.uid;
                        return (
                          <div key={message.id} className={'flex ' + (isOwnMessage ? 'justify-end' : 'justify-start')}>
                            <div className={'max-w-xs rounded-lg px-4 py-2 ' + (isOwnMessage ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-900')}>
                              <p className="text-sm">{message.text}</p>
                              <p className={'text-xs mt-1 ' + (isOwnMessage ? 'text-violet-200' : 'text-slate-500')}>
                                {message.createdAt?.toDate()?.toLocaleTimeString() || ''}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  Select a chat to view messages
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChats;
