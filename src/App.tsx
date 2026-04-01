import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { CreateListing } from './pages/CreateListing';
import { Offer } from './pages/Offer';
import { SellerProfile } from './pages/SellerProfile';
import { SellerVerification } from './pages/SellerVerification';
import { Chat } from './pages/Chat';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Checkout } from './pages/Checkout';
import { UsernameSetup } from './pages/UsernameSetup';
import { PaymentWaiting } from './pages/PaymentWaiting';
import { Notifications } from './pages/Notifications';
import { useLocation, Navigate } from 'react-router-dom';
import { Bell, Gamepad2, MessageSquare, User, LogOut, Menu, ShieldCheck, LayoutDashboard, PlusCircle, Zap } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { motion } from 'motion/react';

function ProfileCheck({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (user && !userData?.username && location.pathname !== '/setup-username' && location.pathname !== '/login') {
    return <Navigate to="/setup-username" replace />;
  }

  return <>{children}</>;
}
import { CustomCursor } from './pages/components/CustomCursor';
import { ErrorBoundary } from './pages/components/ErrorBoundary';

function Navbar() {
  const { user, userData, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setProfileMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setProfileMenuOpen(false);
    }, 300);
  };

  return (
    <nav className="bg-black/40 backdrop-blur-xl text-white border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">GameVault</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/marketplace" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Marketplace</Link>
            {user ? (
              <>
                <Link to="/notifications" className="relative p-2 text-gray-300 hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/chat" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Messages
                </Link>
                <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                {(userData?.role === 'admin' || user.uid === 'ywskXjtxYJVD5xSU5wSNcpaWnXZ2') && (
                  <Link to="/admin" className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors">Admin</Link>
                )}
                {!userData?.isVerifiedSeller && (
                  <Link to="/verify" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Get Verified
                  </Link>
                )}
                {userData?.isVerifiedSeller && (
                  <Link to="/create-listing" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" /> List Item
                  </Link>
                )}
                <div 
                  className="relative ml-2"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="flex items-center gap-2 focus:outline-none py-2">
                    <img src={userData?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="h-9 w-9 rounded-full border-2 border-white/20 object-cover" />
                  </button>
                  {profileMenuOpen && (
                    <div 
                      className="absolute right-0 top-full w-56 pt-1 z-50"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#111] rounded-2xl shadow-2xl py-2 border border-white/10 backdrop-blur-xl overflow-hidden"
                      >
                        <div className="px-5 py-3 border-b border-white/5 mb-1 bg-white/5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Signed in as</p>
                          <p className="text-sm font-bold text-white truncate">{userData?.username || user.email?.split('@')[0]}</p>
                        </div>
                        <Link 
                          to={`/seller/${user.uid}`} 
                          className="flex items-center gap-3 px-5 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <User className="h-4 w-4 text-violet-400" />
                          Public Profile
                        </Link>
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-3 px-5 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 text-violet-400" />
                          Dashboard
                        </Link>
                        <button 
                          onClick={() => {
                            logout();
                            setProfileMenuOpen(false);
                          }} 
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5 mt-1"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-violet-500/20">
                Log In / Sign Up
              </Link>
            )}
          </div>
          <div className="flex items-center md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-300 hover:text-white p-2">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/10">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <Link to="/marketplace" className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Marketplace</Link>
            {user ? (
              <>
                <Link to="/notifications" className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Bell className="h-5 w-5" /> Notifications</Link>
                <Link to="/chat" className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><MessageSquare className="h-5 w-5" /> Messages</Link>
                <Link to="/dashboard" className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><LayoutDashboard className="h-5 w-5" /> Dashboard</Link>
                {userData?.role === 'admin' && (
                  <Link to="/admin" className="block px-3 py-3 text-base font-bold text-violet-400 hover:bg-white/5 rounded-xl transition-colors">Admin</Link>
                )}
                {!userData?.isVerifiedSeller ? (
                  <Link to="/verify" className="block px-3 py-3 text-base font-medium text-emerald-400 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Get Verified</Link>
                ) : (
                  <Link to="/create-listing" className="block px-3 py-3 text-base font-medium text-emerald-400 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><PlusCircle className="h-5 w-5" /> List Item</Link>
                )}
                <Link to={`/seller/${user.uid}`} className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Public Profile</Link>
                <button onClick={logout} className="block w-full text-left px-3 py-3 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">Sign out</button>
              </>
            ) : (
              <Link to="/login" className="block px-3 py-3 text-base font-bold text-white bg-white/10 rounded-xl text-center mt-4">Log In / Sign Up</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <CustomCursor />
          <div className="animated-bg" />
          <div className="min-h-screen text-gray-100 font-sans flex flex-col relative z-10">
            <Navbar />
            <main className="flex-grow">
              <ProfileCheck>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/offer/:id" element={<Offer />} />
                  <Route path="/seller/:id" element={<SellerProfile />} />
                  <Route path="/verify" element={<SellerVerification />} />
                  <Route path="/create-listing" element={<CreateListing />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:chatId" element={<Chat />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/checkout/:id" element={<Checkout />} />
                  <Route path="/setup-username" element={<UsernameSetup />} />
                  <Route path="/payment-waiting/:purchaseId" element={<PaymentWaiting />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Routes>
              </ProfileCheck>
            </main>
            <footer className="bg-black/60 backdrop-blur-xl border-t border-white/10 pt-16 pb-8 mt-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                  <div className="col-span-1 md:col-span-1">
                    <Link to="/" className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-display font-extrabold text-xl text-white">GameVault</span>
                    </Link>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      The most trusted marketplace for gaming accounts, items, and services. Buy and sell with confidence.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Marketplace</h3>
                    <ul className="space-y-4 text-sm text-gray-400">
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">Accounts</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">In-Game Items</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">Currency</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">Boosting</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">Coaching</Link></li>
                    </ul>
                  </div>
  
                  <div>
                    <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Popular Games</h3>
                    <ul className="space-y-4 text-sm text-gray-400">
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">Fortnite</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">Valorant</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">CS2</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">League of Legends</Link></li>
                      <li><Link to="/" className="hover:text-violet-400 transition-colors">Genshin Impact</Link></li>
                    </ul>
                  </div>
  
                  <div>
                    <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Why Us</h3>
                    <ul className="space-y-4 text-sm text-gray-400">
                      <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Buyer Protection</li>
                      <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-400" /> Instant Delivery</li>
                      <li className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-400" /> 24/7 Support</li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-gray-500 text-sm">
                    &copy; 2026 GameVault. All rights reserved.
                  </p>
                  <div className="flex gap-6 text-sm text-gray-500">
                    <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="/" className="hover:text-white transition-colors">Contact</Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
