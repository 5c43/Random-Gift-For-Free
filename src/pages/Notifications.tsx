import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Trash2, ShoppingCart, DollarSign, MessageSquare, Info, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'sale': return <DollarSign className="h-5 w-5 text-emerald-400" />;
      case 'purchase': return <ShoppingCart className="h-5 w-5 text-blue-400" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-violet-400" />;
      default: return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-violet-600/20 rounded-2xl flex items-center justify-center">
            <Bell className="h-6 w-6 text-violet-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Notifications</h1>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2"
          >
            <Check className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all hover:bg-white/10 ${!notification.read ? 'border-l-4 border-l-violet-500' : ''}`}
              >
                <div className="flex gap-6">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notification.type === 'sale' ? 'bg-emerald-500/10' :
                    notification.type === 'purchase' ? 'bg-blue-500/10' :
                    notification.type === 'message' ? 'bg-violet-500/10' : 'bg-white/10'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4">
                      {notification.link && (
                        <Link 
                          to={notification.link}
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs font-bold text-violet-400 hover:text-violet-300 uppercase tracking-widest"
                        >
                          View Details
                        </Link>
                      )}
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No notifications yet</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
