import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShieldAlert, Trash2, CheckCircle, XCircle, Users, ShoppingBag, Clock, ExternalLink, MessageSquare, User, AlertCircle, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Admin() {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (!user || (userData?.role !== 'admin' && user.uid !== 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2')) return;

    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const qListings = query(collection(db, 'listings'));
    const unsubscribeListings = onSnapshot(qListings, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'listings');
    });

    const qApps = query(collection(db, 'seller_applications'));
    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'seller_applications');
    });

    const qWithdrawals = query(collection(db, 'withdrawals'));
    const unsubscribeWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'withdrawals');
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeListings();
      unsubscribeApps();
      unsubscribeWithdrawals();
    };
  }, [user, userData]);

  if (!user || (userData?.role !== 'admin' && user.uid !== 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2')) {
    return (
      <div className="flex justify-center py-32">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white/5 backdrop-blur-md border border-red-500/20 p-12 rounded-3xl shadow-2xl">
          <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 text-lg">You do not have permission to view this page.</p>
        </motion.div>
      </div>
    );
  }

  const handleVerifySeller = async (userId: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVerifiedSeller: isVerified });
    } catch (error) {
      console.error("Error updating seller status:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: { userId: user?.uid, email: user?.email, role: userData?.role },
        operationType: 'update',
        path: `users/${userId}`
      };
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleApproveApplication = async (app: any) => {
    try {
      const { writeBatch, doc, serverTimestamp } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'seller_applications', app.id), { 
        status: 'approved',
        processedAt: serverTimestamp()
      });
      
      batch.update(doc(db, 'users', app.uid), { 
        isVerifiedSeller: true,
        username: app.username,
        bio: app.bio,
        photoURL: app.photoURL || ''
      });
      
      await batch.commit();
      setSelectedApp(null);
    } catch (error) {
      console.error("Error approving application:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: { userId: user?.uid, email: user?.email, role: userData?.role },
        operationType: 'write',
        path: `seller_applications/${app.id} & users/${app.uid}`
      };
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleRejectApplication = async (app: any) => {
    if (!rejectionReason) return;
    try {
      await updateDoc(doc(db, 'seller_applications', app.id), { 
        status: 'rejected',
        rejectionReason,
        processedAt: serverTimestamp()
      });
      setSelectedApp(null);
      setRejectionReason('');
      setShowRejectInput(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: { userId: user?.uid, email: user?.email, role: userData?.role },
        operationType: 'update',
        path: `seller_applications/${app.id}`
      };
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error("Error updating user role:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: { userId: user?.uid, email: user?.email, role: userData?.role },
        operationType: 'update',
        path: `users/${userId}`
      };
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleApproveWithdrawal = async (withdrawal: any) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { 
        status: 'completed',
        processedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: { userId: user?.uid, email: user?.email, role: userData?.role },
        operationType: 'update',
        path: `withdrawals/${withdrawal.id}`
      };
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleRejectWithdrawal = async (withdrawal: any) => {
    try {
      const { writeBatch, doc, serverTimestamp, increment } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'withdrawals', withdrawal.id), { 
        status: 'rejected',
        processedAt: serverTimestamp()
      });
      
      // Refund user balance
      batch.update(doc(db, 'users', withdrawal.uid), { 
        balance: increment(withdrawal.amount)
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: { userId: user?.uid, email: user?.email, role: userData?.role },
        operationType: 'write',
        path: `withdrawals/${withdrawal.id} & users/${withdrawal.uid}`
      };
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      await deleteDoc(doc(db, 'listings', listingId));
    } catch (error) {
      console.error("Error deleting listing:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: { userId: user?.uid, email: user?.email, role: userData?.role },
        operationType: 'delete',
        path: `listings/${listingId}`
      };
      throw new Error(JSON.stringify(errInfo));
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setSendingAnnouncement(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      // Send to all users
      const promises = users.map(u => 
        addDoc(collection(db, 'notifications'), {
          uid: u.id,
          title: "Admin Announcement",
          message: announcement,
          type: "announcement",
          link: "/",
          read: false,
          createdAt: serverTimestamp()
        })
      );
      
      await Promise.all(promises);
      showToast('Announcement sent to all users!');
      setAnnouncement('');
    } catch (error) {
      console.error("Error sending announcement:", error);
      showToast('Failed to send announcement.', 'error');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');

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
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <ShieldAlert className="h-12 w-12 text-violet-400" />
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/traffic"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-bold transition-all border border-white/10"
          >
            <TrendingUp className="h-4 w-4 text-red-500" />
            Traffic
          </Link>
          <Link 
            to="/admin/revenue"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-bold transition-all border border-white/10"
          >
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Revenue
          </Link>
          {user.uid === 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2' && userData?.role !== 'admin' && (
            <button 
              onClick={() => handleUpdateRole(user.uid, 'admin')}
              className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20"
            >
              Activate Admin Role
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-500"></div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Announcements Section */}
          <div className="bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="h-8 w-8 text-violet-400" />
              <h2 className="text-2xl font-bold text-white">Global Announcement</h2>
            </div>
            <div className="space-y-4">
              <textarea 
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="Type your announcement here... It will be sent to all users as a notification."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                rows={3}
              />
              <button 
                onClick={handleSendAnnouncement}
                disabled={sendingAnnouncement || !announcement.trim()}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {sendingAnnouncement ? 'Sending...' : 'Send to All Users'}
              </button>
            </div>
          </div>

          {/* Verification Queue */}
          <div className="bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Verification Queue</h2>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1 rounded-full text-sm font-bold border border-emerald-500/30">
                {pendingApps.length} Pending
              </span>
            </div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-bold">Applicant</th>
                    <th className="pb-4 font-bold">Reviews</th>
                    <th className="pb-4 font-bold">Platform</th>
                    <th className="pb-4 font-bold">Applied On</th>
                    <th className="pb-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingApps.map(app => (
                    <tr key={app.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                            {app.photoURL ? <img src={app.photoURL} alt="" className="h-full w-full object-cover" /> : <User className="h-full w-full p-2 text-gray-600" />}
                          </div>
                          <div>
                            <div className="font-bold text-white">{app.username}</div>
                            <div className="text-xs text-gray-500">{app.uid.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className="text-emerald-400 font-bold">{app.reviewCount}</span>
                      </td>
                      <td className="py-5">
                        <a href={app.platformLink} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-sm font-medium">
                          View Link <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-5 text-gray-400 text-sm">
                        {app.createdAt?.toDate().toLocaleDateString()}
                      </td>
                      <td className="py-5 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingApps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500 font-medium">
                        No pending applications at the moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Withdrawal Requests */}
          <div className="bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Withdrawal Requests</h2>
              </div>
              <span className="bg-yellow-500/20 text-yellow-400 px-4 py-1 rounded-full text-sm font-bold border border-yellow-500/30">
                {withdrawals.filter(w => w.status === 'pending').length} Pending
              </span>
            </div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-bold">User</th>
                    <th className="pb-4 font-bold">Amount</th>
                    <th className="pb-4 font-bold">Wallet Address</th>
                    <th className="pb-4 font-bold">Status</th>
                    <th className="pb-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-5">
                        <div className="font-bold text-white">{users.find(u => u.id === w.uid)?.displayName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{w.uid.substring(0, 8)}...</div>
                      </td>
                      <td className="py-5">
                        <span className="text-emerald-400 font-bold">${w.amount.toFixed(2)}</span>
                      </td>
                      <td className="py-5">
                        <div className="text-xs font-mono text-gray-400 bg-black/40 p-2 rounded border border-white/5 truncate max-w-[200px]" title={w.walletAddress}>
                          {w.walletAddress}
                        </div>
                      </td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                          w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-5 text-right space-x-2">
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveWithdrawal(w)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w)}
                              className="bg-red-600/10 hover:bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-600/20"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500 font-medium">
                        No withdrawal requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Application Detail Modal */}
          <AnimatePresence>
            {selectedApp && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-[#161616] border border-[#262626] rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white">Review Application</h2>
                    <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-white">
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="h-24 w-24 rounded-full bg-gray-800 overflow-hidden border-2 border-violet-500/30">
                        {selectedApp.photoURL ? <img src={selectedApp.photoURL} alt="" className="h-full w-full object-cover" /> : <User className="h-full w-full p-4 text-gray-600" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{selectedApp.username}</h3>
                        <p className="text-gray-400 text-sm mt-1">{selectedApp.uid}</p>
                        <div className="flex gap-4 mt-4">
                          {selectedApp.telegram && (
                            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 bg-sky-400/10 px-3 py-1 rounded-full border border-sky-400/20">
                              <MessageSquare className="h-3 w-3" /> {selectedApp.telegram}
                            </div>
                          )}
                          {selectedApp.discord && (
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20">
                              <MessageSquare className="h-3 w-3" /> {selectedApp.discord}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Bio</h4>
                      <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{selectedApp.bio}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Review Count</h4>
                        <div className="text-3xl font-black text-emerald-400">{selectedApp.reviewCount}</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Platform Link</h4>
                        <a href={selectedApp.platformLink} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 flex items-center gap-2 font-bold">
                          Verify Profile <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-200/80 leading-relaxed">
                        <span className="font-bold text-amber-400">Admin Note:</span> Please manually visit the platform link provided and verify that the review count matches and the profile belongs to this user.
                      </p>
                    </div>

                    {showRejectInput ? (
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <textarea 
                          placeholder="Reason for rejection..."
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                          rows={3}
                        />
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleRejectApplication(selectedApp)}
                            disabled={!rejectionReason}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                          >
                            Confirm Rejection
                          </button>
                          <button 
                            onClick={() => setShowRejectInput(false)}
                            className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 pt-4 border-t border-white/10">
                        <button 
                          onClick={() => handleApproveApplication(selectedApp)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-5 w-5" /> Approve Application
                        </button>
                        <button 
                          onClick={() => setShowRejectInput(true)}
                          className="px-8 bg-red-600/10 hover:bg-red-600/20 text-red-400 py-4 rounded-2xl font-bold transition-all border border-red-600/20 flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-5 w-5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Users Section */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <Users className="h-8 w-8 text-violet-400" />
              <h2 className="text-2xl font-bold text-white">Manage Users</h2>
            </div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-bold">User</th>
                    <th className="pb-4 font-bold">Email</th>
                    <th className="pb-4 font-bold">Role</th>
                    <th className="pb-4 font-bold">Verified Seller</th>
                    <th className="pb-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-5 font-medium text-white">{u.displayName || 'Anonymous'}</td>
                      <td className="py-5 text-gray-400">{u.email}</td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-5">
                        {u.isVerifiedSeller ? (
                          <span className="flex items-center gap-2 text-emerald-400 font-medium">
                            <CheckCircle className="h-5 w-5" /> Yes
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-gray-500 font-medium">
                            <XCircle className="h-5 w-5" /> No
                          </span>
                        )}
                      </td>
                      <td className="py-5 text-right space-x-2">
                        {u.role !== 'admin' ? (
                          <>
                            <button
                              onClick={() => handleUpdateRole(u.id, 'admin')}
                              className="px-4 py-2 rounded-lg text-sm font-bold bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-all"
                            >
                              Make Admin
                            </button>
                            <button
                              onClick={() => handleVerifySeller(u.id, !u.isVerifiedSeller)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg ${
                                u.isVerifiedSeller 
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {u.isVerifiedSeller ? 'Revoke Verification' : 'Verify Seller'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUpdateRole(u.id, 'user')}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border border-gray-500/20 transition-all"
                          >
                            Demote to User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Listings Section */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <ShoppingBag className="h-8 w-8 text-fuchsia-400" />
              <h2 className="text-2xl font-bold text-white">Manage Listings</h2>
            </div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-bold">Title</th>
                    <th className="pb-4 font-bold">Seller</th>
                    <th className="pb-4 font-bold">Price</th>
                    <th className="pb-4 font-bold">Status</th>
                    <th className="pb-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {listings.map(l => (
                    <tr key={l.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-5 font-medium text-white max-w-xs truncate">{l.title}</td>
                      <td className="py-5 text-gray-400">{l.sellerName}</td>
                      <td className="py-5 font-bold text-emerald-400">${l.price.toFixed(2)}</td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          l.status === 'active' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 
                          l.status === 'sold' ? 'bg-gray-800 text-gray-400 border border-gray-700' : 
                          'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <button
                          onClick={() => handleDeleteListing(l.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                          title="Delete Listing"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}
