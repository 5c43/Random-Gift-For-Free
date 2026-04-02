import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, ShoppingBag, DollarSign, List, MessageSquare, PlusCircle, CheckCircle, Wallet, ArrowUpRight, Clock, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Dashboard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'crypto' | 'paypal'>('crypto');
  const [walletAddress, setWalletAddress] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: userData?.displayName || '',
    photoURL: userData?.photoURL || '',
    bio: userData?.bio || ''
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

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
        const qListings = query(collection(db, 'listings'), where('sellerId', '==', user.uid));
        const listingsSnapshot = await getDocs(qListings);
        setListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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

        const qSales = query(collection(db, 'purchases'), where('sellerId', '==', user.uid));
        const salesSnapshot = await getDocs(qSales);
        const salesData = await Promise.all(salesSnapshot.docs.map(async (d) => {
          const data = d.data();
          const listingDoc = await getDoc(doc(db, 'listings', data.listingId));
          const buyerDoc = await getDoc(doc(db, 'users', data.buyerId));
          return { 
            id: d.id, 
            ...data, 
            listing: listingDoc.exists() ? listingDoc.data() : null,
            buyer: buyerDoc.exists() ? buyerDoc.data() : null
          };
        }));
        setSales(salesData);

        const qWithdrawals = query(collection(db, 'withdrawals'), where('uid', '==', user.uid));
        const withdrawalsSnapshot = await getDocs(qWithdrawals);
        setWithdrawals(withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dashboard_data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  if (!user) return null;

  const activeListingsCount = (listings || []).filter(l => l?.status === 'active').length;
  const completedSalesCount = (sales || []).filter(s => s?.status === 'completed').length;
  const totalEarnings = (sales || []).filter(s => s?.status === 'completed').reduce((sum, s) => sum + (s?.price || 0), 0);
  const totalWithdrawn = (withdrawals || []).filter(w => w?.status === 'completed').reduce((sum, w) => sum + (w?.amount || 0), 0);
  const availableBalance = userData?.balance || 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    if (amount > availableBalance) {
      showToast('Insufficient balance.', 'error');
      return;
    }
    if (withdrawMethod === 'crypto' && !walletAddress.trim()) {
      showToast('Please enter a wallet address.', 'error');
      return;
    }
    if (withdrawMethod === 'paypal' && !paypalEmail.trim()) {
      showToast('Please enter your PayPal email.', 'error');
      return;
    }

    setSaving(true);
    try {
      const { writeBatch, increment } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      const withdrawalRef = doc(collection(db, 'withdrawals'));
      batch.set(withdrawalRef, {
        uid: user.uid,
        amount,
        method: withdrawMethod,
        walletAddress: withdrawMethod === 'crypto' ? walletAddress : null,
        paypalEmail: withdrawMethod === 'paypal' ? paypalEmail : null,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Deduct from user balance immediately
      batch.update(doc(db, 'users', user.uid), {
        balance: increment(-amount)
      });
      
      await batch.commit();
      
      showToast('Withdrawal request submitted! Our team will review it shortly.');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWalletAddress('');
      // Refresh data
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'withdrawals');
      showToast('Failed to submit withdrawal request.', 'error');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Active Listings</h3>
            <List className="h-5 w-5 text-violet-400" />
          </div>
          <p className="text-3xl font-display font-bold text-white">{activeListingsCount}</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Completed Sales</h3>
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-display font-bold text-white">{completedSalesCount}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Earnings</h3>
            <DollarSign className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-display font-bold text-white">${totalEarnings.toFixed(2)}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Spent</h3>
            <DollarSign className="h-5 w-5 text-fuchsia-400" />
          </div>
          <p className="text-3xl font-display font-bold text-white">$0.00</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-8">
        <nav className="flex space-x-8">
          <button 
            onClick={() => setActiveTab('listings')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'listings' ? 'text-violet-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            My Listings
            {activeTab === 'listings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-400 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'purchases' ? 'text-violet-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Purchases
            {activeTab === 'purchases' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-400 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'sales' ? 'text-violet-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Sales
            {activeTab === 'sales' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-400 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'wallet' ? 'text-violet-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Wallet
            {activeTab === 'wallet' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-400 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'settings' ? 'text-violet-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Settings
            {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-400 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className={`pb-4 text-sm font-medium transition-colors relative text-gray-400 hover:text-gray-300`}
          >
            Messages
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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-3xl p-8 shadow-2xl shadow-violet-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-violet-200 font-medium mb-2 uppercase tracking-widest text-sm">Available Balance</p>
                      <h2 className="text-5xl font-display font-extrabold text-white mb-8">${availableBalance.toFixed(2)}</h2>
                      <button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="bg-white text-violet-600 px-8 py-3 rounded-xl font-bold hover:bg-violet-50 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <ArrowUpRight className="h-5 w-5" /> Withdraw Funds
                      </button>
                    </div>
                    <Wallet className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10 rotate-12" />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                    <h3 className="text-gray-400 font-medium mb-4">Wallet Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Total Sales</span>
                        <span className="text-white font-bold">${totalEarnings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Total Withdrawn</span>
                        <span className="text-white font-bold">${totalWithdrawn.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-white/10 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Pending Requests</span>
                        <span className="text-yellow-400 font-bold">
                          {withdrawals.filter(w => w.status === 'pending').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Withdrawal History</h3>
                    <Clock className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-500 text-sm uppercase tracking-widest">
                          <th className="px-8 py-4 font-medium">Date</th>
                          <th className="px-8 py-4 font-medium">Amount</th>
                          <th className="px-8 py-4 font-medium">Wallet</th>
                          <th className="px-8 py-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {withdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-gray-500">No withdrawal history yet.</td>
                          </tr>
                        ) : (
                          withdrawals.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).map(w => (
                            <tr key={w.id} className="text-white">
                              <td className="px-8 py-4 text-sm text-gray-400">
                                {w.createdAt?.toDate().toLocaleDateString()}
                              </td>
                              <td className="px-8 py-4 font-bold">${w.amount.toFixed(2)}</td>
                              <td className="px-8 py-4 text-sm font-mono text-gray-400 truncate max-w-[200px]">
                                {w.method === 'paypal' ? w.paypalEmail : w.walletAddress}
                                <span className="ml-2 text-[10px] uppercase opacity-50">({w.method || 'crypto'})</span>
                              </td>
                              <td className="px-8 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                                  w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                  w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  w.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {w.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" 
                        placeholder="e.g. John Doe" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Profile Picture URL</label>
                      <input 
                        type="url" 
                        value={profileForm.photoURL} 
                        onChange={e => setProfileForm({...profileForm, photoURL: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" 
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none" 
                        placeholder="Tell us about yourself..." 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                    >
                      {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'listings' && (
              <div>
                {listings.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <List className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">No listings yet</h3>
                    <p className="text-gray-400 mb-6">You haven't created any listings.</p>
                    {userData?.isVerifiedSeller ? (
                      <Link to="/verify" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full font-medium transition-colors border border-white/10">
                        Create Your First Listing
                      </Link>
                    ) : (
                      <Link to="/verify" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full font-medium transition-colors border border-white/10">
                        Get Verified to Sell
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(listing => (
                      <div key={listing.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${listing.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                            {listing.status}
                          </span>
                          <span className="text-lg font-bold text-white">${listing.price.toFixed(2)}</span>
                        </div>
                        <h4 className="font-bold text-white mb-1 truncate">{listing.title}</h4>
                        <p className="text-sm text-gray-400 mb-4">{listing.game} • {listing.device}</p>
                        <Link to={`/offer/${listing.id}`} className="text-violet-400 hover:text-violet-300 text-sm font-medium">View Listing &rarr;</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                          {purchase.status === 'Pending Delivery' && (
                            <button 
                              onClick={() => handleConfirmDelivery(purchase.id, purchase.listingId)}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mb-1"
                            >
                              <CheckCircle className="h-4 w-4" /> Confirm Delivery
                            </button>
                          )}
                          <div className="flex gap-3">
                            <Link 
                              to={`/chat`} 
                              onClick={async (e) => {
                                e.preventDefault();
                                const { query, where, getDocs, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                                const chatsQuery = query(
                                  collection(db, 'chats'),
                                  where('listingId', '==', purchase.listingId),
                                  where('buyerId', '==', user.uid),
                                  where('sellerId', '==', purchase.sellerId)
                                );
                                const chatSnap = await getDocs(chatsQuery);
                                if (!chatSnap.empty) {
                                  navigate(`/chat/${chatSnap.docs[0].id}`);
                                } else {
                                  const chatRef = await addDoc(collection(db, 'chats'), {
                                    listingId: purchase.listingId,
                                    buyerId: user.uid,
                                    sellerId: purchase.sellerId,
                                    lastMessage: 'Order placed! Secure chat opened.',
                                    lastMessageAt: serverTimestamp(),
                                    createdAt: serverTimestamp(),
                                  });
                                  navigate(`/chat/${chatRef.id}`);
                                }
                              }}
                              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-center py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="h-4 w-4" /> Chat
                            </Link>
                            <Link to={`/offer/${purchase.listingId}`} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-center py-2 rounded-lg text-sm font-bold transition-colors">
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <div>
                {sales.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <DollarSign className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">No sales yet</h3>
                    <p className="text-gray-400">You haven't completed any sales yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sales.map(sale => (
                      <div key={sale.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${sale.status === 'Pending Delivery' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {sale.status}
                          </span>
                          <span className="text-lg font-bold text-white">${sale.price.toFixed(2)}</span>
                        </div>
                        <h4 className="font-bold text-white mb-1 truncate">{sale.listing?.title || 'Unknown Listing'}</h4>
                        <p className="text-sm text-gray-400 mb-4">Buyer: @{sale.buyer?.username || 'Buyer'}</p>
                        
                        <div className="flex gap-3">
                          <Link 
                            to={`/chat`} 
                            onClick={async (e) => {
                              e.preventDefault();
                              // Find or create chat
                              const { query, where, getDocs, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                              const chatsQuery = query(
                                collection(db, 'chats'),
                                where('listingId', '==', sale.listingId),
                                where('buyerId', '==', sale.buyerId),
                                where('sellerId', '==', user.uid)
                              );
                              const chatSnap = await getDocs(chatsQuery);
                              if (!chatSnap.empty) {
                                navigate(`/chat/${chatSnap.docs[0].id}`);
                              } else {
                                const chatRef = await addDoc(collection(db, 'chats'), {
                                  listingId: sale.listingId,
                                  buyerId: sale.buyerId,
                                  sellerId: user.uid,
                                  lastMessage: 'Order placed! Secure chat opened.',
                                  lastMessageAt: serverTimestamp(),
                                  createdAt: serverTimestamp(),
                                });
                                navigate(`/chat/${chatRef.id}`);
                              }
                            }}
                            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-center py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" /> Chat
                          </Link>
                          <Link to={`/offer/${sale.listingId}`} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-center py-2 rounded-lg text-sm font-bold transition-colors">
                            View
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
      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white">Withdraw Funds</h3>
                <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Amount to Withdraw ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input 
                      type="number" 
                      step="0.01"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      placeholder="0.00"
                      max={availableBalance}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Available: ${availableBalance.toFixed(2)}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Withdrawal Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setWithdrawMethod('crypto')}
                      className={`py-3 rounded-xl font-bold border transition-all ${
                        withdrawMethod === 'crypto' 
                          ? 'bg-violet-600/10 border-violet-500 text-violet-400' 
                          : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      Crypto
                    </button>
                    <button 
                      type="button"
                      onClick={() => setWithdrawMethod('paypal')}
                      className={`py-3 rounded-xl font-bold border transition-all ${
                        withdrawMethod === 'paypal' 
                          ? 'bg-violet-600/10 border-violet-500 text-violet-400' 
                          : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      PayPal
                    </button>
                  </div>
                </div>

                {withdrawMethod === 'crypto' ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Crypto Wallet Address</label>
                    <input 
                      type="text" 
                      value={walletAddress}
                      onChange={e => setWalletAddress(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      placeholder="Enter your BTC/ETH/USDT address"
                    />
                    <p className="mt-2 text-xs text-gray-500">Please double-check your address. Transfers are irreversible.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">PayPal Email Address</label>
                    <input 
                      type="email" 
                      value={paypalEmail}
                      onChange={e => setPaypalEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      placeholder="Enter your PayPal email"
                    />
                    <p className="mt-2 text-xs text-gray-500">Payments will be sent manually to this address.</p>
                  </div>
                )}

                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <p className="text-xs text-violet-300 leading-relaxed">
                    Withdrawal requests are reviewed manually by our team. This process typically takes 12-24 hours.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
