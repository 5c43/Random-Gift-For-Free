import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Scale, FileText, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function TermsOfService() {
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
            <Scale className="h-4 w-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Legal Agreement</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto font-medium"
          >
            Last updated: April 5, 2026. Please read these terms carefully before using our marketplace.
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
                <FileText className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-white">1. Acceptance of Terms</h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg">
              By accessing or using GameVault, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#161616] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white">2. Marketplace Rules</h2>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <p className="text-gray-400 font-medium">Users must be at least 18 years old or have parental consent.</p>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <p className="text-gray-400 font-medium">Sellers must provide accurate descriptions and screenshots of their listings.</p>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <p className="text-gray-400 font-medium">Fraudulent activity, including chargebacks or account recovery after sale, will result in permanent bans.</p>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <p className="text-gray-400 font-medium">GameVault charges a 5% fee on all successful transactions to maintain the platform and escrow service.</p>
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
              <h2 className="text-2xl font-black text-white">3. Escrow & Payments</h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg mb-6">
              GameVault operates an escrow system to protect both buyers and sellers. When a buyer pays, the funds are held by GameVault until the buyer confirms receipt of the account or item.
            </p>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex gap-4">
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 italic font-bold">
                Once a buyer confirms receipt, the funds are released to the seller and the transaction is considered final. No refunds will be issued after this point.
              </p>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#161616] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-white">4. Prohibited Items</h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg">
              Users are prohibited from listing stolen accounts, illegal software, or any items that violate the terms of service of the respective game developers. GameVault reserves the right to remove any listing at its sole discretion.
            </p>
          </motion.section>
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm font-bold">
            If you have any questions about these terms, please contact our <a href="https://discord.gg/0-n" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">Support Team on Discord</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
