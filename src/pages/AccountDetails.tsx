import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShieldCheck, Copy, Check, ExternalLink, Gamepad2, Info, AlertCircle, Star, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AccountDetails() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  
  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user || !purchaseId) return;

    const fetchData = async () => {
      try {
        const purchaseDoc = await getDoc(doc(db, 'purchases', purchaseId));
        if (purchaseDoc.exists()) {
          const purchaseData = purchaseDoc.data();
          if (purchaseData.buyerId !== user.uid) {
            navigate('/');
            return;
          }
          setPurchase({ id: purchaseDoc.id, ...purchaseData });
          setIsReviewSubmitted(!!purchaseData.reviewed);

          const listingDoc = await getDoc(doc(db, 'listings', purchaseData.listingId));
          if (listingDoc.exists()) {
            setListing({ id: listingDoc.id, ...listingDoc.data() });
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `purchases/${purchaseId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [purchaseId, user, navigate]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus({ ...copyStatus, [key]: true });
    setTimeout(() => {
      setCopyStatus({ ...copyStatus, [key]: false });
    }, 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !purchase || submittingReview) return;

    setSubmittingReview(true);
    try {
      // Add review to reviews collection
      await addDoc(collection(db, 'reviews'), {
        uid: user.uid,
        username: userData?.username || user.email?.split('@')[0],
        photoURL: userData?.photoURL || user.photoURL || null,
        rating,
        comment,
        listingId: purchase.listingId,
        listingTitle: listing?.title || 'Unknown Listing',
        createdAt: serverTimestamp()
      });

      // Mark purchase as reviewed
      await updateDoc(doc(db, 'purchases', purchaseId!), {
        reviewed: true
      });

      setIsReviewSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!purchase) return null;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight">Purchase Successful!</h1>
          <p className="text-gray-400 text-xl font-medium">Your account details are ready below.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Account Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="bg-[#161616] border border-[#262626] rounded-[2.5rem] overflow-hidden shadow-2xl">
              {/* Listing Info Header */}
              <div className="p-8 border-b border-[#262626] bg-white/5 flex items-center gap-6">
                {listing?.images?.[0] && (
                  <div className="h-24 w-24 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 shadow-lg">
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">{listing?.title}</h2>
                  <p className="text-gray-400 font-bold">{listing?.game} • <span className="text-red-500">${purchase.price.toFixed(2)}</span></p>
                </div>
              </div>

              {/* Account Details Section */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 gap-6">
                  {/* Email / Username */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Email / Username</label>
                    <div className="relative group">
                      <input 
                        readOnly
                        type="text" 
                        value={purchase.accountEmail || 'Pending Delivery...'} 
                        className="w-full bg-black/40 border border-[#262626] rounded-2xl px-6 py-5 text-white font-mono text-lg focus:outline-none transition-all group-hover:border-red-500/30"
                      />
                      {purchase.accountEmail && (
                        <button 
                          onClick={() => handleCopy(purchase.accountEmail, 'email')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-xl"
                        >
                          {copyStatus['email'] ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Password</label>
                    <div className="relative group">
                      <input 
                        readOnly
                        type="text" 
                        value={purchase.accountPassword || 'Pending Delivery...'} 
                        className="w-full bg-black/40 border border-[#262626] rounded-2xl px-6 py-5 text-white font-mono text-lg focus:outline-none transition-all group-hover:border-red-500/30"
                      />
                      {purchase.accountPassword && (
                        <button 
                          onClick={() => handleCopy(purchase.accountPassword, 'password')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-xl"
                        >
                          {copyStatus['password'] ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Extra Info */}
                  {purchase.extraInfo && (
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Extra Info (Skins, Notes, etc.)</label>
                      <div className="bg-black/40 border border-[#262626] rounded-2xl px-6 py-5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {purchase.extraInfo}
                      </div>
                    </div>
                  )}
                </div>

                {!purchase.accountEmail && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 flex items-start gap-6">
                    <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-xl font-black text-white mb-2">Manual Delivery Required</h4>
                      <p className="text-gray-400 leading-relaxed">
                        This account requires manual delivery by the seller. Please contact us on our <a href="https://discord.gg/0-n" target="_blank" rel="noopener noreferrer" className="text-red-500 font-bold hover:underline">Discord Server</a> and create a ticket with your Order ID: <span className="text-white font-mono">{purchase.id}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Review Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className={`bg-[#161616] border border-[#262626] rounded-[2.5rem] p-8 shadow-2xl transition-all ${!isReviewSubmitted ? 'ring-2 ring-red-500/50' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <Star className="h-6 w-6 text-yellow-500 fill-current" />
                <h3 className="text-xl font-black text-white">Leave a Review</h3>
              </div>

              {isReviewSubmitted ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Review Submitted!</h4>
                  <p className="text-gray-400 text-sm">Thank you for your feedback. You can now return to your dashboard.</p>
                  <Link 
                    to="/dashboard"
                    className="mt-8 w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Please leave a review to complete your purchase and unlock full dashboard access.
                  </p>
                  
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`h-8 w-8 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Comment</label>
                    <textarea
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-black/40 border border-[#262626] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                      placeholder="How was your experience?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Submit Review
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
              <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Secure Transaction
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Your order ID is <span className="text-white font-mono">{purchase.id}</span>. Please keep this for your records.
              </p>
              <a 
                href="https://discord.gg/0-n" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-300 transition-all border border-white/5"
              >
                <MessageSquare className="h-4 w-4" />
                Need Help? Join Discord
              </a>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            All purchases are protected by our <Link to="/terms" className="text-red-400 hover:underline">Terms of Service</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

