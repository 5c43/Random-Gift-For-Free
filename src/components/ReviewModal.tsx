import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, MessageSquare, ShieldCheck } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  title: string;
  subtitle: string;
  type: 'site' | 'seller';
}

export function ReviewModal({ isOpen, onClose, onSubmit, title, subtitle, type }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#161616] border border-[#262626] rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-8">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                type === 'site' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {type === 'site' ? <ShieldCheck className="h-10 w-10" /> : <Star className="h-10 w-10" />}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
              <p className="text-gray-400">{subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        (hover || rating) >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Your Opinion (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all h-32 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                  rating === 0 || isSubmitting
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : type === 'site'
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
