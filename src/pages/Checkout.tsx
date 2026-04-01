import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ChevronRight, CheckCircle2, Clock, AlertCircle, CreditCard, ArrowLeft, MessageSquare, Loader2, Zap } from 'lucide-react';

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `listings/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePayWithZiina = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      // 1. Create the purchase record first with 'awaiting_payment' status
      const purchaseId = `${user?.uid}_${listing.id}_${Date.now()}`;
      const { setDoc } = await import('firebase/firestore');
      
      await setDoc(doc(db, 'purchases', purchaseId), {
        listingId: listing.id,
        buyerId: user?.uid,
        sellerId: listing.sellerId,
        price: listing.price,
        receiptEmail: user?.email || '', // Use user email as default
        status: 'awaiting_payment',
        createdAt: serverTimestamp(),
      });

      // 2. Create or find chat
      const chatsQuery = query(
        collection(db, 'chats'),
        where('listingId', '==', listing.id),
        where('buyerId', '==', user?.uid),
        where('sellerId', '==', listing.sellerId)
      );
      const chatSnap = await getDocs(chatsQuery);
      let activeChatId;
      
      if (!chatSnap.empty) {
        activeChatId = chatSnap.docs[0].id;
      } else {
        const chatRef = await addDoc(collection(db, 'chats'), {
          listingId: listing.id,
          buyerId: user?.uid,
          sellerId: listing.sellerId,
          lastMessage: 'Order initiated! Waiting for payment.',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        activeChatId = chatRef.id;
      }

      // 3. Get Ziina payment URL
      const amountInCents = Math.round(listing.price * 100);
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents,
          purchaseId: purchaseId,
          success_url: `${window.location.origin}/payment-waiting/${purchaseId}`,
          cancel_url: `${window.location.origin}/checkout/${listing.id}?purchase=cancel`,
          test: true,
        }),
      });

      const data = await response.json();
      if (data.redirect_url) {
        // Redirect to Ziina
        window.location.href = data.redirect_url;
      } else {
        const errorMessage = data.details && typeof data.details === 'string' && data.details.startsWith('<!DOCTYPE html>') 
          ? 'Ziina API returned an HTML error page (Cloudflare block or wrong endpoint).'
          : (data.error || 'Failed to get redirect URL');
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Ziina error:", error);
      setPaymentError(error.message || 'Failed to initiate payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!receiptEmail) {
      alert('Please enter your Ziina receipt email');
      return;
    }
    setLoading(true);
    try {
      // Create or find chat
      const chatsQuery = query(
        collection(db, 'chats'),
        where('listingId', '==', listing.id),
        where('buyerId', '==', user?.uid),
        where('sellerId', '==', listing.sellerId)
      );
      const chatSnap = await getDocs(chatsQuery);
      let activeChatId;
      
      if (!chatSnap.empty) {
        activeChatId = chatSnap.docs[0].id;
      } else {
        const chatRef = await addDoc(collection(db, 'chats'), {
          listingId: listing.id,
          buyerId: user?.uid,
          sellerId: listing.sellerId,
          lastMessage: 'Order placed! Secure chat opened.',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        activeChatId = chatRef.id;
      }
      setChatId(activeChatId);

      // In a real app, we would verify the payment here
      // For now, we'll just create a "purchase" record
      const { setDoc } = await import('firebase/firestore');
      const purchaseId = `${user?.uid}_${listing.id}`;
      await setDoc(doc(db, 'purchases', purchaseId), {
        listingId: listing.id,
        buyerId: user?.uid,
        sellerId: listing.sellerId,
        price: listing.price,
        receiptEmail,
        status: 'Pending Delivery',
        createdAt: serverTimestamp(),
      });
      // Update listing status to pending
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'listings', listing.id), {
        status: 'pending'
      });

      setStep(3);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'purchases');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step !== 3) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-32">
        <h2 className="text-2xl font-bold text-white">Listing not found</h2>
        <Link to="/" className="text-violet-400 mt-4 block">Return to Marketplace</Link>
      </div>
    );
  }

  const steps = [
    { id: 1, name: 'Review Order' },
    { id: 2, name: 'Pay via Ziina' },
    { id: 3, name: 'Confirm' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-3xl font-extrabold text-white">Secure Checkout</h1>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-16 max-w-2xl mx-auto">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center relative">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= s.id ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white/10 text-gray-500'
              }`}>
                {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : s.id}
              </div>
              <span className={`absolute -bottom-8 whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
                step >= s.id ? 'text-white' : 'text-gray-500'
              }`}>
                {s.name}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-grow h-0.5 mx-4 transition-all ${
                step > s.id ? 'bg-violet-600' : 'bg-white/10'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-8">Order Summary</h2>
                  <div className="flex gap-6 items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="h-20 w-20 bg-violet-600/20 rounded-xl flex items-center justify-center text-3xl font-bold text-violet-400">
                      {listing.game.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{listing.title}</h3>
                      <p className="text-gray-400 font-medium uppercase tracking-wider text-xs">{listing.game}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-500">Rank: <span className="text-gray-300 font-bold">{listing.rank || 'Premium'}</span></span>
                        <span className="text-gray-500">Level: <span className="text-gray-300 font-bold">{listing.level || 'N/A'}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-8">Escrow Protection</h2>
                  <div className="space-y-8">
                    <div className="flex gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="h-6 w-6 text-violet-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Payment held in escrow</h4>
                        <p className="text-gray-400 leading-relaxed">Your money is locked until you confirm receipt.</p>
                      </div>
                    </div>
                    <div className="flex gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Buyer guarantee</h4>
                        <p className="text-gray-400 leading-relaxed">Full refund if the account is not as described.</p>
                      </div>
                    </div>
                    <div className="flex gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Fast release</h4>
                        <p className="text-gray-400 leading-relaxed">Seller gets paid immediately after your confirmation.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold py-5 rounded-2xl transition-all text-xl shadow-lg shadow-violet-500/20 transform hover:-translate-y-1"
                >
                  Proceed to Payment
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-4">Pay with Ziina</h2>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    Click the button below to complete your payment securely via Ziina. Supports Google Pay, credit/debit cards, and multiple currencies.
                  </p>

                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-8 text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Payment Reference</p>
                    <p className="text-2xl font-mono font-bold text-violet-400">GV-{Date.now()}-{Math.random().toString(36).substring(2, 7).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-3">Include this reference in your Ziina payment note so we can match it.</p>
                  </div>

                  {paymentError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center mb-6">
                      {paymentError}
                    </div>
                  )}

                  {paymentUrl ? (
                    <a 
                      href={paymentUrl}
                      className="w-full bg-[#E9FF70] hover:bg-[#d8f050] text-black font-extrabold py-5 rounded-2xl transition-all text-xl text-center shadow-lg transform hover:-translate-y-1 flex items-center justify-center gap-3"
                    >
                      <CreditCard className="h-6 w-6" />
                      Complete Payment Now
                    </a>
                  ) : (
                    <button 
                      onClick={handlePayWithZiina}
                      disabled={paymentLoading}
                      className="w-full bg-[#E9FF70] hover:bg-[#d8f050] text-black font-extrabold py-5 rounded-2xl transition-all text-xl text-center shadow-lg transform hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {paymentLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <CreditCard className="h-6 w-6" />
                      )}
                      {paymentLoading ? 'Redirecting...' : `Pay $${listing.price.toFixed(2)} via Ziina`}
                    </button>
                  )}
                  <p className="text-center text-[10px] text-gray-500 mt-4 font-bold uppercase tracking-widest">Powered by Ziina — Licensed by the Central Bank of the UAE</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 shadow-2xl text-center"
              >
                <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4">Payment Confirmed!</h2>
                <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto">
                  Your payment is held safely in escrow. The seller has been notified to deliver the account.
                </p>

                <div className="max-w-md mx-auto space-y-6 text-left mb-12">
                  <h3 className="text-xl font-bold text-white mb-6">What happens next?</h3>
                  <div className="flex gap-5">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">1</div>
                    <p className="text-gray-400">Seller delivers account info via the secure chat</p>
                  </div>
                  <div className="flex gap-5">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">2</div>
                    <p className="text-gray-400">You verify and confirm receipt in your dashboard</p>
                  </div>
                  <div className="flex gap-5">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">3</div>
                    <p className="text-gray-400">Funds released to seller automatically</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to={chatId ? `/chat/${chatId}` : "/chat"} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold px-10 py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    <MessageSquare className="h-5 w-5" /> Open Secure Chat
                  </Link>
                  <Link to="/dashboard" className="bg-white/10 hover:bg-white/20 text-white font-bold px-10 py-4 rounded-xl transition-all flex items-center justify-center">
                    Go to Dashboard
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - Price Breakdown */}
        <div className="space-y-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 sticky top-28 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-8">Price Breakdown</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-400">
                <span>Item price</span>
                <span className="text-white font-bold">${listing.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Buyer protection</span>
                <span className="text-emerald-400 font-bold">Free</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-lg font-bold text-white">Total</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  ${listing.price.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Secure escrow protection
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Buyer guarantee on every order
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <Zap className="h-4 w-4 text-yellow-400" />
                Instant delivery after payment
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                24/7 dispute resolution
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 text-center">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Protected by GameVault Escrow System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
