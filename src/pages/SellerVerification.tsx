import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShieldCheck, User, Link as LinkIcon, MessageSquare, CheckCircle2, Plus, ArrowRight, ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function SellerVerification() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: userData?.username || '',
    bio: userData?.bio || '',
    photoURL: userData?.photoURL || '',
    platformLink: '',
    reviewCount: '',
    telegram: '',
    discord: '',
    agreed: false,
  });

  if (!user) {
    return (
      <div className="flex justify-center py-32">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white mb-6">Please log in to apply</h2>
          <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-violet-500/20">
            Log In
          </button>
        </motion.div>
      </div>
    );
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.username || !formData.bio) {
        setError('Please fill in all required fields.');
        return;
      }
    } else if (step === 2) {
      if (!formData.platformLink || !formData.reviewCount) {
        setError('Please fill in all required fields.');
        return;
      }
      if (parseInt(formData.reviewCount) < 30) {
        setError('You need at least 30 reviews to apply for verification.');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.agreed) {
      setError('You must agree to the platform rules and escrow terms.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'seller_applications'), {
        uid: user.uid,
        username: formData.username,
        photoURL: formData.photoURL,
        bio: formData.bio,
        platformLink: formData.platformLink,
        reviewCount: parseInt(formData.reviewCount),
        telegram: formData.telegram,
        discord: formData.discord,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setStep(4);
    } catch (err: any) {
      console.error("Error submitting application:", err);
      setError(err.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-[#161616] border border-[#262626] p-12 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#10B981]"></div>
          <CheckCircle2 className="h-20 w-20 text-[#10B981] mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Application Submitted!</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            We'll review your profile and get back to you within 24 hours. You'll receive a notification once your status is updated.
          </p>
          <button onClick={() => navigate('/')} className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all border border-white/10">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0B0B0B] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`flex items-center gap-2 ${step >= s ? 'text-violet-400' : 'text-gray-600'}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= s ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700 bg-transparent'}`}>
                  {s}
                </div>
                <span className="text-sm font-bold hidden sm:block">
                  {s === 1 ? 'Essentials' : s === 2 ? 'Requirements' : 'Agreement'}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
            />
          </div>
        </div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#161616] border border-[#262626] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Profile Essentials</h2>
                <p className="text-gray-400">Let's start with your basic profile information.</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full bg-[#1A1A1A] border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-violet-500/50">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <Plus className="h-10 w-10 text-gray-600 group-hover:text-violet-400 transition-colors" />
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Photo URL"
                    value={formData.photoURL}
                    onChange={e => setFormData({...formData, photoURL: e.target.value})}
                    className="mt-4 w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input 
                      type="text" 
                      required
                      placeholder="Your unique username"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Bio</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Tell us about yourself and your selling experience..."
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Verification Requirements</h2>
                <p className="text-gray-400">Prove your credibility as a trusted seller.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Selling Platform Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input 
                      type="url" 
                      required
                      placeholder="e.g., PlayerAuctions, EpicNPC, G2G profile link"
                      value={formData.platformLink}
                      onChange={e => setFormData({...formData, platformLink: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Total Review Count</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input 
                      type="number" 
                      required
                      min="30"
                      placeholder="Minimum 30 reviews required"
                      value={formData.reviewCount}
                      onChange={e => setFormData({...formData, reviewCount: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  {formData.reviewCount && parseInt(formData.reviewCount) < 30 && (
                    <p className="mt-2 text-xs text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      You need at least 30 reviews to apply for verification.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Telegram</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                      <input 
                        type="text" 
                        placeholder="@username"
                        value={formData.telegram}
                        onChange={e => setFormData({...formData, telegram: e.target.value})}
                        className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Discord</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                      <input 
                        type="text" 
                        placeholder="username#0000"
                        value={formData.discord}
                        onChange={e => setFormData({...formData, discord: e.target.value})}
                        className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Escrow & Rules Agreement</h2>
                <p className="text-gray-400">Final step to complete your application.</p>
              </div>

              <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Escrow System</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      I understand that payments are held in escrow to protect buyers and sellers. Funds are released only after the buyer confirms delivery or the dispute period ends.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
                    <Info className="h-6 w-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Platform Rules</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      I agree to follow all platform rules, including no off-site trading, honest descriptions, and timely delivery.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-4 p-4 bg-[#1A1A1A] border border-[#262626] rounded-2xl cursor-pointer group hover:border-violet-500/30 transition-all">
                <input 
                  type="checkbox"
                  checked={formData.agreed}
                  onChange={e => setFormData({...formData, agreed: e.target.checked})}
                  className="h-6 w-6 rounded border-gray-700 bg-transparent text-violet-600 focus:ring-violet-500 focus:ring-offset-0 transition-all"
                />
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                  I agree to the platform rules and escrow terms.
                </span>
              </label>
            </div>
          )}

          <div className="mt-12 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
            ) : (
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-10 py-4 rounded-2xl font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/20"
              >
                Next Step
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-10 py-4 rounded-2xl font-bold bg-[#6366F1] hover:bg-[#4F46E5] text-white transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
                <CheckCircle2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
