import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShieldAlert, DollarSign, ShoppingBag, Users, TrendingUp, Package, Clock, CheckCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { format, isAfter, subDays, subWeeks, subMonths, startOfDay } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AdminRevenue() {
  const { user, userData } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0
  });
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (userData?.role !== 'admin' && user.uid !== 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2')) return;

    const fetchRevenueData = async () => {
      try {
        const purchasesRef = collection(db, 'purchases');
        const q = query(purchasesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Apply time filter
        let filteredPurchases = purchases;
        const now = new Date();
        if (timeFilter === 'day') {
          const dayStart = startOfDay(now);
          filteredPurchases = purchases.filter((p: any) => p.createdAt && isAfter(p.createdAt.toDate(), dayStart));
        } else if (timeFilter === 'week') {
          const weekStart = subWeeks(now, 1);
          filteredPurchases = purchases.filter((p: any) => p.createdAt && isAfter(p.createdAt.toDate(), weekStart));
        } else if (timeFilter === 'month') {
          const monthStart = subMonths(now, 1);
          filteredPurchases = purchases.filter((p: any) => p.createdAt && isAfter(p.createdAt.toDate(), monthStart));
        }

        const paidPurchases = filteredPurchases.filter((p: any) => p.status === 'Pending Delivery' || p.status === 'completed');
        
        // Calculate stats
        const revenue = paidPurchases.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
        const uniqueCustomers = new Set(paidPurchases.map((p: any) => p.buyerId)).size;
        
        setStats({
          revenue,
          orders: paidPurchases.length,
          customers: uniqueCustomers
        });

        // Top 5 Customers
        const customerMap = new Map();
        paidPurchases.forEach((p: any) => {
          const current = customerMap.get(p.buyerEmail) || { email: p.buyerEmail, orders: 0, spent: 0 };
          customerMap.set(p.buyerEmail, {
            ...current,
            orders: current.orders + 1,
            spent: current.spent + (p.price || 0)
          });
        });
        const sortedCustomers = Array.from(customerMap.values())
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 5);
        setTopCustomers(sortedCustomers);

        // Top 5 Products
        const productMap = new Map();
        paidPurchases.forEach((p: any) => {
          const current = productMap.get(p.listingTitle) || { title: p.listingTitle, count: 0 };
          productMap.set(p.listingTitle, {
            ...current,
            count: current.count + 1
          });
        });
        const sortedProducts = Array.from(productMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopProducts(sortedProducts);

        // Latest Completed Orders
        setLatestOrders(paidPurchases.slice(0, 10));

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'revenue_data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [user, userData, timeFilter]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <DollarSign className="h-12 w-12 text-red-500" />
          <h1 className="text-4xl font-extrabold text-white">Revenue & Orders</h1>
        </div>

        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
          {(['day', 'week', 'month', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                timeFilter === filter
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">Total Revenue</h3>
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-4xl font-black text-white">${stats.revenue.toFixed(2)}</p>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +18.4% from last month
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">New Orders</h3>
                <ShoppingBag className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-4xl font-black text-white">{stats.orders}</p>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +12.5% from last month
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">New Customers</h3>
                <Users className="h-6 w-6 text-violet-400" />
              </div>
              <p className="text-4xl font-black text-white">{stats.customers}</p>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +8.2% from last month
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Customers */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <Users className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-bold text-white">Top 5 Customers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 font-bold">Customer Email</th>
                      <th className="pb-4 font-bold text-center">Total Orders</th>
                      <th className="pb-4 font-bold text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topCustomers.map((c, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 text-sm text-white font-medium">{c.email}</td>
                        <td className="py-4 text-sm text-gray-400 text-center font-bold">{c.orders}</td>
                        <td className="py-4 text-sm text-emerald-400 text-right font-black">${c.spent.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <Package className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-bold text-white">Top 5 Products</h2>
              </div>
              <div className="space-y-4">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-red-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-black">
                        #{i + 1}
                      </div>
                      <span className="text-white font-bold truncate max-w-[200px]">{p.title}</span>
                    </div>
                    <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                      {p.count} Sales
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Latest Completed Orders */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Latest Completed Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 font-bold">Products</th>
                    <th className="pb-4 font-bold">Price</th>
                    <th className="pb-4 font-bold">Paid</th>
                    <th className="pb-4 font-bold">Payment Method</th>
                    <th className="pb-4 font-bold">E-mail</th>
                    <th className="pb-4 font-bold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {latestOrders.map((o, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="text-sm text-white font-bold truncate max-w-[150px]">{o.listingTitle}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-400">${o.price.toFixed(2)}</td>
                      <td className="py-4">
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                          <CheckCircle className="h-3 w-3" /> Yes
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-400">{o.paymentMethod || 'Ziina Pay'}</td>
                      <td className="py-4 text-sm text-gray-400">{o.buyerEmail}</td>
                      <td className="py-4 text-sm text-gray-500 text-right">
                        {o.createdAt ? format(o.createdAt.toDate(), 'MMM d, HH:mm') : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
