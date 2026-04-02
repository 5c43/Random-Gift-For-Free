import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ShieldCheck, Clock, Monitor, CreditCard, MessageSquare, AlertCircle, ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function Offer() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('description');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    navigate(`/checkout/${listing.id}`);
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.uid === listing.sellerId) {
      return;
    }
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        listingId: listing.id,
        buyerId: user.uid,
        sellerId: listing.sellerId,
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="flex items-center text-sm text-gray-400 mb-8 font-medium">
        <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
          Back
        </Link>
        <ChevronRight className="h-4 w-4 mx-2 opacity-50" />
        <span className="hover:text-white transition-colors cursor-pointer">{listing.game}</span>
        <ChevronRight className="h-4 w-4 mx-2 opacity-50" />
        <span className="text-gray-200 truncate max-w-[250px]">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative group">
              <div className="h-72 sm:h-96 bg-gray-900 relative">
                <img 
                  src={images[currentImageIndex]} 
                  alt={listing.game}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-violet-600 rounded-lg flex items-center justify-center text-xl font-bold text-white">
                      {listing.game.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{listing.game}</span>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-lg">{listing.title}</h1>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {images.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-violet-500 w-4' : 'bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10 flex px-8">
              {['description', 'account details', 'reviews (0)'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-6 px-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-8 min-h-[300px]">
              {activeTab === 'description' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg">
                  <p className="whitespace-pre-wrap">{listing.description}</p>
                </motion.div>
              )}
              {activeTab === 'account details' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Account Level</h4>
                      <p className="text-xl font-bold text-white">{listing.level || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Rank</h4>
                      <p className="text-xl font-bold text-white">{listing.rank || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Region</h4>
                      <p className="text-xl font-bold text-white">{listing.region || 'Global'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Main Characters/Skins</h4>
                      <p className="text-xl font-bold text-white">{listing.skins || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'reviews (0)' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Star className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No reviews yet for this listing</p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${listing.sellerUsername || listing.sellerName}&background=random`} 
                    alt={listing.sellerName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <Link to={`/seller/${listing.sellerId}`} className="text-xl font-bold text-white hover:text-violet-400 transition-colors">
                    @{listing.sellerUsername || listing.sellerName}
                  </Link>
                  <div className="flex items-center text-sm text-gray-400 mt-2 font-medium">
                    <span className="text-gray-500">No reviews yet</span>
                    <span className="mx-3 opacity-50">•</span>
                    <span className="text-gray-500">0 sales</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleContactSeller}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Contact Seller</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Checkout */}
        <div className="space-y-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 sticky top-28 shadow-2xl">
            <div className="text-5xl font-black text-white mb-8 tracking-tight">
              ${listing.price.toFixed(2)}
            </div>
            
            <div className="space-y-5 mb-10">
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <div className="flex items-center text-gray-400 gap-3 font-medium">
                  <Monitor className="h-5 w-5 text-violet-400" />
                  <span>Device</span>
                </div>
                <span className="font-bold text-white">{listing.device}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <div className="flex items-center text-gray-400 gap-3 font-medium">
                  <Clock className="h-5 w-5 text-violet-400" />
                  <span>Delivery time</span>
                </div>
                <span className="font-bold text-white">{listing.deliveryTime}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/10">
                <div className="flex items-center text-gray-400 gap-3 font-medium">
                  <ShieldCheck className="h-5 w-5 text-violet-400" />
                  <span>Warranty</span>
                </div>
                <span className="font-bold text-emerald-400">14 Days Free</span>
              </div>
            </div>

            <button 
              onClick={handleBuyNow}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-center font-extrabold py-5 rounded-full transition-all text-xl mb-6 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transform hover:-translate-y-1"
            >
              Buy Now — ${listing.price.toFixed(2)}
            </button>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-8">
              <div className="flex items-start gap-4">
                <ShieldCheck className="h-7 w-7 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-400 text-base">Money-back Guarantee</h4>
                  <p className="text-sm text-emerald-400/80 mt-1.5 leading-relaxed">Protected by TradeShield. Funds are held in escrow until delivery is confirmed.</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Fast Checkout Options</h4>
                <div className="flex gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-center flex-1 shadow-inner">
                    <span className="text-xs font-bold text-gray-400">Apple Pay · Google Pay · Ziina</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-6 pt-6 border-t border-white/10 font-medium">
                  <MessageSquare className="h-4 w-4 text-violet-400" />
                  <span>24/7 Live Support</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">We're always here to help</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <div className="flex flex-col gap-1">
                <span>757 views</span>
                <span>Mar 31, 2026</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span>Funds held in escrow</span>
                <span>Full refund if not as described</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
