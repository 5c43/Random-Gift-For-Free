import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Search, Filter, ChevronDown, Gamepad2, Eye, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function Marketplace() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('All Games');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Newest First');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const games = [
    "All Games", "Fortnite", "Valorant", "League of Legends", "CS2", 
    "Genshin Impact", "Roblox", "Minecraft", "Apex Legends", "Dota 2", "Call of Duty", "FIFA", "Rust", "GTA V"
  ];

  const categories = ["All Categories", "Accounts", "Items", "Boosting", "Currency", "Software"];
  const sortOptions = ["Newest First", "Price: Low to High", "Price: High to Low", "Most Viewed"];


  const mockListings = [
    {
      id: 'mock1',
      game: 'Fortnite',
      title: 'Fortnite OG Account - Renegade Raider & Pink Ghoul',
      details: 'Lvl 500 • OG • 300+ skins',
      price: 1299.99,
      sellerName: 'FortniteKing',
      sellerUsername: 'fortniteking',
      sellerId: 'mock-seller-1',
      views: 5420,
      category: 'Accounts',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: 'mock2',
      game: 'Fortnite',
      title: 'Fortnite Account - 100+ Skins (Galaxy & Ikonik)',
      details: 'Lvl 250 • Rare • 120+ skins',
      price: 249.99,
      sellerName: 'SkinsTrader',
      sellerUsername: 'skinstrader',
      sellerId: 'mock-seller-2',
      views: 1856,
      category: 'Accounts',
      status: 'active',
      createdAt: new Date(Date.now() - 172800000)
    },
    {
      id: 'mock3',
      game: 'Fortnite',
      title: 'Fortnite Account - Black Knight & Sparkle Specialist',
      details: 'Lvl 400 • OG • 200+ skins',
      price: 449.99,
      sellerName: 'OGMaster',
      sellerUsername: 'ogmaster',
      sellerId: 'mock-seller-3',
      views: 3100,
      featured: true,
      category: 'Accounts',
      status: 'active',
      createdAt: new Date()
    }
  ];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        if (data.length === 0) {
          setListings(mockListings);
        } else {
          setListings(data);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
        setListings(mockListings);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = (listings || [])
    .filter(listing => {
      const title = listing?.title || '';
      const game = listing?.game || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           game.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGame = selectedGame === 'All Games' || game === selectedGame;
      const matchesCategory = selectedCategory === 'All Categories' || (listing?.category || 'Accounts') === selectedCategory;
      const hasStock = (listing?.stockCount ?? 1) > 0;
      const isAvailable = (listing?.status || 'active') === 'active';
      return matchesSearch && matchesGame && matchesCategory && hasStock && isAvailable;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest First') {
        // If both have sortOrder, use it (ascending as per AdminProducts logic)
        if (typeof a.sortOrder === 'number' && typeof b.sortOrder === 'number') {
          return a.sortOrder - b.sortOrder;
        }
        // If only one has sortOrder, prioritize it
        if (typeof a.sortOrder === 'number') return -1;
        if (typeof b.sortOrder === 'number') return 1;

        // Fallback to createdAt
        const dateA = a?.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b?.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'Price: Low to High') return (a?.price || 0) - (b?.price || 0);
      if (sortBy === 'Price: High to Low') return (b?.price || 0) - (a?.price || 0);
      if (sortBy === 'Most Viewed') return (b?.views || 0) - (a?.views || 0);
      return 0;
    });

  return (
    <div className="min-h-screen text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-2">Our Products</h1>
          <p className="text-gray-400">Browse {filteredListings.length} premium gaming assets</p>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-12">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search accounts, skins, v-bucks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-2xl pl-14 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all shadow-2xl"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Games Filter */}
            <div className="relative">
              <button 
                onClick={() => setOpenDropdown(openDropdown === 'games' ? null : 'games')}
                className="bg-[#161616] border border-[#262626] text-white px-6 py-4 rounded-2xl font-medium hover:bg-[#1A1A1A] transition-all flex items-center gap-3 shadow-lg min-w-[160px] justify-between"
              >
                {selectedGame} <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === 'games' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'games' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#161616] border border-[#262626] rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl">
                    {games.map(game => (
                      <button 
                        key={game} 
                        onClick={() => {
                          setSelectedGame(game);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedGame === game ? 'bg-red-500 text-white' : 'hover:bg-red-500/10 hover:text-red-400'}`}
                      >
                        {game}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Categories Filter */}
            <div className="relative">
              <button 
                onClick={() => setOpenDropdown(openDropdown === 'categories' ? null : 'categories')}
                className="bg-[#161616] border border-[#262626] text-white px-6 py-4 rounded-2xl font-medium hover:bg-[#1A1A1A] transition-all flex items-center gap-3 shadow-lg min-w-[160px] justify-between"
              >
                {selectedCategory} <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === 'categories' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'categories' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#161616] border border-[#262626] rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl">
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => {
                          setSelectedCategory(cat);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedCategory === cat ? 'bg-red-500 text-white' : 'hover:bg-red-500/10 hover:text-red-400'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <button 
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className="bg-[#161616] border border-[#262626] text-white px-6 py-4 rounded-2xl font-medium hover:bg-[#1A1A1A] transition-all flex items-center gap-3 shadow-lg min-w-[180px] justify-between"
              >
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-gray-400" /> {sortBy}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'sort' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#161616] border border-[#262626] rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl">
                    {sortOptions.map(option => (
                      <button 
                        key={option} 
                        onClick={() => {
                          setSortBy(option);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === option ? 'bg-red-500 text-white' : 'hover:bg-red-500/10 hover:text-red-400'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {(selectedGame !== 'All Games' || selectedCategory !== 'All Categories' || searchTerm) && (
              <button 
                onClick={() => {
                  setSelectedGame('All Games');
                  setSelectedCategory('All Categories');
                  setSearchTerm('');
                }}
                className="text-red-500 hover:text-red-400 text-sm font-bold uppercase tracking-widest px-4"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-[#161616] border border-[#262626] rounded-3xl overflow-hidden hover:border-red-500/50 transition-all shadow-xl hover:shadow-red-500/10"
              >
                <Link to={`/offer/${listing.id}`}>
                  {/* Top Area */}
                  <div className="relative h-48 bg-gradient-to-br from-red-900/20 to-red-950/20 overflow-hidden">
                    {listing.images && listing.images[0] ? (
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="h-16 w-16 text-white/10" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 flex gap-2">
                      {listing.featured && (
                        <span className="bg-[#10B981] text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="p-6">
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-yellow-500/20 uppercase tracking-wider">
                        {listing.game}
                      </span>
                      <span className="bg-white/5 text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-wider">
                        {listing.category || 'Accounts'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                      {listing.title}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-6">
                      {listing.details || `${listing.level ? `Lvl ${listing.level}` : ''} ${listing.rank ? `• ${listing.rank}` : ''} ${listing.skins ? `• ${listing.skins}` : ''}`}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Price</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-extrabold text-[#10B981]">${listing.price.toFixed(2)}</p>
                          {listing.originalPrice && listing.originalPrice > listing.price && (
                            <p className="text-sm font-bold text-gray-500 line-through">${listing.originalPrice.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-500/20 uppercase tracking-wider">
                            Instant Delivery
                          </span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="bg-white/5 text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-wider">
                            Stock: {listing.stockCount === 999999 ? '∞' : listing.stockCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 group-hover:shadow-red-500/40">
                        View Details
                        <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          →
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
