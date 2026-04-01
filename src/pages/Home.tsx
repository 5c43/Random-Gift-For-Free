import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, TrendingUp, ChevronRight, Users, Gamepad2, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white overflow-hidden relative">
      {/* Animated Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
            x: [0, -80, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-xl"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Trusted by 50,000+ gamers worldwide</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-[1.1] tracking-tight"
          >
            Buy & Sell Gaming <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 animate-gradient-x">
              Accounts Safely
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
          >
            The #1 marketplace for gaming accounts, in-game items, and services. 
            Secure transactions, instant delivery, and buyer protection on every trade.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link 
              to="/marketplace" 
              className="group relative px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold rounded-2xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transform hover:-translate-y-1 flex items-center gap-3 text-lg"
            >
              Browse Marketplace
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/verify" 
              className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-2xl border border-white/10 transition-all backdrop-blur-md transform hover:-translate-y-1 text-lg"
            >
              Start Selling
            </Link>
          </motion.div>

          {/* Features Row */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full max-w-5xl"
          >
            <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/5">
              <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-8 w-8 text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Buyer Protection</h3>
              <p className="text-gray-400 font-medium">Every purchase guaranteed</p>
            </div>

            <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Delivery</h3>
              <p className="text-gray-400 font-medium">Get accounts in minutes</p>
            </div>

            <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Best Prices</h3>
              <p className="text-gray-400 font-medium">Competitive marketplace</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-white/5 bg-white/[0.02] backdrop-blur-md py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-4xl font-extrabold text-white mb-2">50K+</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white mb-2">120K+</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Trades Done</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white mb-2">4.9/5</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">User Rating</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white mb-2">24/7</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
