import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function PaymentWaiting() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const [status, setStatus] = useState<string>('awaiting_payment');
  const statusRef = React.useRef(status);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!purchaseId) return;

    const unsubscribe = onSnapshot(doc(db, 'purchases', purchaseId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStatus(data.status);
        
        if (data.status === 'Pending Delivery') {
          // Increment coupon usage if applicable
          if (data.couponId) {
            const incrementCoupon = async () => {
              try {
                const { doc, updateDoc, increment } = await import('firebase/firestore');
                const couponRef = doc(db, 'coupons', data.couponId);
                await updateDoc(couponRef, {
                  usageCount: increment(1)
                });
              } catch (err) {
                console.error("Error incrementing coupon usage:", err);
              }
            };
            incrementCoupon();
          }

          // Success! Redirect to account details after a short delay
          setTimeout(() => {
            navigate(`/account-details/${purchaseId}`);
          }, 2000);
        }
      } else {
        setError('Purchase not found.');
      }
    }, (err) => {
      console.error("Error watching purchase:", err);
      setError('Failed to track payment status.');
    });

    // Manual poll as backup
    const pollInterval = setInterval(async () => {
      if (statusRef.current === 'awaiting_payment') {
        try {
          const response = await fetch(`/api/check-payment-status/${purchaseId}`);
          const data = await response.json();
          if (data.status === 'Pending Delivery') {
            setStatus('Pending Delivery');
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [purchaseId, navigate]);

  return (
    <div className="min-h-screen text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#262626 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-md w-full bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 text-center shadow-2xl relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-10"
        >
          {status === 'awaiting_payment' ? (
            <div className="relative inline-block">
              <Loader2 className="h-28 w-28 text-red-600 animate-spin mx-auto" />
              <Clock className="h-10 w-10 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          ) : status === 'Pending Delivery' ? (
            <div className="h-28 w-28 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            </div>
          ) : (
            <div className="h-28 w-28 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-14 w-14 text-red-500" />
            </div>
          )}
        </motion.div>

        <h2 className="text-4xl font-black text-white mb-6 tracking-tight">
          {status === 'awaiting_payment' ? 'Waiting for Payment...' : 
           status === 'Pending Delivery' ? 'Payment Confirmed!' : 
           'Payment Failed'}
        </h2>

        <p className="text-gray-500 mb-10 leading-relaxed font-medium text-lg">
          {status === 'awaiting_payment' ? 
            "We're waiting for Ziina to confirm your payment. This usually takes a few seconds. Please don't close this page." : 
           status === 'Pending Delivery' ? 
            "Your payment was successful! Redirecting you to your account details..." : 
            "There was an issue with your payment. Please contact support if this persists."}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm mb-8 font-bold">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {status === 'awaiting_payment' && (
            <div className="space-y-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/check-payment-status/${purchaseId}`);
                    const data = await response.json();
                    if (data.status === 'Pending Delivery') {
                      setStatus('Pending Delivery');
                    }
                  } catch (err) {
                    console.error("Manual check error:", err);
                  }
                }}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 text-sm tracking-widest uppercase"
              >
                Check Status Manually
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-3 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
            <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            Auto-checking status every 5 seconds
          </div>
        </div>
      </div>
    </div>
  );
}
