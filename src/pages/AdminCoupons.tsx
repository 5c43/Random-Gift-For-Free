import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Ticket, Plus, Trash2, Edit2, CheckCircle, XCircle, Calendar, Percent, DollarSign, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AdminCoupons() {
  const { user, userData } = useAuth();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    expiryDate: '',
    usageLimit: 0,
    status: 'active'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (!user || (userData?.role !== 'admin' && user.uid !== 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2')) return;

    const q = query(collection(db, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'coupons');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  if (!user || (userData?.role !== 'admin' && user.uid !== 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2')) {
    return (
      <div className="flex justify-center py-32">
        <div className="text-center bg-white/5 backdrop-blur-md border border-red-500/20 p-12 rounded-3xl shadow-2xl">
          <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 text-lg">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase) || 0,
        maxDiscount: Number(formData.maxDiscount) || 0,
        usageLimit: Number(formData.usageLimit) || 0,
        expiryDate: formData.expiryDate ? Timestamp.fromDate(new Date(formData.expiryDate)) : null,
        updatedAt: serverTimestamp()
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), data);
        showToast('Coupon updated successfully!');
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...data,
          usageCount: 0,
          createdAt: serverTimestamp()
        });
        showToast('Coupon created successfully!');
      }

      setShowAddModal(false);
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: 0,
        expiryDate: '',
        usageLimit: 0,
        status: 'active'
      });
    } catch (error) {
      console.error("Error saving coupon:", error);
      showToast('Failed to save coupon.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      showToast('Coupon deleted successfully!');
    } catch (error) {
      console.error("Error deleting coupon:", error);
      showToast('Failed to delete coupon.', 'error');
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <Ticket className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white">Manage Coupons</h1>
            <p className="text-gray-400 mt-1">Create and manage discount codes for your marketplace.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingCoupon(null);
            setFormData({
              code: '',
              discountType: 'percentage',
              discountValue: 0,
              minPurchase: 0,
              maxDiscount: 0,
              expiryDate: '',
              usageLimit: 0,
              status: 'active'
            });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-5 w-5" />
          Create Coupon
        </button>
      </div>

      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input 
          type="text"
          placeholder="Search by coupon code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map(coupon => (
            <motion.div 
              key={coupon.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#161616] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 -mr-16 -mt-16 pointer-events-none transition-all duration-500 group-hover:opacity-20 ${
                coupon.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
              }`}></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${coupon.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {coupon.status === 'active' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${coupon.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {coupon.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingCoupon(coupon);
                      setFormData({
                        code: coupon.code,
                        discountType: coupon.discountType,
                        discountValue: coupon.discountValue,
                        minPurchase: coupon.minPurchase || 0,
                        maxDiscount: coupon.maxDiscount || 0,
                        expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate.toDate()).toISOString().split('T')[0] : '',
                        usageLimit: coupon.usageLimit || 0,
                        status: coupon.status
                      });
                      setShowAddModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-black text-white mb-1 tracking-wider">{coupon.code}</div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  {coupon.discountType === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                  <span>{coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '$'} OFF</span>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Usage</span>
                  <span className="text-white font-medium">
                    {coupon.usageCount} / {coupon.usageLimit || '∞'}
                  </span>
                </div>
                {coupon.minPurchase > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Min. Purchase</span>
                    <span className="text-white font-medium">${coupon.minPurchase}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Expires</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {coupon.expiryDate ? coupon.expiryDate.toDate().toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredCoupons.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
              <Ticket className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No coupons found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#161616] border border-[#262626] rounded-3xl p-8 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Coupon Code</label>
                  <input 
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER20"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Discount Type</label>
                    <select 
                      value={formData.discountType}
                      onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Value</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={formData.discountValue}
                      onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Min. Purchase ($)</label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.minPurchase}
                      onChange={e => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Max Discount ($)</label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.maxDiscount}
                      onChange={e => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                      placeholder="0 for no limit"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Expiry Date</label>
                    <input 
                      type="date"
                      value={formData.expiryDate}
                      onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Usage Limit</label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      placeholder="0 for no limit"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Status</label>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'active' })}
                      className={`flex-1 py-3 rounded-xl font-bold border transition-all ${
                        formData.status === 'active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500'
                      }`}
                    >
                      Active
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'inactive' })}
                      className={`flex-1 py-3 rounded-xl font-bold border transition-all ${
                        formData.status === 'inactive' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-gray-500'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/20 mt-4"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
