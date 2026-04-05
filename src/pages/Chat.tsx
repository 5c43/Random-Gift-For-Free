import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Send, User, Clock, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ReviewModal } from '../components/ReviewModal';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentChatDetails, setCurrentChatDetails] = useState<any>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const [chatUsers, setChatUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const q1 = query(collection(db, 'chats'), where('buyerId', '==', user.uid));
    const q2 = query(collection(db, 'chats'), where('sellerId', '==', user.uid));

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const buyerChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateChats(buyerChats);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
      setLoading(false);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const sellerChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateChats(sellerChats);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
      setLoading(false);
    });

    let allChats: any[] = [];
    const updateChats = async (newChats: any[]) => {
      allChats = [...allChats.filter(c => !newChats.find(nc => nc.id === c.id)), ...newChats];
      allChats.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis() || 0;
        const timeB = b.lastMessageAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setChats([...allChats]);
      setLoading(false);

      // Fetch user details for each chat
      for (const chat of newChats) {
        const otherUserId = chat.buyerId === user.uid ? chat.sellerId : chat.buyerId;
        if (!chatUsers[otherUserId]) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setChatUsers(prev => ({ ...prev, [otherUserId]: userDoc.data() }));
          }
        }
      }
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${chatId}/messages`);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleConfirmDelivery = async () => {
    if (!currentChatDetails?.listingId || !user || !purchaseDetails) return;
    
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
      
      showToast('Delivery confirmed! Thank you for your purchase.');
      setPurchaseDetails({ ...purchaseDetails, status: 'completed' });
      setShowReviewModal(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `purchases/${purchaseDetails.id}`);
      showToast('Failed to confirm delivery. Please try again.', 'error');
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

      // Create notification for recipient
      const recipientId = currentChatDetails.buyerId === user.uid ? currentChatDetails.sellerId : currentChatDetails.buyerId;
      await addDoc(collection(db, 'notifications'), {
        uid: recipientId,
        title: "New Message",
        message: `You received a new message from ${userData?.displayName || user.email?.split('@')[0]}`,
        type: "message",
        link: `/chat/${chatId}`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)]">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={async (rating, comment) => {
          if (!purchaseDetails) return;
          try {
            await addDoc(collection(db, 'reviews'), {
              sellerId: purchaseDetails.sellerId,
              buyerId: user.uid,
              buyerName: userData?.username || userData?.displayName || 'Anonymous',
              rating,
              comment,
              listingId: currentChatDetails.listingId,
              listingTitle: currentChatDetails.listing.title,
              createdAt: serverTimestamp()
            });
            showToast('Review submitted! Thank you.');
          } catch (error) {
            console.error("Error submitting review:", error);
            showToast('Failed to submit review.', 'error');
          }
        }}
        title="Rate the Seller"
        subtitle={`How was your experience with ${currentChatDetails?.otherUser?.username || 'the seller'}?`}
        type="seller"
      />
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
              chats.map(chat => {
                const otherUserId = chat.buyerId === user.uid ? chat.sellerId : chat.buyerId;
                const otherUser = chatUsers[otherUserId];
                const isSeller = chat.sellerId === otherUserId;

                return (
                  <Link 
                    key={chat.id} 
                    to={`/chat/${chat.id}`}
                    className={`block p-5 border-b border-white/5 hover:bg-white/10 transition-all ${chatId === chat.id ? 'bg-white/10 border-l-4 border-l-violet-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                        {otherUser?.photoURL ? (
                          <img src={otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-200 truncate">
                            {otherUser?.username || otherUser?.displayName || 'Loading...'}
                          </span>
                          {chat.lastMessageAt && (
                            <span className="text-[10px] font-medium text-gray-500">
                              {format(chat.lastMessageAt.toDate(), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${isSeller ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                            {isSeller ? 'Seller' : 'Buyer'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 truncate leading-relaxed pl-13">{chat.lastMessage || 'No messages yet'}</p>
                  </Link>
                );
              })
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
                  <Link 
                    to={`/seller/${currentChatDetails?.buyerId === user.uid ? currentChatDetails?.sellerId : currentChatDetails?.buyerId}`}
                    className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-lg hover:border-violet-500/50 transition-all"
                  >
                    {currentChatDetails?.otherUser?.photoURL ? (
                      <img src={currentChatDetails.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/seller/${currentChatDetails?.buyerId === user.uid ? currentChatDetails?.sellerId : currentChatDetails?.buyerId}`}
                        className="font-bold text-white text-lg hover:text-violet-400 transition-colors"
                      >
                        {currentChatDetails?.otherUser?.username || currentChatDetails?.otherUser?.displayName || 'Loading...'}
                      </Link>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${currentChatDetails?.sellerId !== user.uid ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                        {currentChatDetails?.sellerId !== user.uid ? 'Seller' : 'Buyer'}
                      </span>
                    </div>
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
              <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20 text-violet-400" />
                    <p className="text-xl font-bold text-gray-300">Start the conversation!</p>
                    <p className="text-sm mt-2 font-medium">Never share your password or personal information.</p>
                  </div>
                ) : (
                  (() => {
                    const groups: { date: string; messages: any[] }[] = [];
                    messages.forEach(msg => {
                      if (!msg.createdAt) {
                        if (groups.length === 0) {
                          groups.push({ date: 'Today', messages: [msg] });
                        } else {
                          groups[groups.length - 1].messages.push(msg);
                        }
                        return;
                      }
                      const date = format(msg.createdAt.toDate(), 'MMMM d, yyyy');
                      const existingGroup = groups.find(g => g.date === date);
                      if (existingGroup) {
                        existingGroup.messages.push(msg);
                      } else {
                        groups.push({ date, messages: [msg] });
                      }
                    });

                    return groups.map((group, groupIdx) => (
                      <div key={group.date} className="space-y-6">
                        <div className="flex justify-center">
                          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {group.date === format(new Date(), 'MMMM d, yyyy') ? 'Today' : group.date}
                          </span>
                        </div>
                        {group.messages.map((msg, msgIdx) => {
                          const isMe = msg.senderId === user.uid;
                          const showAvatar = !isMe && (msgIdx === 0 || group.messages[msgIdx - 1].senderId !== msg.senderId);
                          
                          return (
                            <motion.div 
                              initial={{ opacity: 0, x: isMe ? 20 : -20 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              key={msg.id} 
                              className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isMe && (
                                <div className="w-8 flex-shrink-0">
                                  {showAvatar ? (
                                    <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 overflow-hidden shadow-sm">
                                      {currentChatDetails?.otherUser?.photoURL ? (
                                        <img src={currentChatDetails.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="h-4 w-4 text-gray-400 m-2" />
                                      )}
                                    </div>
                                  ) : <div className="w-8" />}
                                </div>
                              )}
                              <div className={`max-w-[70%] group relative`}>
                                <div className={`p-4 shadow-lg ${
                                  isMe 
                                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-tr-none' 
                                    : 'bg-[#1a1a1a] text-gray-200 border border-white/10 backdrop-blur-md rounded-2xl rounded-tl-none'
                                }`}>
                                  <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">{msg.text}</p>
                                </div>
                                <div className={`text-[10px] mt-1.5 font-bold flex items-center gap-1.5 ${isMe ? 'justify-end text-violet-300/60' : 'justify-start text-gray-500'}`}>
                                  {msg.createdAt ? format(msg.createdAt.toDate(), 'h:mm a') : 'Sending...'}
                                  {isMe && <CheckCircle className="h-3 w-3 opacity-40" />}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ));
                  })()
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
