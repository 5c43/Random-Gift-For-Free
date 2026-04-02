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
    "Genshin Impact", "Roblox", "Minecraft", "Apex Legends", "Dota 2", "World of Warcraft"
  ];

  const categories = ["All Categories", "Accounts", "Items", "Boosting", "Currency"];
  const sortOptions = ["Newest First", "Price: Low to High", "Price: High to Low", "Most Viewed"];

  const mockListings = [
    {
      id: 'mock1',
      game: 'League of Legends',
      title: 'League of Legends Diamond Account - 200+ Skins',
      details: 'Lvl 380 • Diamond 2 • 200+ skins',
      price: 189.99,
      sellerName: 'LeagueMaster',
      sellerUsername: 'leaguemaster',
      sellerId: 'mock-seller-1',
      views: 1240,
      category: 'Accounts',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: 'mock2',
      game: 'Roblox',
      title: 'Roblox Account - 50K Robux + Limited Items',
      details: 'Lvl N/A • Premium • 50+ limiteds',
      price: 149.99,
      sellerName: 'RobloxTrader',
      sellerUsername: 'robloxtrader',
      sellerId: 'mock-seller-2',
      views: 856,
      category: 'Accounts',
      status: 'active',
      createdAt: new Date(Date.now() - 172800000)
    },
    {
      id: 'mock3',
      game: 'Apex Legends',
      title: 'Apex Legends Predator Account - Heirloom Set',
      details: 'Lvl 500 • Predator • 100+ legendaries',
      price: 349.99,
      sellerName: 'ApexPred',
      sellerUsername: 'apexpred',
      sellerId: 'mock-seller-3',
      views: 2100,
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
      return matchesSearch && matchesGame && matchesCategory;
    })
    .sort((a, b) => {
      const dateA = a?.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b?.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      if (sortBy === 'Newest First') return dateB - dateA;
      if (sortBy === 'Price: Low to High') return (a?.price || 0) - (b?.price || 0);
      if (sortBy === 'Price: High to Low') return (b?.price || 0) - (a?.price || 0);
      if (sortBy === 'Most Viewed') return (b?.views || 0) - (a?.views || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-2">Marketplace</h1>
          <p className="text-gray-400">Browse {filteredListings.length} listings</p>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-12">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search accounts, items, games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-2xl pl-14 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all shadow-2xl"
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
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedGame === game ? 'bg-violet-500 text-white' : 'hover:bg-[#10B981] hover:text-black'}`}
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
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedCategory === cat ? 'bg-violet-500 text-white' : 'hover:bg-[#10B981] hover:text-black'}`}
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
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === option ? 'bg-violet-500 text-white' : 'hover:bg-[#10B981] hover:text-black'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
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
                className="group bg-[#161616] border border-[#262626] rounded-3xl overflow-hidden hover:border-violet-500/50 transition-all shadow-xl hover:shadow-violet-500/10"
              >
                <Link to={`/offer/${listing.id}`}>
                  {/* Top Area */}
                  <div className="relative h-48 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 overflow-hidden">
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
                    <div className="flex gap-2 mb-4">
                      <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-yellow-500/20 uppercase tracking-wider">
                        {listing.game}
                      </span>
                      <span className="bg-white/5 text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-wider">
                        {listing.category || 'Accounts'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
                      {listing.title}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-6">
                      {listing.details || `${listing.level ? `Lvl ${listing.level}` : ''} • ${listing.rank || ''} • ${listing.skins || ''}`}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-2xl font-extrabold text-[#10B981]">${listing.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Seller</p>
                        <p className="text-sm font-bold text-violet-400">@{listing.sellerUsername || listing.sellerName}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 group-hover:shadow-violet-500/40">
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
