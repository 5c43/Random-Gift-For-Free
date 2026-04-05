import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ShieldCheck, Upload, DollarSign, List, Info, ChevronDown, CheckCircle2, AlertCircle, GripVertical, Trash2, Plus, Zap } from 'lucide-react';
import { motion, Reorder } from 'motion/react';

export function CreateListing() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    game: 'Fortnite',
    category: 'Accounts',
    level: '',
    rank: '',
    skins: '',
    images: [] as string[],
    deliverableType: 'service' as 'serials' | 'service' | 'dynamic',
    stockCount: '1',
    serials: '',
    instructions: '',
    webhookUrl: '',
  });

  const [newImageUrl, setNewImageUrl] = useState('');

  const games = [
    "Fortnite", "Valorant", "League of Legends", "CS2", "Genshin Impact", 
    "Roblox", "Minecraft", "Apex Legends", "Dota 2", "Call of Duty", "FIFA"
  ];

  const categories = ["Accounts", "Items", "Boosting", "Currency"];

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    if (formData.images.length >= 7) return;
    setFormData({
      ...formData,
      images: [...formData.images, newImageUrl.trim()]
    });
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleReorderImages = (newOrder: string[]) => {
    setFormData({ ...formData, images: newOrder });
  };

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
        deliverableType: formData.deliverableType,
        stockCount: formData.deliverableType === 'serials' 
          ? formData.serials.split('\n').filter(s => s.trim()).length 
          : (formData.stockCount === 'infinite' ? 999999 : parseInt(formData.stockCount)),
        serials: formData.deliverableType === 'serials' ? formData.serials.split('\n').filter(s => s.trim()) : [],
        instructions: formData.instructions,
        webhookUrl: formData.webhookUrl,
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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-8">Please log in to create a listing on the marketplace.</p>
          <button onClick={() => navigate('/login')} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20">
            Log In Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>

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
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Info className="h-5 w-5 text-red-400" />
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
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600" 
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
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600 resize-none" 
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
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all appearance-none"
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
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all appearance-none"
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

          {/* Section 2: Deliverables & Stock */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#161616] border border-[#262626] rounded-3xl p-8 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Deliverables & Stock</h2>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Deliverables Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'serials', title: 'Serials', desc: 'Automatically delivers serial keys. Stock count is based on the number of entered serials.' },
                    { id: 'service', title: 'Service', desc: 'Automatically delivers ONLY instructions. Stock count is entered manually and can be infinite.' },
                    { id: 'dynamic', title: 'Dynamic', desc: 'Automatically delivers content from a specified webhook URL. Stock count is entered manually and can be infinite.' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, deliverableType: type.id as any })}
                      className={`text-left p-5 rounded-2xl border transition-all ${
                        formData.deliverableType === type.id 
                          ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                          : 'bg-[#1A1A1A] border-[#262626] hover:border-gray-700'
                      }`}
                    >
                      <h3 className={`font-bold mb-1 ${formData.deliverableType === type.id ? 'text-red-400' : 'text-white'}`}>{type.title}</h3>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {formData.deliverableType === 'serials' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Serials (One per line)</label>
                  <textarea 
                    required 
                    rows={6} 
                    value={formData.serials} 
                    onChange={e => setFormData({...formData, serials: e.target.value})} 
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600 resize-none font-mono text-sm" 
                    placeholder="Enter serial keys here..." 
                  />
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">
                    Total Stock: {formData.serials.split('\n').filter(s => s.trim()).length}
                  </p>
                </motion.div>
              )}

              {formData.deliverableType === 'service' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Instructions</label>
                    <textarea 
                      required 
                      rows={4} 
                      value={formData.instructions} 
                      onChange={e => setFormData({...formData, instructions: e.target.value})} 
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600 resize-none text-sm" 
                      placeholder="Enter delivery instructions for the buyer..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Stock Count</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.stockCount} 
                      onChange={e => setFormData({...formData, stockCount: e.target.value})} 
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600" 
                      placeholder="Enter number or 'infinite'" 
                    />
                  </div>
                </motion.div>
              )}

              {formData.deliverableType === 'dynamic' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Webhook URL</label>
                    <input 
                      required 
                      type="url" 
                      value={formData.webhookUrl} 
                      onChange={e => setFormData({...formData, webhookUrl: e.target.value})} 
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600" 
                      placeholder="https://your-api.com/deliver" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Stock Count</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.stockCount} 
                      onChange={e => setFormData({...formData, stockCount: e.target.value})} 
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600" 
                      placeholder="Enter number or 'infinite'" 
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Section 3: Screenshot / Image */}
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

            <div className="space-y-6">
              <div className="flex gap-3">
                <input 
                  type="url" 
                  value={newImageUrl} 
                  onChange={e => setNewImageUrl(e.target.value)} 
                  className="flex-grow bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 text-sm" 
                  placeholder="Paste direct image URL (e.g. Imgur, Discord)"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                />
                <button 
                  type="button"
                  onClick={handleAddImage}
                  disabled={!newImageUrl.trim() || formData.images.length >= 7}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 rounded-2xl font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add
                </button>
              </div>

              {formData.images.length > 0 && (
                <Reorder.Group axis="y" values={formData.images} onReorder={handleReorderImages} className="space-y-3">
                  {formData.images.map((url, index) => (
                    <Reorder.Item 
                      key={url + index} 
                      value={url}
                      className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 flex items-center gap-4 group"
                    >
                      <div className="cursor-grab active:cursor-grabbing p-1 text-gray-600 hover:text-gray-400">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      <div className="h-16 w-16 rounded-xl overflow-hidden border border-[#262626] flex-shrink-0 bg-black/40">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=Error';
                          }}
                        />
                      </div>

                      <div className="flex-grow min-w-0">
                        <p className="text-xs text-gray-500 truncate">{url}</p>
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              {formData.images.length === 0 && (
                <div className="border-2 border-dashed border-[#262626] rounded-3xl p-12 text-center">
                  <Upload className="h-12 w-12 text-gray-600 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 font-medium">No images added yet</p>
                  <p className="text-xs text-gray-600 mt-2">Add up to 7 screenshots of your account</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-6 text-center italic">Drag the handles to reorder images. First image will be the cover.</p>
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
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Pricing</h2>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Price ($)</label>
                <div className="space-y-4">
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600 text-2xl font-extrabold text-red-500" 
                    placeholder="0.00" 
                  />
                  {formData.price && parseFloat(formData.price) > 0 && (
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                        <span>Listing Price</span>
                        <span>${parseFloat(formData.price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-red-400/80">
                        <span>Website Fee (5%)</span>
                        <span>-${(parseFloat(formData.price) * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-white/5 my-2"></div>
                      <div className="flex justify-between text-sm font-black uppercase tracking-widest text-red-400">
                        <span>You Receive</span>
                        <span>${(parseFloat(formData.price) * 0.95).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
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
              className="w-full max-w-md mx-auto bg-red-600 hover:bg-red-500 text-white font-extrabold py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transform hover:-translate-y-1 disabled:opacity-50 text-xl"
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
