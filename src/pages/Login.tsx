import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogIn, ShieldCheck, Zap, Globe, Mail, Lock, User as UserIcon, Phone, Smartphone, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'social' | 'email' | 'phone'>('social');
  
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    email: '', // for signup
  });

  const [phoneData, setPhoneData] = useState({
    number: '',
    code: '',
  });
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    return () => {
      // Cleanup recaptcha if needed
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new OAuthProvider('apple.com');
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Failed to sign in with Apple.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let email = formData.emailOrUsername;
      
      // Check if it's a username
      if (!email.includes('@')) {
        const usernameDoc = await getDoc(doc(db, 'usernames', email.toLowerCase()));
        if (usernameDoc.exists()) {
          email = usernameDoc.data().email;
        } else {
          throw new Error('Username not found.');
        }
      }

      await signInWithEmailAndPassword(auth, email, formData.password);
      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/setup-username');
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return (window as any).recaptchaVerifier;
    
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    return (window as any).recaptchaVerifier;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phoneData.number, verifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error("Phone error:", err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(phoneData.code);
      navigate('/');
    } catch (err: any) {
      console.error("Code error:", err);
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div id="recaptcha-container"></div>
      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] transform rotate-3 hover:rotate-6 transition-transform mb-6">
            <LogIn className="h-10 w-10 text-white transform -rotate-3" />
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-4 text-lg text-gray-400 font-medium">
            {isSignUp ? 'Join the most trusted gaming marketplace.' : 'Sign in to buy, sell, and trade securely.'}
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-center text-sm font-medium relative z-10 shadow-inner">
            {error}
          </motion.div>
        )}

        <div className="mt-10 relative z-10 space-y-6">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setLoginMethod('social')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'social' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Social
            </button>
            <button 
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'email' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Email / User
            </button>
            <button 
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'phone' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Phone
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loginMethod === 'social' && (
              <motion.div 
                key="social"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-white/10 text-lg font-bold rounded-xl text-white bg-white/5 hover:bg-white/10 transition-all shadow-lg overflow-hidden disabled:opacity-50"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </span>
                  <span className="ml-6">Google</span>
                </button>

                <button
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-white/10 text-lg font-bold rounded-xl text-white bg-white/5 hover:bg-white/10 transition-all shadow-lg overflow-hidden disabled:opacity-50"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    <Apple className="h-6 w-6 text-white" />
                  </span>
                  <span className="ml-6">Apple</span>
                </button>
              </motion.div>
            )}

            {loginMethod === 'email' && (
              <motion.div 
                key="email"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailLogin} className="space-y-4">
                  {isSignUp && (
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input 
                        type="email" 
                        required 
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  )}
                  {!isSignUp && (
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input 
                        type="text" 
                        required 
                        placeholder="Email or Username"
                        value={formData.emailOrUsername}
                        onChange={e => setFormData({...formData, emailOrUsername: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input 
                      type="password" 
                      required 
                      placeholder="Password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </button>
                  <p className="text-center text-sm text-gray-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="ml-2 text-violet-400 hover:text-violet-300 font-bold"
                    >
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                  </p>
                </form>
              </motion.div>
            )}

            {loginMethod === 'phone' && (
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {!confirmationResult ? (
                  <form onSubmit={handleSendCode} className="space-y-4">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input 
                        type="tel" 
                        required 
                        placeholder="+1 234 567 8900"
                        value={phoneData.number}
                        onChange={e => setPhoneData({...phoneData, number: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input 
                        type="text" 
                        required 
                        placeholder="Verification Code"
                        value={phoneData.code}
                        onChange={e => setPhoneData({...phoneData, code: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Change Phone Number
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center border-t border-white/10 pt-8 relative z-10">
          <div className="flex flex-col items-center group">
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-violet-500/20 transition-colors">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Secure</span>
          </div>
          <div className="flex flex-col items-center group">
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-fuchsia-500/20 transition-colors">
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Fast</span>
          </div>
          <div className="flex flex-col items-center group">
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Global</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
