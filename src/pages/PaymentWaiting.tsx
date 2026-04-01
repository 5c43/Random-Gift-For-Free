import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function PaymentWaiting() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const [status, setStatus] = useState<string>('awaiting_payment');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!purchaseId) return;

    const unsubscribe = onSnapshot(doc(db, 'purchases', purchaseId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStatus(data.status);
        
        if (data.status === 'Pending Delivery') {
          // Success! Redirect to chat after a short delay
          setTimeout(() => {
            navigate(`/chat/${data.listingId}`);
          }, 2000);
        }
      } else {
        setError('Purchase not found.');
      }
    }, (err) => {
      console.error("Error watching purchase:", err);
      setError('Failed to track payment status.');
    });

    return () => unsubscribe();
  }, [purchaseId, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          {status === 'awaiting_payment' ? (
            <div className="relative">
              <Loader2 className="h-24 w-24 text-violet-500 animate-spin mx-auto" />
              <Clock className="h-8 w-8 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          ) : status === 'Pending Delivery' ? (
            <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
          ) : (
            <div className="h-24 w-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
          )}
        </motion.div>

        <h2 className="text-3xl font-black text-white mb-4">
          {status === 'awaiting_payment' ? 'Waiting for Payment...' : 
           status === 'Pending Delivery' ? 'Payment Confirmed!' : 
           'Payment Failed'}
        </h2>

        <p className="text-gray-400 mb-8 leading-relaxed">
          {status === 'awaiting_payment' ? 
            "We're waiting for Ziina to confirm your payment. This usually takes a few seconds. Please don't close this page." : 
           status === 'Pending Delivery' ? 
            "Your payment was successful! Redirecting you to the secure chat..." : 
            "There was an issue with your payment. Please contact support if this persists."}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            Auto-checking status every 3 seconds
          </div>
        </div>
      </div>
    </div>
  );
}
