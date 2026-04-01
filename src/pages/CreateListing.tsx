import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ShieldCheck, Upload, DollarSign, List, Info, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function CreateListing() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    game: '',
    category: 'Accounts',
    level: '',
    rank: '',
    skins: '',
    images: ['', '', '', ''],
  });

  const games = [
    "Fortnite", "Valorant", "League of Legends", "CS2", "Genshin Impact", 
    "Roblox", "Minecraft", "Apex Legends", "Dota 2", "Call of Duty", "FIFA"
  ];

  const categories = ["Accounts", "Items", "Boosting", "Currency"];

  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'listings'), {
        sellerId: user.uid,
        sellerName: userData?.displayName || user.email?.split('@')[0] || 'Anonymous',
        sellerUsername: userData?.username || '',
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        game: formData.game,
        category: formData.category,
        level: formData.level,
        rank: formData.rank,
        skins: formData.skins,
        images: formData.images.filter(img => img.trim() !== ''),
        status: 'active',
        createdAt: serverTimestamp(),
      });
      navigate('/marketplace');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'listings');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-[#161616] border border-[#262626] p-12 rounded-3xl shadow-2xl max-w-md w-full">
          <AlertCircle className="h-16 w-16 text-violet-500 mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-8">Please log in to create a listing on the marketplace.</p>
          <button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-violet-500/20">
            Log In Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-6"
          >
            <ShieldCheck className="h-4 w-4 text-[#10B981]" />
            <span className="text-xs font-bold text-[#10B981] uppercase tracking-widest">Verified Seller</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            Create Listing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            List your gaming account or items for sale
          </motion.p>
        </div>

        <form onSubmit={handlePostListing} className="space-y-8">
          {/* Section 1: Basic Information */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#161616] border border-[#262626] rounded-3xl p-8 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Info className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Basic Information</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Listing Title</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-gray-600" 
                  placeholder="e.g. Fortnite Account - 200+ Skins, Level 500" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Description</label>
                <textarea 
                  required 
                  rows={5} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-gray-600 resize-none" 
                  placeholder="Describe what's included in detail..." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Game</label>
                  <div className="relative">
                    <select 
                      required 
                      value={formData.game} 
                      onChange={e => setFormData({...formData, game: e.target.value})} 
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 transition-all appearance-none"
                    >
                      <option value="" disabled>Select game</option>
                      {games.map(game => (
                        <option key={game} value={game} className="bg-[#161616]">{game}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Category</label>
                  <div className="relative">
                    <select 
                      required 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="bg-[#161616]">{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Screenshot / Image */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#161616] border border-[#262626] rounded-3xl p-8 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Screenshot / Image</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.images.map((url, index) => (
                <div key={index} className="space-y-3">
                  <div className="relative">
                    <input 
                      type="url" 
                      value={url} 
                      onChange={e => {
                        const newImages = [...formData.images];
                        newImages[index] = e.target.value;
                        setFormData({...formData, images: newImages});
                      }} 
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 text-sm" 
                      placeholder={`Image URL ${index + 1}`}
                    />
                  </div>
                  {url && (
                    <div className="h-32 w-full rounded-2xl overflow-hidden border border-[#262626] bg-black/40 group relative">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+URL';
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-6 text-center italic">Provide direct image URLs (e.g. from Imgur or Discord)</p>
          </motion.div>

          {/* Section 3: Pricing & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#161616] border border-[#262626] rounded-3xl p-8 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#10B981]" />
                </div>
                <h2 className="text-xl font-bold text-white">Pricing</h2>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Price ($)</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 transition-all placeholder:text-gray-600 text-2xl font-extrabold text-[#10B981]" 
                  placeholder="0.00" 
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#161616] border border-[#262626] rounded-3xl p-8 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                  <List className="h-5 w-5 text-fuchsia-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Account Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px]">Level</label>
                  <input 
                    type="text" 
                    value={formData.level} 
                    onChange={e => setFormData({...formData, level: e.target.value})} 
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all text-sm" 
                    placeholder="e.g. 500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px]">Rank</label>
                  <input 
                    type="text" 
                    value={formData.rank} 
                    onChange={e => setFormData({...formData, rank: e.target.value})} 
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all text-sm" 
                    placeholder="e.g. Diamond" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px]">Skins / Items Count</label>
                  <input 
                    type="text" 
                    value={formData.skins} 
                    onChange={e => setFormData({...formData, skins: e.target.value})} 
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all text-sm" 
                    placeholder="e.g. 200+ skins" 
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center pt-8"
          >
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full max-w-md mx-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transform hover:-translate-y-1 disabled:opacity-50 text-xl"
            >
              {loading ? 'Creating Listing...' : 'Create Listing'}
            </button>
            <p className="text-xs text-gray-500 mt-6 font-medium uppercase tracking-widest">Your listing will be live instantly after creation</p>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
