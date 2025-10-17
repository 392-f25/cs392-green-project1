import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Chat from './Chat';
import type { User } from 'firebase/auth';

const ChatPage = ({ user }: { user: User }) => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [chatInfo, setChatInfo] = useState<any>(null);

  useEffect(() => {
    const fetchChat = async () => {
      const chatRef = doc(db, 'chats', chatId!);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        setChatInfo(chatSnap.data());
        const ticketRef = doc(db, 'listings', chatSnap.data().ticketId);
        const ticketSnap = await getDoc(ticketRef);
        if (ticketSnap.exists()) {
          setTicket(ticketSnap.data());
          setIsSeller(ticketSnap.data().sellerId === user.uid);
        }
      }
    };
    fetchChat();
  }, [chatId, user.uid]);

  const handleConfirmPurchase = async () => {
    if (!ticket) return;
    const ticketRef = doc(db, 'listings', chatInfo.ticketId);
    await updateDoc(ticketRef, {
      buyerId: chatInfo.buyerId,
      buyerName: chatInfo.buyerName,
      buyerEmail: chatInfo.buyerEmail,
      status: 'sold',
      pendingBuyerId: null,
      pendingBuyerName: null,
      pendingBuyerEmail: null,
    });
    navigate('/buy');
  };

  const handleRejectOffer = async () => {
    if (!ticket) return;
    const ticketRef = doc(db, 'listings', chatInfo.ticketId);
    await updateDoc(ticketRef, {
      pendingBuyerId: null,
      pendingBuyerName: null,
      pendingBuyerEmail: null,
    });
    navigate('/buy');
  };

  if (!ticket || !chatInfo) return <div className="p-8">Loading chat...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Chat user={user} chatId={chatId!} ticket={ticket} isSeller={isSeller} />
        {isSeller && ticket.status !== 'sold' && (
          <div className="flex gap-4 mt-4">
            <button
              className="flex-1 rounded bg-emerald-600 text-white py-2 font-semibold"
              onClick={handleConfirmPurchase}
            >
              Confirm Purchase
            </button>
            <button
              className="flex-1 rounded bg-rose-600 text-white py-2 font-semibold"
              onClick={handleRejectOffer}
            >
              Reject Offer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
