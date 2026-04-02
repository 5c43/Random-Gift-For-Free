import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Gift, Plus, Trash2, ExternalLink, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface FreeAccount {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  link: string;
  createdAt: any;
}

export function FreeAccounts() {
  const { user, userData } = useAuth();
  const [accounts, setAccounts] = useState<FreeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: ''
  });

  const [claimingAccount, setClaimingAccount] = useState<FreeAccount | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = userData?.role === 'admin' || user?.uid === 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2';

  useEffect(() => {
    const q = query(collection(db, 'free_accounts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreeAccount)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'free_accounts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      await addDoc(collection(db, 'free_accounts'), {
        ...newAccount,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewAccount({ title: '', description: '', imageUrl: '', link: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'free_accounts');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      await deleteDoc(doc(db, 'free_accounts', id));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'free_accounts');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
          >
            <Gift className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Community Rewards</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
          >
            Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Accounts</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Exclusive free accounts posted by our admins. Grab them while they last!
          </motion.p>

          {isAdmin && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="mt-10 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-3 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Post Free Account
            </motion.button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <AlertCircle className="h-16 w-16 text-gray-600 mx-auto mb-4 opacity-20" />
            <p className="text-gray-500 text-xl font-medium">No free accounts available right now.</p>
            <p className="text-gray-600 mt-2">Check back later for new drops!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-[#161616] border border-[#262626] rounded-3xl overflow-hidden shadow-xl hover:border-violet-500/50 transition-all relative"
              >
                <div className="p-8">
                  {account.imageUrl && (
                    <div className="h-48 mb-6 rounded-2xl overflow-hidden border border-white/10">
                      <img 
                        src={account.imageUrl} 
                        alt={account.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Admin Drop</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">{account.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3">{account.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setClaimingAccount(account)}
                      className="flex items-center gap-2 text-violet-400 font-bold hover:text-violet-300 transition-colors"
                    >
                      Claim Account <ExternalLink className="h-4 w-4" />
                    </button>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => setDeletingId(account.id)}
                        className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Copy Toast Notification */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#161616] border border-red-500/20 rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete Post?</h2>
              <p className="text-gray-400 mb-8">This action cannot be undone. Are you sure?</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteAccount(deletingId)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Claim Modal */}
      <AnimatePresence>
        {claimingAccount && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setClaimingAccount(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#161616] border border-[#262626] rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl text-center"
            >
              <div className="h-20 w-20 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="h-10 w-10 text-violet-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{claimingAccount.title}</h2>
              <p className="text-gray-400 mb-8">Here are the details for your free account:</p>
              
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-8 font-mono text-lg break-all">
                {claimingAccount.link}
              </div>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(claimingAccount.link);
                  setShowCopyToast(true);
                  setTimeout(() => setShowCopyToast(false), 2000);
                }}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-all mb-4 flex items-center justify-center gap-2"
              >
                {showCopyToast ? (
                  <>
                    <Check className="h-5 w-5" />
                    Copied!
                  </>
                ) : (
                  'Copy to Clipboard'
                )}
              </button>
              
              <button 
                onClick={() => setClaimingAccount(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#161616] border border-[#262626] rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Post Free Account</h2>
              <form onSubmit={handleAddAccount} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Account Title</label>
                  <input 
                    required
                    type="text" 
                    value={newAccount.title}
                    onChange={e => setNewAccount({...newAccount, title: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    placeholder="e.g. Free Fortnite Account with OG Skins"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={newAccount.description}
                    onChange={e => setNewAccount({...newAccount, description: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                    placeholder="Details about the account..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={newAccount.imageUrl}
                    onChange={e => setNewAccount({...newAccount, imageUrl: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    placeholder="https://example.com/image.png"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Claim Link / Details</label>
                  <input 
                    required
                    type="text" 
                    value={newAccount.link}
                    onChange={e => setNewAccount({...newAccount, link: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    placeholder="Link to claim or login info"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20"
                  >
                    Post Now
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
