import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ShieldCheck, Clock, Monitor, CreditCard, MessageSquare, AlertCircle, ChevronRight, Star, ShoppingCart, Zap, Minus, Plus, Info } from 'lucide-react';
import { motion } from 'motion/react';

export function Offer() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);

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

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/${listing.id}?qty=${quantity}`);
  };

  const handleContactSupport = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // For a single-seller store, we can direct to a support chat or a specific admin UID
    const adminUid = 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2'; // From App.tsx admin check
    if (user.uid === adminUid) {
      return;
    }
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        listingId: listing.id,
        buyerId: user.uid,
        sellerId: adminUid,
        createdAt: serverTimestamp(),
      });
      navigate(`/chat/${chatRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
        <h2 className="text-3xl font-extrabold text-white mb-6">Offer Not Found</h2>
        <Link to="/" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">Return to Marketplace</Link>
      </motion.div>
    );
  }

  const images = (listing?.images && listing.images.filter((img: string) => img && img.trim() !== '').length > 0)
    ? listing.images.filter((img: string) => img && img.trim() !== '')
    : [`https://picsum.photos/seed/${(listing?.game || 'game').replace(/\s+/g, '')}/800/400`];

  const subtotal = listing.price * quantity;
  const discount = quantity >= 3 ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Grid Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#262626 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center text-sm text-gray-500 mb-12 font-medium">
          <Link to="/" className="hover:text-red-500 transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4 mx-2 opacity-30" />
          <Link to="/marketplace" className="hover:text-red-500 transition-colors">Marketplace</Link>
          <ChevronRight className="h-4 w-4 mx-2 opacity-30" />
          <span className="text-gray-300 truncate">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-video"
            >
              <img 
                src={images[0]} 
                alt={listing.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </motion.div>

            <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-10 space-y-12 shadow-2xl">
              <section>
                <h3 className="text-xl font-bold text-white mb-6">Features</h3>
                <div className="border-l-2 border-red-500 pl-6 py-1 space-y-4">
                  {listing.description.split('\n').map((line: string, i: number) => (
                    <p key={i} className="text-gray-400">{line}</p>
                  ))}
                  {!listing.description && (
                    <>
                      <p className="text-gray-400">Enable Aimbot</p>
                      <p className="text-gray-400">pSilent</p>
                      <p className="text-gray-400">Prediction</p>
                      <p className="text-gray-400">Bow Prediction</p>
                      <p className="text-gray-400">Bola Prediction</p>
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
                {listing.title}
              </h1>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Instant Delivery
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-black text-white">
                      ${listing.price.toFixed(2)}
                    </div>
                    {listing.originalPrice && listing.originalPrice > listing.price && (
                      <div className="text-lg font-bold text-gray-500 line-through">
                        ${listing.originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {listing.originalPrice && listing.originalPrice > listing.price && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      Save {Math.round((1 - listing.price / listing.originalPrice) * 100)}% Today
                    </p>
                  )}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  (listing.stockCount || 0) > 0 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {listing.stockCount === 999999 ? 'In Stock (∞)' : (listing.stockCount || 0) > 0 ? `In Stock (${listing.stockCount})` : 'Out of Stock'}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quantity</label>
                <div className="flex items-center bg-[#050505] border border-white/5 rounded-2xl overflow-hidden h-14">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 h-full flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="w-20 text-center font-bold text-xl text-white">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => setQuantity(Math.min(listing.stockCount || 1, quantity + 1))}
                    className="flex-1 h-full flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {listing.stockCount !== 999999 && (listing.stockCount || 0) > 0 && (
                  <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">
                    Max available: {listing.stockCount}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/80 text-sm font-bold text-center">
                {quantity < 3 ? `Buy ${3 - quantity} more to get a 10% discount.` : '10% discount applied!'}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Default</span>
                  <span className="text-white font-bold">${listing.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Quantity</span>
                  <span className="text-white font-bold">{quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl pt-4 border-t border-white/5">
                  <span className="text-white font-black uppercase tracking-widest">Total</span>
                  <span className="text-white font-black">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <button 
                  onClick={handleBuyNow}
                  disabled={(listing.stockCount || 0) <= 0}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={(listing.stockCount || 0) <= 0}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-5 w-5 text-red-500" />
                  Buy Now
                </button>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-[2rem] p-6 flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">TradeShield Protected</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Your funds are held in escrow until delivery is confirmed. 24/7 support available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
