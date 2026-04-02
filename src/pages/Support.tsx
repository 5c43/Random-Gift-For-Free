import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Hash, Send, User, Shield, Clock, CheckCircle2, AlertCircle, ChevronRight, Search, LifeBuoy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface Ticket {
  id: string;
  uid: string;
  username: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt: any;
  lastMessageAt: any;
  category: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  isAdmin: boolean;
}

export function Support() {
  const { user, userData } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('General Support');
  const [loading, setLoading] = useState(false);

  const isAdmin = userData?.role === 'admin' || user?.uid === 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2';

  useEffect(() => {
    if (!user) return;

    const ticketsRef = collection(db, 'tickets');
    const q = isAdmin 
      ? query(ticketsRef, orderBy('lastMessageAt', 'desc'))
      : query(ticketsRef, where('uid', '==', user.uid), orderBy('lastMessageAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      setTickets(ticketData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tickets');
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!selectedTicket) return;

    const messagesRef = collection(db, 'tickets', selectedTicket.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(messageData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tickets/${selectedTicket.id}/messages`);
    });

    return () => unsubscribe();
  }, [selectedTicket]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTicketSubject.trim()) return;

    setLoading(true);
    try {
      const ticketRef = await addDoc(collection(db, 'tickets'), {
        uid: user.uid,
        username: userData?.username || user.email?.split('@')[0],
        subject: newTicketSubject,
        category: newTicketCategory,
        status: 'open',
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'tickets', ticketRef.id, 'messages'), {
        text: `Ticket created: ${newTicketSubject}`,
        senderId: 'system',
        senderName: 'System',
        createdAt: serverTimestamp(),
        isAdmin: true,
      });

      setShowCreateModal(false);
      setNewTicketSubject('');
      setNewTicketCategory('General Support');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !newMessage.trim() || selectedTicket.status === 'closed') return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'tickets', selectedTicket.id, 'messages'), {
        text: messageText,
        senderId: user.uid,
        senderName: userData?.username || user.email?.split('@')[0],
        createdAt: serverTimestamp(),
        isAdmin: isAdmin,
      });

      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tickets/${selectedTicket.id}/messages`);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || !isAdmin) return;

    try {
      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        status: 'closed',
      });
      
      await addDoc(collection(db, 'tickets', selectedTicket.id, 'messages'), {
        text: 'This ticket has been closed by an administrator.',
        senderId: 'system',
        senderName: 'System',
        createdAt: serverTimestamp(),
        isAdmin: true,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${selectedTicket.id}`);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-[#0B0B0B] flex overflow-hidden">
      {/* Sidebar - Discord Style */}
      <div className="w-72 bg-[#161616] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-violet-400" />
            Support
          </h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
            Your Tickets
          </div>
          {tickets.length === 0 ? (
            <div className="px-2 py-4 text-sm text-gray-500 italic">No tickets yet.</div>
          ) : (
            tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  selectedTicket?.id === ticket.id 
                    ? 'bg-violet-600/10 text-white border border-violet-500/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Hash className={`h-4 w-4 ${selectedTicket?.id === ticket.id ? 'text-violet-400' : 'text-gray-600'}`} />
                <div className="text-left flex-grow overflow-hidden">
                  <div className="text-sm font-bold truncate">{ticket.subject}</div>
                  <div className="text-[10px] flex items-center gap-2">
                    <span className={ticket.status === 'open' ? 'text-emerald-400' : 'text-red-400'}>
                      {ticket.status.toUpperCase()}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600 truncate">{ticket.category}</span>
                  </div>
                </div>
                {isAdmin && ticket.status === 'open' && (
                  <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-4 bg-black/20 border-t border-white/5">
          <div className="flex items-center gap-3">
            <img 
              src={userData?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}`} 
              alt="Avatar" 
              className="h-8 w-8 rounded-full border border-white/10"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{userData?.username || user?.email?.split('@')[0]}</div>
              <div className="text-[10px] text-gray-500 truncate">#{user?.uid.slice(0, 4)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Ticket View */}
      <div className="flex-grow flex flex-col bg-[#0F0F0F]">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-[#161616]/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <Hash className="h-6 w-6 text-gray-500" />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-gray-500">{selectedTicket.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin && selectedTicket.status === 'open' && (
                  <button 
                    onClick={handleCloseTicket}
                    className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-all"
                  >
                    Close Ticket
                  </button>
                )}
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  selectedTicket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {selectedTicket.status}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="mb-12">
                <div className="h-20 w-20 bg-violet-600/10 rounded-3xl flex items-center justify-center mb-6">
                  <Hash className="h-10 w-10 text-violet-400" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">Welcome to #{selectedTicket.subject}</h1>
                <p className="text-gray-400">This is the start of the ticket history for {selectedTicket.subject}.</p>
                <div className="h-px w-full bg-white/5 mt-8"></div>
              </div>

              {messages.map((msg, idx) => {
                const isSystem = msg.senderId === 'system';
                const isMe = msg.senderId === user?.uid;
                
                return (
                  <div key={msg.id} className={`flex gap-4 group ${isSystem ? 'opacity-60' : ''}`}>
                    <img 
                      src={isSystem ? 'https://ui-avatars.com/api/?name=System&background=4f46e5&color=fff' : `https://ui-avatars.com/api/?name=${msg.senderName}`} 
                      alt="Avatar" 
                      className="h-10 w-10 rounded-full border border-white/5 flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${msg.isAdmin ? 'text-violet-400' : 'text-white'}`}>
                          {msg.senderName}
                        </span>
                        {msg.isAdmin && (
                          <span className="px-1.5 py-0.5 bg-violet-600 text-[8px] font-black text-white rounded uppercase">Admin</span>
                        )}
                        <span className="text-[10px] text-gray-500">
                          {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-6 bg-[#161616]/50">
              {selectedTicket.status === 'open' ? (
                <form onSubmit={handleSendMessage} className="relative">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Message #${selectedTicket.subject}`}
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-gray-600"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-violet-400 hover:text-violet-300 disabled:opacity-30 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              ) : (
                <div className="w-full bg-red-500/5 border border-red-500/10 rounded-xl px-6 py-4 text-center text-sm text-red-400 font-medium italic">
                  This ticket is closed and cannot receive new messages.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
            <div className="h-24 w-24 bg-violet-600/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
              <LifeBuoy className="h-12 w-12 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Select a ticket to view</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Choose a ticket from the sidebar or create a new one to get help from our support team.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" /> Create New Ticket
            </button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#161616] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Create Support Ticket</h2>
              <p className="text-gray-400 text-sm mb-8">Tell us what you need help with and we'll get back to you soon.</p>
              
              <form onSubmit={handleCreateTicket} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Subject</label>
                  <input 
                    required
                    type="text" 
                    value={newTicketSubject}
                    onChange={e => setNewTicketSubject(e.target.value)}
                    placeholder="Briefly describe your issue"
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={newTicketCategory}
                    onChange={e => setNewTicketCategory(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Account Problem">Account Problem</option>
                    <option value="Seller Verification">Seller Verification</option>
                    <option value="Report User">Report User</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-grow bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !newTicketSubject.trim()}
                    className="flex-grow bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
