import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Zap, MessageSquare } from 'lucide-react';

export function Status() {
  const services = [
    { id: 1, name: "Fortnite Accounts Delivery", status: "Operational", icon: Zap, color: "emerald" },
    { id: 2, name: "V-Bucks Mystery Boxes", status: "Operational", icon: Zap, color: "emerald" },
    { id: 3, name: "Payment Processing (Ziina)", status: "Operational", icon: ShieldCheck, color: "emerald" },
    { id: 4, name: "Live Support Chat", status: "Operational", icon: MessageSquare, color: "emerald" },
    { id: 5, name: "Account Verification System", status: "Operational", icon: ShieldCheck, color: "emerald" },
    { id: 6, name: "Discord Bot Integration", status: "Maintenance", icon: Clock, color: "amber" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold mb-4"
        >
          System Status
        </motion.h1>
        <p className="text-gray-400 text-lg">Real-time monitoring of GameVault services</p>
        
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-8 shadow-xl">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">All Core Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service, i) => (
          <motion.div 
            key={service.id}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className={`h-14 w-14 rounded-2xl bg-${service.color}-500/10 flex items-center justify-center`}>
                <service.icon className={`h-8 w-8 text-${service.color}-400`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{service.name}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Last checked: 2 minutes ago</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-${service.color}-500/10 border border-${service.color}-500/20`}>
              {service.status === 'Operational' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Clock className="h-4 w-4 text-amber-400" />
              )}
              <span className={`text-xs font-bold text-${service.color}-400 uppercase tracking-widest`}>{service.status}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 max-w-3xl mx-auto">
        <div className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/5">
            <h3 className="text-2xl font-extrabold text-white mb-2">Incident History</h3>
            <p className="text-gray-400 text-sm">Recent system events and maintenance logs</p>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex gap-6">
              <div className="h-px w-12 bg-white/10 mt-3"></div>
              <div>
                <h4 className="font-bold text-white mb-2">Scheduled Maintenance - Discord Bot</h4>
                <p className="text-gray-400 text-sm leading-relaxed">We are currently updating our Discord bot to support new account verification features. This will not affect account delivery or payments.</p>
                <p className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-widest">April 4, 2026 - 18:00 UTC</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="h-px w-12 bg-white/10 mt-3"></div>
              <div>
                <h4 className="font-bold text-white mb-2">Resolved: Ziina Payment Delay</h4>
                <p className="text-gray-400 text-sm leading-relaxed">Some users experienced a slight delay in payment confirmation. The issue has been resolved and all pending transactions have been processed.</p>
                <p className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-widest">April 3, 2026 - 14:22 UTC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
