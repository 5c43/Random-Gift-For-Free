import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, orderBy, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  ShieldAlert, 
  Package, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  FileText,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AdminProducts() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [reorderList, setReorderList] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user || (userData?.role !== 'admin' && user.uid !== 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2')) return;

    const unsubscribeListings = onSnapshot(collection(db, 'listings'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory: sortOrder asc, then createdAt desc
      docs.sort((a: any, b: any) => {
        const orderA = a.sortOrder ?? 999999;
        const orderB = b.sortOrder ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
      setListings(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'listings');
    });

    const qPurchases = query(collection(db, 'purchases'));
    const unsubscribePurchases = onSnapshot(qPurchases, (snapshot) => {
      setPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'purchases');
      setLoading(false);
    });

    return () => {
      unsubscribeListings();
      unsubscribePurchases();
    };
  }, [user, userData]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
      showToast('Product deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `listings/${id}`);
      showToast('Failed to delete product', 'error');
    }
  };

  const handleClone = async (product: any) => {
    try {
      const { id, createdAt, ...rest } = product;
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'listings'), {
        ...rest,
        title: `${rest.title} (Copy)`,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      showToast('Product cloned successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'listings');
      showToast('Failed to clone product', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredListings.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredListings.map(l => l.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      selectedProducts.forEach(id => {
        batch.delete(doc(db, 'listings', id));
      });
      await batch.commit();
      setSelectedProducts([]);
      showToast(`${selectedProducts.length} products deleted successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'listings');
      showToast('Failed to delete products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      reorderList.forEach((item, index) => {
        batch.update(doc(db, 'listings', item.id), { sortOrder: index });
      });
      await batch.commit();
      showToast('Order saved successfully');
      setHasOrderChanges(false);
      setIsReorderMode(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'listings');
      showToast('Failed to save order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleReorderMode = () => {
    if (isReorderMode) {
      if (hasOrderChanges) {
        if (window.confirm('You have unsaved changes. Save them before leaving?')) {
          handleSaveOrder();
        } else {
          setIsReorderMode(false);
          setHasOrderChanges(false);
        }
      } else {
        setIsReorderMode(false);
      }
    } else {
      setIsReorderMode(true);
      setReorderList([...listings]);
      setHasOrderChanges(false);
      setSelectedProducts([]); // Clear selection when reordering
    }
  };

  const handleReorder = (newOrder: any[]) => {
    setReorderList(newOrder);
    setHasOrderChanges(true);
  };

  const getSalesCount = (listingId: string) => {
    return purchases.filter(p => p.listingId === listingId && (p.status === 'completed' || p.status === 'Pending Delivery')).length;
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || (userData?.role !== 'admin' && user.uid !== 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2')) {
    return (
      <div className="flex justify-center py-32">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white/5 backdrop-blur-md border border-red-500/20 p-12 rounded-3xl shadow-2xl">
          <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 text-lg">You do not have permission to view this page.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-red-500" />
            <h1 className="text-4xl font-extrabold text-white">Products</h1>
          </div>
          <p className="text-gray-400">Manage your product inventory.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isReorderMode ? (
            <>
              <button 
                onClick={handleSaveOrder}
                disabled={!hasOrderChanges || loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Order
              </button>
              <button 
                onClick={() => { setIsReorderMode(false); setHasOrderChanges(false); }}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleReorderMode}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Reorder Products
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Embed Guide
              </button>
              <Link 
                to="/create-listing"
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#161616] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5">
          <div className="flex items-center gap-4">
            <button 
              disabled={selectedProducts.length === 0}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 disabled:opacity-50 flex items-center gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Bulk Edit
              {selectedProducts.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{selectedProducts.length}</span>}
            </button>
            <button 
              onClick={handleBulkDelete}
              disabled={selectedProducts.length === 0 || loading}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
              {selectedProducts.length > 0 && <span className="bg-white text-red-600 text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-black">{selectedProducts.length}</span>}
            </button>
            <span className="text-xs text-gray-500 italic">
              {selectedProducts.length === 0 ? 'Select products first.' : `${selectedProducts.length} products selected`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Quick Search by Name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all w-full md:w-64"
              />
            </div>
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isReorderMode ? (
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-6 flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-emerald-400" />
                Drag and drop products to change their display order on the marketplace.
              </p>
              <Reorder.Group axis="y" values={reorderList} onReorder={handleReorder} className="space-y-3">
                {reorderList.map((product) => (
                  <Reorder.Item 
                    key={product.id} 
                    value={product}
                    className="bg-black/40 border border-white/10 p-4 rounded-2xl flex items-center justify-between group cursor-grab active:cursor-grabbing hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-gray-600 group-hover:text-emerald-400 transition-colors">
                        <ArrowUpDown className="h-5 w-5" />
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="h-full w-full p-2 text-gray-700" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{product.title}</h4>
                        <p className="text-xs text-gray-500">{product.game} • {product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-black">${product.price.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-600 font-mono uppercase">ID: {product.id.substring(0, 8)}</div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 font-bold">
                  <input 
                    type="checkbox" 
                    checked={selectedProducts.length === filteredListings.length && filteredListings.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500/50"
                  />
                </th>
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Price</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold">Group</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Visibility</th>
                <th className="px-6 py-4 font-bold">Sales</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-gray-500 font-medium">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredListings.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500/50"
                      />
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono text-gray-500">
                      {product.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="h-full w-full p-2 text-gray-700" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-white truncate max-w-[200px]">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-emerald-400">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${product.stockCount > 0 ? 'text-gray-300' : 'text-red-400'}`}>
                        {product.stockCount === 999999 ? '∞' : product.stockCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                      {product.game}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                      {product.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        product.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {product.status === 'active' ? 'public' : 'hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      {getSalesCount(product.id)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/create-listing?edit=${product.id}`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleClone(product)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="Clone"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link 
                          to={`/offer/${product.id}`}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="View in Shop"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
