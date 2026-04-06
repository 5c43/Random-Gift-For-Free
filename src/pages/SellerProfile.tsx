import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ShieldCheck, Star, Clock, User, MessageSquare, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export function SellerProfile() {
  const { id: sellerId } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;

    const fetchSellerData = async () => {
      try {
        const sellerDoc = await getDoc(doc(db, 'users', sellerId));
        if (sellerDoc.exists()) {
          setSeller({ id: sellerDoc.id, ...sellerDoc.data() });
        }

        const qListings = query(
          collection(db, 'listings'),
          where('sellerId', '==', sellerId),
          where('status', '==', 'active')
        );
        const listingsSnapshot = await getDocs(qListings);
        setListings(listingsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((listing: any) => (listing.stockCount ?? 1) > 0)
        );

        const qReviews = query(
          collection(db, 'reviews'),
          where('sellerId', '==', sellerId),
          orderBy('createdAt', 'desc')
        );
        const reviewsSnapshot = await getDocs(qReviews);
        setReviews(reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching seller data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-500"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-32">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-3xl inline-block shadow-2xl">
          <User className="h-20 w-20 text-gray-500 mx-auto mb-6 opacity-50" />
          <h2 className="text-3xl font-extrabold text-white mb-2">Seller not found</h2>
          <p className="text-gray-400 text-lg">The user you are looking for does not exist.</p>
        </motion.div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Profile Header */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 shadow-2xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
            <div className="h-full w-full rounded-full bg-black/50 flex items-center justify-center overflow-hidden border-2 border-white/20">
              {seller.photoURL ? (
                <img src={seller.photoURL} alt={seller.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-16 w-16 text-gray-300" />
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h1 className="text-4xl font-extrabold text-white">{seller.displayName || 'Anonymous Seller'}</h1>
              <div className="flex items-center gap-3">
                {seller.isVerifiedSeller && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/30 shadow-inner">
                    <ShieldCheck className="h-4 w-4" />
                    Verified
                  </span>
                )}
                <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/20 shadow-inner">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{averageRating}</span>
                  <span className="text-yellow-400/60 text-xs font-medium">({reviews.length})</span>
                </div>
              </div>
            </div>
            {seller.username && (
              <p className="text-violet-400 font-bold text-lg mb-4">@{seller.username}</p>
            )}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-300 mb-6 font-medium">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <ShoppingBag className="h-5 w-5 text-fuchsia-400" />
                <span>{listings.length} Active Listings</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <Clock className="h-5 w-5 text-violet-400" />
                <span>Joined {seller.createdAt ? format(seller.createdAt.toDate(), 'MMM yyyy') : 'Unknown'}</span>
              </div>
            </div>
            
            <p className="text-gray-400 max-w-2xl text-lg leading-relaxed">
              {seller.bio || "This seller hasn't added a bio yet."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Active Listings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="h-8 w-8 text-fuchsia-400" />
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Active Listings</h2>
          </div>
          
          {listings.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 text-center shadow-inner">
              <ShoppingBag className="h-16 w-16 text-gray-500 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg font-medium">No active listings at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <Link key={listing.id} to={`/offer/${listing.id}`} className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-violet-500/50 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] transform hover:-translate-y-1">
                  <div className="h-40 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 relative flex items-center justify-center overflow-hidden border-b border-white/10">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <span className="text-5xl font-extrabold text-white/20 uppercase tracking-widest transform -rotate-12 group-hover:scale-110 transition-transform duration-500">{listing.game}</span>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10">
                      {listing.device}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-white mb-2 group-hover:text-violet-300 transition-colors line-clamp-1">{listing.title}</h3>
                    <div className="flex justify-between items-center mt-6">
                      <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">${listing.price.toFixed(2)}</span>
                      <span className="text-sm font-bold text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">{listing.deliveryTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-8 w-8 text-violet-400" />
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Reviews</h2>
          </div>
          
          {reviews.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 text-center shadow-inner">
              <Star className="h-16 w-16 text-gray-500 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg font-medium">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-lg hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{review.buyerName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500 font-medium">{format(review.createdAt.toDate(), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-bold text-yellow-400 text-sm">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
