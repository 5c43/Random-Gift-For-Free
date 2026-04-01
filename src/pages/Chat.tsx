import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Send, User, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentChatDetails, setCurrentChatDetails] = useState<any>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const q1 = query(collection(db, 'chats'), where('buyerId', '==', user.uid));
    const q2 = query(collection(db, 'chats'), where('sellerId', '==', user.uid));

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const buyerChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateChats(buyerChats, 'buyer');
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const sellerChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateChats(sellerChats, 'seller');
    });

    let allChats: any[] = [];
    const updateChats = (newChats: any[], role: string) => {
      allChats = [...allChats.filter(c => !newChats.find(nc => nc.id === c.id)), ...newChats];
      allChats.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis() || 0;
        const timeB = b.lastMessageAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setChats([...allChats]);
      setLoading(false);
    };

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user, navigate]);

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatDetails = async () => {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        const otherUserId = data.buyerId === user.uid ? data.sellerId : data.buyerId;
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        const listingDoc = await getDoc(doc(db, 'listings', data.listingId));
        
        setCurrentChatDetails({
          ...data,
          otherUser: otherUserDoc.exists() ? otherUserDoc.data() : { displayName: 'Unknown User' },
          listing: listingDoc.exists() ? { id: listingDoc.id, ...listingDoc.data() } : { title: 'Unknown Listing' }
        });

        // Fetch purchase details
        const purchaseId = `${data.buyerId}_${data.listingId}`;
        const purchaseDoc = await getDoc(doc(db, 'purchases', purchaseId));
        if (purchaseDoc.exists()) {
          setPurchaseDetails({ id: purchaseDoc.id, ...purchaseDoc.data() });
        }
      }
    };
    fetchChatDetails();

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleConfirmDelivery = async () => {
    if (!currentChatDetails?.listingId || !user || !purchaseDetails) return;
    if (!window.confirm('Are you sure you have received the account and everything is correct? This will release the funds to the seller.')) {
      return;
    }
    
    setConfirming(true);
    try {
      const { writeBatch, increment } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'purchases', purchaseDetails.id), {
        status: 'completed'
      });
      
      batch.update(doc(db, 'listings', currentChatDetails.listingId), {
        status: 'sold'
      });

      // Release funds to seller
      batch.update(doc(db, 'users', purchaseDetails.sellerId), {
        balance: increment(purchaseDetails.price)
      });
      
      await batch.commit();
      
      alert('Delivery confirmed! Thank you for your purchase.');
      setPurchaseDetails({ ...purchaseDetails, status: 'completed' });
    } catch (error) {
      console.error("Error confirming delivery:", error);
      alert('Failed to confirm delivery. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)]">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl h-full flex overflow-hidden shadow-2xl">
        
        {/* Sidebar - Chat List */}
        <div className={`w-full md:w-1/3 border-r border-white/10 flex flex-col ${chatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/10 bg-white/5">
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Messages</h2>
          </div>
          <div className="overflow-y-auto flex-grow custom-scrollbar">
            {loading ? (
              <div className="p-6 text-center text-gray-400 font-medium">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-6 text-center text-gray-400 font-medium">No messages yet.</div>
            ) : (
              chats.map(chat => (
                <Link 
                  key={chat.id} 
                  to={`/chat/${chat.id}`}
                  className={`block p-5 border-b border-white/5 hover:bg-white/10 transition-all ${chatId === chat.id ? 'bg-white/10 border-l-4 border-l-violet-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-200 truncate">
                      {chat.buyerId === user.uid ? 'Seller' : 'Buyer'}
                    </span>
                    {chat.lastMessageAt && (
                      <span className="text-xs font-medium text-gray-500">
                        {format(chat.lastMessageAt.toDate(), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate leading-relaxed">{chat.lastMessage || 'No messages yet'}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`w-full md:w-2/3 flex flex-col ${!chatId ? 'hidden md:flex' : 'flex'} bg-black/20`}>
          {chatId ? (
            <>
              {/* Chat Header */}
              <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-lg">
                    {currentChatDetails?.otherUser?.photoURL ? (
                      <img src={currentChatDetails.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{currentChatDetails?.otherUser?.displayName || 'Loading...'}</h3>
                    <p className="text-sm font-medium text-violet-400 truncate max-w-[250px]">{currentChatDetails?.listing?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {currentChatDetails?.buyerId === user.uid && purchaseDetails?.status === 'Pending Delivery' && (
                    <button
                      onClick={handleConfirmDelivery}
                      disabled={confirming}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle className="h-4 w-4" /> {confirming ? 'Confirming...' : 'Confirm Delivery'}
                    </button>
                  )}
                  <Link to={`/offer/${currentChatDetails?.listingId}`} className="text-sm font-bold text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10">
                    View Listing
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20 text-violet-400" />
                    <p className="text-xl font-bold text-gray-300">Start the conversation!</p>
                    <p className="text-sm mt-2 font-medium">Never share your password or personal information.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user.uid;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        key={msg.id} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-2xl p-4 shadow-md ${isMe ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 border border-white/10 backdrop-blur-md rounded-tl-sm'}`}>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                          <div className={`text-[11px] mt-2 font-medium text-right ${isMe ? 'text-violet-200' : 'text-gray-500'}`}>
                            {msg.createdAt ? format(msg.createdAt.toDate(), 'h:mm a') : 'Sending...'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-5 border-t border-white/10 bg-white/5 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow bg-black/40 border border-white/10 rounded-full px-6 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-inner"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:hover:from-violet-600 disabled:hover:to-fuchsia-600 text-white p-3.5 rounded-full transition-all flex items-center justify-center w-14 shadow-lg shadow-violet-500/20 transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    <Send className="h-5 w-5 ml-1" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 flex-col">
              <MessageSquare className="h-24 w-24 mb-6 opacity-20 text-violet-400" />
              <p className="text-2xl font-bold text-gray-400">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
