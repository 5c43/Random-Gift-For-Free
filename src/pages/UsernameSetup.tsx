import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function UsernameSetup() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData?.username) {
      navigate('/');
    }
  }, [userData, navigate]);

  const checkUsername = async (val: string) => {
    if (val.length < 3) {
      setIsAvailable(null);
      return;
    }
    setChecking(true);
    try {
      const docRef = doc(db, 'usernames', val.toLowerCase());
      const docSnap = await getDoc(docRef);
      setIsAvailable(!docSnap.exists());
    } catch (err) {
      console.error("Error checking username:", err);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(val);
    checkUsername(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || !user) return;

    setLoading(true);
    setError('');
    try {
      const batch = writeBatch(db);
      
      // 1. Create username registry entry
      const usernameRef = doc(db, 'usernames', username);
      batch.set(usernameRef, { 
        uid: user.uid,
        email: user.email 
      });

      // 2. Create user profile
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        uid: user.uid,
        email: user.email,
        username: username,
        displayName: user.displayName || username,
        photoURL: user.photoURL || '',
        role: 'user',
        isVerifiedSeller: false,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      // AuthContext will pick up the new userData automatically
      navigate('/');
    } catch (err: any) {
      console.error("Error setting up username:", err);
      setError(err.message || 'Failed to set up username.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
        
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 bg-violet-600/20 rounded-2xl flex items-center justify-center mb-6">
            <User className="h-8 w-8 text-violet-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Choose your username</h2>
          <p className="text-gray-400">This is how other users will see you on GameVault.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Username</label>
            <div className="relative">
              <input
                required
                type="text"
                value={username}
                onChange={handleUsernameChange}
                maxLength={20}
                placeholder="gaming_pro_99"
                className={`w-full bg-black/20 border ${
                  isAvailable === true ? 'border-emerald-500/50' : 
                  isAvailable === false ? 'border-red-500/50' : 'border-white/10'
                } rounded-xl px-5 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {checking ? (
                  <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                ) : isAvailable === true ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : isAvailable === false ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : null}
              </div>
            </div>
            {isAvailable === false && (
              <p className="text-xs text-red-400 mt-2 ml-1 font-medium">This username is already taken.</p>
            )}
            {username.length > 0 && username.length < 3 && (
              <p className="text-xs text-gray-500 mt-2 ml-1 font-medium">Username must be at least 3 characters.</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isAvailable || loading || checking}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
          >
            {loading ? 'Setting up...' : 'Complete Profile'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          Username can only contain letters, numbers, and underscores.
        </p>
      </motion.div>
    </div>
  );
}
