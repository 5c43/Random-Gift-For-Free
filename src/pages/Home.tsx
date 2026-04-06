import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, TrendingUp, ChevronRight, Users, Gamepad2, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  return (
    <div className="min-h-screen text-white overflow-hidden relative">
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
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-red-600/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
            x: [0, -80, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-12 min-h-[70vh]">
          <div className="flex-1 text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-xl"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Trusted by 50,000+ gamers</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-extrabold mb-8 leading-[1.1] tracking-tight"
            >
              Best Fortnite <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 animate-gradient-x">
                Accounts, <br />Skins & V-Bucks.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed font-medium"
            >
              Get premium Fortnite accounts, rare skins, and V-Bucks bundles—secure, fast, and always reliable. 
              Your vault for the rarest gaming assets.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 items-start"
            >
              <Link 
                to="/marketplace" 
                className="group relative px-10 py-5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transform hover:-translate-y-1 flex items-center gap-3 text-lg"
              >
                Explore Products
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="flex-1 relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative z-10"
            >
              <img 
                src="https://images.unsplash.com/photo-1589241062272-c0a000072dfa?q=80&w=2070&auto=format&fit=crop" 
                alt="Gaming" 
                className="rounded-[2rem] shadow-2xl border border-white/10 rotate-3 hover:rotate-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -inset-4 bg-gradient-to-br from-red-500/20 to-red-700/20 blur-2xl -z-10 rounded-[2rem]"></div>
            </motion.div>
          </div>
        </div>

        {/* Features Row */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-32"
        >
          <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-red-500/30">
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <ShieldCheck className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Full Access Accounts</h3>
            <p className="text-gray-400 font-medium text-sm">Instant login with email access and full ownership.</p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-red-500/30">
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Delivery</h3>
            <p className="text-gray-400 font-medium text-sm">Accounts and boxes delivered immediately after purchase.</p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-red-500/30">
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <Gamepad2 className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Rare Skins Included</h3>
            <p className="text-gray-400 font-medium text-sm">Chance to receive OG and vaulted Fortnite skins.</p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-red-500/30">
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <Star className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">V-Bucks Mystery Boxes</h3>
            <p className="text-gray-400 font-medium text-sm">Open boxes for random V-Bucks rewards and bonuses.</p>
          </div>
        </motion.div>

        {/* Discord Section */}
        <div className="mt-40 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest mb-6 border border-red-500/20">Join our community</span>
            <h2 className="text-5xl font-extrabold mb-8">Connect with Fellow Users on Discord</h2>
            <ul className="space-y-6 mb-10">
              <li className="flex items-start gap-4">
                <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center mt-1">
                  <ShieldCheck className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white">24/7 Live Support</h4>
                  <p className="text-gray-400 text-sm">Get help from our support team and community experts anytime</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center mt-1">
                  <Zap className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Latest Fortnite News</h4>
                  <p className="text-gray-400 text-sm">Keep up with the latest Fortnite news and updates from our community</p>
                </div>
              </li>
            </ul>
            <a 
              href="https://discord.gg/0-n" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl transition-all transform hover:-translate-y-1 shadow-xl shadow-red-500/20"
            >
              Join Our Discord
              <Users className="h-5 w-5" />
            </a>
          </div>
          <div className="flex-1 w-full max-w-xl">
            <div className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-red-600 rounded-xl flex items-center justify-center font-bold text-xl">G</div>
                  <div>
                    <h3 className="font-bold">GameVault</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Online</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-800 flex-shrink-0"></div>
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                    <p className="text-sm text-gray-300">Just bought a Renegade Raider account! Smooth transaction, instant delivery. +rep GameVault! 🔥</p>
                    <p className="text-[10px] text-gray-500 mt-2 font-bold">Yesterday at 3:11 PM</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-800 flex-shrink-0"></div>
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                    <p className="text-sm text-gray-300">Wanna slide me that galaxy account? 👀</p>
                    <p className="text-[10px] text-gray-500 mt-2 font-bold">Yesterday at 4:23 PM</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-800 flex-shrink-0"></div>
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                    <p className="text-sm text-gray-300">Highly recommend, very trustworthy shop. Best prices in the market.</p>
                    <p className="text-[10px] text-gray-500 mt-2 font-bold">Today at 12:33 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-40 max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-4">FAQ</h2>
            <p className="text-gray-400 font-medium">Get the information you need without the wait</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "What is GameVault about?", a: "We provide you with exclusive & OG Fortnite accounts for a fraction of their cost. All accounts are secure and come with full access." },
              { q: "Are we legit? How can you ensure that?", a: "We have over 50,000 satisfied customers and a 4.9/5 rating. Our transactions are secured with industry-standard encryption and buyer protection." },
              { q: "Can I link my console account on this?", a: "We do not guarantee console links since these accounts are random. However, many of our accounts are linkable—it's a gamble, but a rewarding one!" },
              { q: "Could I lose the account I purchase?", a: "No. All accounts are fully secured and ownership is transferred to you immediately. We provide a lifetime warranty on all premium accounts." }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors">
                  <span className="font-bold text-lg">{item.q}</span>
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </button>
                <div className="px-8 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-40">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-4">What Our Customers Say</h2>
            <p className="text-gray-400 font-medium">Join 50,000+ happy gamers worldwide</p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <span className="text-xl font-bold">4.9/5</span>
              <span className="text-gray-500 text-sm">(50,000+ Reviews)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { user: "AlexGamer", comment: "Instant delivery and the account was exactly as described. Best shop for Fortnite accounts!", rating: 5 },
              { user: "Slayer99", comment: "Got a Renegade Raider account for a steal. 100% legit.", rating: 5 },
              { user: "OG_Collector", comment: "Finally found a reliable place for rare skins. GameVault is the goat.", rating: 5 },
              { user: "FortniteFan", comment: "Great service, had a small issue with login but support fixed it in 5 minutes.", rating: 5 },
              { user: "VBucksMaster", comment: "Bought a mystery box and got 5000 V-Bucks! Insane value.", rating: 5 },
              { user: "Xenon_Gamer", comment: "The best experience I've ever had buying an account. Fast and secure.", rating: 5 }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-600/20 flex items-center justify-center font-bold text-red-400">
                      {review.user.charAt(0)}
                    </div>
                    <h4 className="font-bold text-white">{review.user}</h4>
                  </div>
                  <div className="flex text-yellow-500">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed italic">"{review.comment}"</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/reviews" className="inline-flex items-center gap-2 text-red-500 font-bold hover:text-red-400 transition-colors">
              View all 50,000+ reviews
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
