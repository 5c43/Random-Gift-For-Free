import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle2, CreditCard, ArrowLeft, MessageSquare, Loader2, Zap, Wallet } from 'lucide-react';

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const quantity = parseInt(queryParams.get('qty') || '1');

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [chatId, setChatId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ziina' | 'wallet'>('ziina');
  const { user, userData } = useAuth();
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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const subtotal = listing ? listing.price * quantity : 0;
  const discount = quantity >= 3 ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const handlePayWithZiina = async () => {
    if (!listing || !user) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const purchaseId = `${user.uid}_${listing.id}_${Date.now()}`;
      
      const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      
      try {
        await setDoc(doc(db, 'purchases', purchaseId), {
          listingId: listing.id,
          listingTitle: listing.title,
          buyerId: user.uid,
          buyerEmail: user.email || '',
          sellerId: listing.sellerId,
          price: total,
          quantity: quantity,
          receiptEmail: user.email || '',
          status: 'awaiting_payment',
          paymentMethod: 'Ziina Pay',
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `purchases/${purchaseId}`);
        setPaymentError('Failed to create order record. Please try again.');
        setPaymentLoading(false);
        return;
      }

      // Get Ziina payment URL
      const amountInCents = Math.round(total * 100);
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
        }),
      });

      const data = await response.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error(data.error || 'Failed to get redirect URL');
      }
    } catch (error: any) {
      console.error("Ziina error:", error);
      setPaymentError(error.message || 'Failed to initiate payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!listing || !user || !userData) return;
    
    if ((userData.balance || 0) < total) {
      setPaymentError('Insufficient wallet balance. Please top up your wallet.');
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const purchaseId = `${user.uid}_${listing.id}_${Date.now()}`;
      
      const { runTransaction, doc, serverTimestamp } = await import('firebase/firestore');
      
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) throw new Error("User not found");
        const currentBalance = userDoc.data().balance || 0;
        
        if (currentBalance < total) throw new Error("Insufficient balance");
        
        // Deduct balance
        transaction.update(userRef, {
          balance: currentBalance - total
        });
        
        // Create purchase
        const purchaseRef = doc(db, 'purchases', purchaseId);
        transaction.set(purchaseRef, {
          listingId: listing.id,
          listingTitle: listing.title,
          buyerId: user.uid,
          buyerEmail: user.email || '',
          sellerId: listing.sellerId,
          price: total,
          quantity: quantity,
          receiptEmail: user.email || '',
          status: 'Pending Delivery',
          paymentMethod: 'Wallet Balance',
          createdAt: serverTimestamp(),
        });

        // Update listing status
        const listingRef = doc(db, 'listings', listing.id);
        transaction.update(listingRef, {
          status: 'pending'
        });

        // Create notification for seller
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          uid: listing.sellerId,
          title: "New Sale!",
          message: `You have a new sale for ${total.toFixed(2)} USD. Please deliver the account.`,
          type: "sale",
          link: `/dashboard?tab=sales`,
          read: false,
          createdAt: serverTimestamp()
        });
      });

      setStep(3);
    } catch (error: any) {
      console.error("Wallet payment error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'wallet_payment');
      setPaymentError(error.message || 'Failed to process wallet payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'ziina') {
      handlePayWithZiina();
    } else {
      handlePayWithWallet();
    }
  };

  if (loading && step !== 3) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-32">
        <h2 className="text-2xl font-bold text-white">Listing not found</h2>
        <Link to="/" className="text-red-400 mt-4 block">Return to Marketplace</Link>
      </div>
    );
  }

  const steps = [
    { id: 1, name: 'Review Order' },
    { id: 2, name: 'Pay via Ziina' },
    { id: 3, name: 'Confirm' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#262626 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-4xl font-black text-white tracking-tight">Secure Checkout</h1>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-20 max-w-2xl mx-auto">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center relative">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all border ${
                  step >= s.id ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-white/5 border-white/5 text-gray-500'
                }`}>
                  {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : s.id}
                </div>
                <span className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${
                  step >= s.id ? 'text-white' : 'text-gray-500'
                }`}>
                  {s.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-grow h-px mx-4 transition-all ${
                  step > s.id ? 'bg-red-600' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-10 shadow-2xl">
                    <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Order Summary</h2>
                    <div className="flex flex-col sm:flex-row gap-8 items-center p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="h-24 w-24 bg-red-600/20 rounded-2xl flex items-center justify-center text-4xl font-black text-red-500 border border-red-500/20">
                        {(listing?.game || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-center sm:text-left flex-grow">
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{listing?.title || 'Order'}</h3>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                          <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-3 py-1 rounded-lg border border-red-500/20 uppercase tracking-widest">
                            {listing?.game || 'Unknown Game'}
                          </span>
                          <span className="bg-white/5 text-gray-400 text-[10px] font-black px-3 py-1 rounded-lg border border-white/10 uppercase tracking-widest">
                            Qty: {quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-white">
                        ${listing.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-10 shadow-2xl">
                    <h2 className="text-2xl font-black text-white mb-10 tracking-tight">Escrow Protection</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <ShieldCheck className="h-7 w-7 text-red-500" />
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight">Payment held in escrow</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Your money is locked until you confirm receipt.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight">Buyer guarantee</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Full refund if the account is not as described.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                          <Zap className="h-7 w-7 text-yellow-500" />
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight">Fast release</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Seller gets paid immediately after your confirmation.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep(2)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-[2rem] transition-all text-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transform hover:-translate-y-1"
                  >
                    Proceed to Payment
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-10 shadow-2xl">
                    <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Select Payment Method</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      <button 
                        onClick={() => setPaymentMethod('ziina')}
                        className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 ${
                          paymentMethod === 'ziina' ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'ziina' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Ziina Pay</h4>
                          <p className="text-xs text-gray-500 mt-1">Apple Pay, Google Pay, Cards</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('wallet')}
                        className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 ${
                          paymentMethod === 'wallet' ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'wallet' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                          <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Wallet Balance</h4>
                          <p className="text-xs text-gray-500 mt-1">Balance: ${(userData?.balance || 0).toFixed(2)}</p>
                        </div>
                      </button>
                    </div>

                    {paymentMethod === 'ziina' ? (
                      <div className="space-y-6">
                        <p className="text-gray-500 leading-relaxed font-medium">
                          Complete your payment securely via Ziina. Licensed by the Central Bank of the UAE.
                        </p>
                        <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 text-center">
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Payment Reference</p>
                          <p className="text-3xl font-mono font-black text-red-500 tracking-tighter">GV-{Date.now()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-gray-500 leading-relaxed font-medium">
                          Pay instantly using your GameVault wallet balance. No extra fees.
                        </p>
                        {(userData?.balance || 0) < total && (
                          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-3">
                            <Zap className="h-5 w-5" />
                            Insufficient balance. Please top up or use Ziina.
                          </div>
                        )}
                      </div>
                    )}

                    {paymentError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm text-center my-8 font-bold">
                        {paymentError}
                      </div>
                    )}

                    <button 
                      onClick={handlePayment}
                      disabled={paymentLoading || (paymentMethod === 'wallet' && (userData?.balance || 0) < total)}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-[2rem] transition-all text-xl text-center shadow-[0_0_30px_rgba(220,38,38,0.3)] transform hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-4 mt-8"
                    >
                      {paymentLoading ? (
                        <Loader2 className="h-7 w-7 animate-spin" />
                      ) : (
                        paymentMethod === 'ziina' ? <CreditCard className="h-7 w-7" /> : <Wallet className="h-7 w-7" />
                      )}
                      {paymentLoading ? 'Processing...' : `Pay $${total.toFixed(2)} Now`}
                    </button>
                    <p className="text-center text-[10px] text-gray-600 mt-6 font-black uppercase tracking-widest">
                      {paymentMethod === 'ziina' ? 'Powered by Ziina — Licensed by the Central Bank of the UAE' : 'Instant Payment via GameVault Wallet'}
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-16 shadow-2xl text-center"
                >
                  <div className="h-28 w-28 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-10">
                    <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                  </div>
                  <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Order Placed!</h2>
                  <p className="text-gray-500 text-xl mb-16 max-w-md mx-auto font-medium leading-relaxed">
                    Your payment is held safely in escrow. The seller has been notified to deliver your assets.
                  </p>

                  <div className="max-w-md mx-auto space-y-8 text-left mb-16">
                    <h3 className="text-2xl font-black text-white mb-8 tracking-tight">What's next?</h3>
                    <div className="flex gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white flex-shrink-0">1</div>
                      <p className="text-gray-500 font-medium leading-relaxed">Seller delivers account info via the secure chat</p>
                    </div>
                    <div className="flex gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white flex-shrink-0">2</div>
                      <p className="text-gray-500 font-medium leading-relaxed">You verify and confirm receipt in your dashboard</p>
                    </div>
                    <div className="flex gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white flex-shrink-0">3</div>
                      <p className="text-gray-500 font-medium leading-relaxed">Funds are released to the seller automatically</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link to={chatId ? `/chat/${chatId}` : "/chat"} className="bg-red-600 hover:bg-red-500 text-white font-black px-12 py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                      <MessageSquare className="h-6 w-6" /> Open Secure Chat
                    </Link>
                    <Link to="/dashboard" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black px-12 py-5 rounded-2xl transition-all flex items-center justify-center text-lg">
                      Go to Dashboard
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Price Breakdown */}
          <div className="lg:col-span-4">
            <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-10 sticky top-28 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-10 tracking-tight">Price Breakdown</h3>
              <div className="space-y-6 mb-10">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Item price</span>
                  <span className="text-white font-bold">${listing.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Quantity</span>
                  <span className="text-white font-bold">{quantity}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-bold">
                    <span>Bulk Discount (10%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Buyer protection</span>
                  <span className="text-emerald-500 font-bold">Free</span>
                </div>
                <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                  <span className="text-xl font-black text-white uppercase tracking-widest">Total</span>
                  <span className="text-4xl font-black text-red-500 tracking-tighter">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  <ShieldCheck className="h-5 w-5 text-red-500" />
                  Secure escrow protection
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Buyer guarantee on every order
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Instant delivery after payment
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 text-center">
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Protected by GameVault Escrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
