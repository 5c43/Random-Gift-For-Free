import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, ShoppingBag, DollarSign, List, PlusCircle, CheckCircle, Wallet, ArrowUpRight, Clock, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Dashboard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('purchases');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState('10');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingFunds, setProcessingFunds] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addAmount || parseFloat(addAmount) <= 0) return;
    
    setProcessingFunds(true);
    try {
      const amount = parseFloat(addAmount);
      const amountInCents = Math.round(amount * 100);
      
      // Call Ziina API to create payment intent for top-up
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents,
          userId: user.uid,
          isTopUp: true,
          success_url: `${window.location.origin}/dashboard?tab=wallet&status=success`,
          cancel_url: `${window.location.origin}/dashboard?tab=wallet&status=cancel`,
          purchaseId: `topup_${user.uid}_${Date.now()}`
        }),
      });

      const data = await response.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error(data.error || 'Failed to get redirect URL');
      }
    } catch (error) {
      console.error("Error adding funds:", error);
      showToast('Failed to initiate payment. Please try again.', 'error');
    } finally {
      setProcessingFunds(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const [profileForm, setProfileForm] = useState({
    displayName: userData?.displayName || '',
    photoURL: userData?.photoURL || '',
    bio: userData?.bio || ''
  });

  useEffect(() => {
    if (userData) {
      setProfileForm({
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        bio: userData.bio || ''
      });
    }
  }, [userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profileForm.displayName,
        photoURL: profileForm.photoURL,
        bio: profileForm.bio
      });
      showToast('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelivery = async (purchaseId: string, listingId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    setLoading(true);
    try {
      const { writeBatch, increment } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'purchases', purchaseId), {
        status: 'completed'
      });
      
      batch.update(doc(db, 'listings', listingId), {
        status: 'sold'
      });

      // Release funds to seller
      batch.update(doc(db, 'users', purchase.sellerId), {
        balance: increment(purchase.price)
      });
      
      await batch.commit();
      
      showToast('Delivery confirmed! Thank you for your purchase.');
      // Refresh data
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `purchases/${purchaseId}`);
      showToast('Failed to confirm delivery. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const qPurchases = query(collection(db, 'purchases'), where('buyerId', '==', user.uid));
        const purchasesSnapshot = await getDocs(qPurchases);
        const purchasesData = await Promise.all(purchasesSnapshot.docs.map(async (d) => {
          const data = d.data();
          const listingDoc = await getDoc(doc(db, 'listings', data.listingId));
          return { 
            id: d.id, 
            ...data, 
            listing: listingDoc.exists() ? listingDoc.data() : null 
          };
        }));
        setPurchases(purchasesData);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dashboard_data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  if (!user) return null;

  const totalSpent = (purchases || []).reduce((sum, p) => sum + (p?.price || 0), 0);
  const completedPurchasesCount = (purchases || []).filter(p => p?.status === 'completed').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

      <div className="flex items-center gap-4 mb-8">
        <LayoutDashboard className="h-10 w-10 text-violet-400" />
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {userData?.displayName || user.email?.split('@')[0]}</p>
        </div>
      </div>

      {userData?.isVerifiedSeller && (
        <div className="mb-8">
          <Link to="/verify" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20">
            <PlusCircle className="h-5 w-5" /> New Listing
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Purchases</h3>
            <ShoppingBag className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-display font-bold text-white">{purchases.length}</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Spent</h3>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-display font-bold text-white">${totalSpent.toFixed(2)}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-red-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-red-500/20 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Wallet Balance</h3>
            <Wallet className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-display font-bold text-white">${(userData?.balance || 0).toFixed(2)}</p>
            <button 
              onClick={() => setShowAddFunds(true)}
              className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all"
            >
              <PlusCircle className="h-3 w-3" /> Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-8">
        <nav className="flex space-x-8">
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'purchases' ? 'text-red-500' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Purchases
            {activeTab === 'purchases' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'wallet' ? 'text-red-500' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Wallet
            {activeTab === 'wallet' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'settings' ? 'text-red-500' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Settings
            {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full"></span>}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'wallet' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Your Wallet</h3>
                      <p className="text-gray-400 text-sm">Manage your balance and add funds securely.</p>
                    </div>
                    <Wallet className="h-10 w-10 text-red-500 opacity-50" />
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-2xl p-8 mb-8 text-center">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Available Balance</p>
                    <p className="text-5xl font-display font-black text-white">${(userData?.balance || 0).toFixed(2)}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-red-500" />
                        Add Funds to Wallet
                      </h4>
                      <p className="text-gray-400 text-sm mb-6">Add money to your account to make instant purchases without entering payment details every time.</p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {['10', '25', '50', '100'].map(amount => (
                          <button 
                            key={amount}
                            onClick={() => setAddAmount(amount)}
                            className={`py-3 rounded-xl font-bold transition-all border ${addAmount === amount ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                          >
                            ${amount}
                          </button>
                        ))}
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                          <input 
                            type="number" 
                            value={addAmount}
                            onChange={e => setAddAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            placeholder="Other"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleAddFunds}
                        disabled={processingFunds || !addAmount || parseFloat(addAmount) <= 0}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processingFunds ? 'Processing...' : `Add $${parseFloat(addAmount || '0').toFixed(2)} to Wallet`}
                        <ArrowUpRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                      <h4 className="text-white font-bold mb-4">Recent Wallet Activity</h4>
                      <div className="text-center py-10">
                        <Clock className="h-10 w-10 text-gray-600 mx-auto mb-3 opacity-50" />
                        <p className="text-gray-500 text-sm">No recent transactions found.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                  <h3 className="text-xl font-bold text-white mb-6">Profile Settings</h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Display Name</label>
                      <input 
                        type="text" 
                        value={profileForm.displayName} 
                        onChange={e => setProfileForm({...profileForm, displayName: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50" 
                        placeholder="e.g. John Doe" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Profile Picture URL</label>
                      <input 
                        type="url" 
                        value={profileForm.photoURL} 
                        onChange={e => setProfileForm({...profileForm, photoURL: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50" 
                        placeholder="https://example.com/avatar.jpg" 
                      />
                      {profileForm.photoURL && (
                        <div className="mt-4 h-20 w-20 rounded-full overflow-hidden border-2 border-white/20">
                          <img src={profileForm.photoURL} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Bio</label>
                      <textarea 
                        rows={4} 
                        value={profileForm.bio} 
                        onChange={e => setProfileForm({...profileForm, bio: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none" 
                        placeholder="Tell us about yourself..." 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                    >
                      {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'purchases' && (
              <div>
                {purchases.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">No purchases yet</h3>
                    <p className="text-gray-400">You haven't bought anything yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchases.map(purchase => (
                      <div key={purchase.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${purchase.status === 'Pending Delivery' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {purchase.status}
                          </span>
                          <span className="text-lg font-bold text-white">${purchase.price.toFixed(2)}</span>
                        </div>
                        <h4 className="font-bold text-white mb-1 truncate">{purchase.listing?.title || 'Unknown Listing'}</h4>
                        <p className="text-sm text-gray-400 mb-4">Seller: @{purchase.listing?.sellerUsername || 'Seller'}</p>
                        
                        <div className="flex flex-col gap-3">
                          <Link 
                            to={`/account-details/${purchase.id}`}
                            className="w-full bg-red-600 hover:bg-red-500 text-white text-center py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 mb-1"
                          >
                            <CheckCircle className="h-4 w-4" /> View Details
                          </Link>
                          <Link to={`/offer/${purchase.listingId}`} className="w-full bg-white/10 hover:bg-white/20 text-white text-center py-2 rounded-lg text-sm font-bold transition-colors">
                            View Listing
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFunds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#161616] border border-[#262626] rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Add Funds</h2>
                <button onClick={() => setShowAddFunds(false)} className="text-gray-500 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddFunds} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Amount to Add ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                    <input 
                      type="number" 
                      value={addAmount}
                      onChange={e => setAddAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-white text-2xl font-black focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['10', '25', '50', '100', '250', '500'].map(amount => (
                    <button 
                      key={amount}
                      type="button"
                      onClick={() => setAddAmount(amount)}
                      className={`py-2 rounded-xl font-bold text-sm transition-all border ${addAmount === amount ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200/80 leading-relaxed">
                    Funds added to your wallet are non-refundable and can only be used for purchases on GameVault.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={processingFunds || !addAmount || parseFloat(addAmount) <= 0}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingFunds ? 'Processing...' : `Confirm & Pay $${parseFloat(addAmount || '0').toFixed(2)}`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
