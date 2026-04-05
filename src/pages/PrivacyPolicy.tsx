import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Eye, Database, Lock, UserCheck, Info } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6"
          >
            <ShieldCheck className="h-4 w-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Privacy Protection</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto font-medium"
          >
            Last updated: April 5, 2026. Your privacy is our top priority at GameVault.
          </motion.p>
        </div>

        <div className="space-y-12">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#161616] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-white">1. Information We Collect</h2>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                <p className="text-gray-400 leading-relaxed">
                  <span className="text-white font-bold">Account Information:</span> When you register, we collect your email address, username, and profile picture.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                <p className="text-gray-400 leading-relaxed">
                  <span className="text-white font-bold">Transaction Data:</span> We collect details about your purchases and sales to facilitate the escrow process.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                <p className="text-gray-400 leading-relaxed">
                  <span className="text-white font-bold">Communication:</span> We may store transaction-related metadata to resolve disputes and ensure safety.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#161616] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white">2. How We Use Your Data</h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg mb-8">
              We use your information to provide, maintain, and improve our services, including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <UserCheck className="h-6 w-6 text-emerald-400 mb-4" />
                <h4 className="text-white font-bold mb-2">Verification</h4>
                <p className="text-sm text-gray-500">Verifying seller identities to prevent fraud.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <Eye className="h-6 w-6 text-emerald-400 mb-4" />
                <h4 className="text-white font-bold mb-2">Monitoring</h4>
                <p className="text-sm text-gray-500">Monitoring for suspicious activity and policy violations.</p>
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#161616] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Info className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-white">3. Data Sharing</h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg">
              We do not sell your personal data to third parties. We only share information when necessary to complete a transaction (e.g., with payment processors like Ziina) or when required by law.
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#161616] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-white">4. Your Rights</h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg">
              You have the right to access, correct, or delete your personal information at any time. You can manage your profile settings in the dashboard or contact our support team on Discord for data deletion requests.
            </p>
          </motion.section>
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm font-bold">
            Questions about your privacy? Join our <a href="https://discord.gg/0-n" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">Discord Server</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
