import React, { useState } from 'react';
import { Map as MapIcon, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, safeJson } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const AuthScreen = ({ isLoginView, toggleView, onBack, forcedPortal }: any) => {
  const [formData, setFormData] = useState({ 
    username: '', email: '', password: '', 
    otp: '', fullName: '', address: '', city: '', postalCode: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminPortal, setIsAdminPortal] = useState(forcedPortal === 'admin');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setSendingOtp(true);
    try {
      const res = await fetch('/api/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await safeJson(res);
      if (res.ok && data) {
        setOtpSent(true);
      } else {
        setError(data?.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLoginView ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await safeJson(res);
      if (res.ok && data) {
        localStorage.setItem('civic_token', data.token);
        // If they checked admin portal, verify role
        if (isAdminPortal && data.user.role !== 'admin') {
          localStorage.removeItem('civic_token');
          setError('Access Denied: Not an authorized administrator account.');
          setLoading(false);
          return;
        }
        window.location.reload(); 
      } else {
        setError(data?.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-6 transition-all duration-700 relative", isAdminPortal ? "bg-slate-900" : "bg-slate-50")}>
      {onBack && (
        <button 
          type="button"
          onClick={onBack}
          className={cn("absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all z-50", isAdminPortal ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Home
        </button>
      )}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <motion.div 
            animate={{ rotate: isAdminPortal ? 180 : 0, scale: isAdminPortal ? 1.1 : 1 }}
            className={cn("w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transition-colors duration-500", isAdminPortal ? "bg-red-500" : "bg-civic-primary")}
          >
            <MapIcon size={48} className="text-white" />
          </motion.div>
          <h1 className={cn("text-4xl font-display font-black tracking-tight mb-2 transition-colors", isAdminPortal ? "text-white" : "text-slate-900")}>
            {isAdminPortal ? 'Admin Console' : 'CivicConnect'}
          </h1>
          <p className={cn("text-sm font-medium transition-colors", isAdminPortal ? "text-slate-400" : "text-slate-500")}>
            {isAdminPortal ? 'Unified Authority Management System' : 'Public Infrastructure Reporting Tool'}
          </p>
        </div>

        <Card className={cn("border-none shadow-2xl overflow-hidden relative", isAdminPortal ? "bg-slate-800 text-white" : "bg-white")}>
          {isAdminPortal && <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />}
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={18} /> {error}
              </motion.div>
            )}
            
            <div className="space-y-4">
              {isAdminPortal ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Username</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 transition-all text-sm font-bold bg-slate-900/50 border-slate-700 focus:ring-red-500/10 focus:border-red-500 text-white placeholder:text-slate-600"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter your system username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                    <input 
                      type="password" 
                      required 
                      className="w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 transition-all text-sm font-bold bg-slate-900/50 border-slate-700 focus:ring-red-500/10 focus:border-red-500 text-white"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      disabled={otpSent}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-bold disabled:opacity-50"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                    />
                  </div>

                  {!isLoginView && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                        <input 
                          type="text" 
                          required 
                          disabled={otpSent}
                          className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-bold disabled:opacity-50"
                          value={formData.fullName}
                          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Your Full Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                        <input 
                          type="text" 
                          required 
                          disabled={otpSent}
                          className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-bold disabled:opacity-50"
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Street Address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">City</label>
                          <input 
                            type="text" 
                            required 
                            disabled={otpSent}
                            className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-bold disabled:opacity-50"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Postal Code</label>
                          <input 
                            type="text" 
                            required 
                            disabled={otpSent}
                            className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-bold disabled:opacity-50"
                            value={formData.postalCode}
                            onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                            placeholder="Postal Code"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {otpSent && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Code (OTP)</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-bold tracking-[0.5em] text-center"
                        value={formData.otp}
                        onChange={e => setFormData({ ...formData, otp: e.target.value })}
                        placeholder="123456"
                        maxLength={6}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {isAdminPortal ? (
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full py-5 rounded-[1.5rem] shadow-2xl text-lg font-black uppercase tracking-wider transition-all active:scale-95 bg-red-500 hover:bg-red-600 shadow-red-500/20"
              >
                {loading ? 'Authenticating...' : 'System Login'}
              </Button>
            ) : (
              !otpSent ? (
                <Button 
                  type="button" 
                  onClick={handleSendOtp}
                  disabled={sendingOtp} 
                  className="w-full py-5 rounded-[1.5rem] shadow-2xl text-lg font-black uppercase tracking-wider transition-all active:scale-95 bg-civic-primary hover:bg-blue-600 shadow-civic-primary/20"
                >
                  {sendingOtp ? 'Sending OTP...' : 'Send Verification Code'}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-5 rounded-[1.5rem] shadow-2xl text-lg font-black uppercase tracking-wider transition-all active:scale-95 bg-civic-primary hover:bg-blue-600 shadow-civic-primary/20"
                >
                  {loading ? 'Authenticating...' : (isLoginView ? 'System Login' : 'Register Account')}
                </Button>
              )
            )}
            
            <div className="flex flex-col gap-4 text-center">
              {(!isAdminPortal || !forcedPortal) && (
                <button 
                  type="button" 
                  onClick={toggleView}
                  className="text-xs font-bold text-slate-400 hover:text-civic-primary transition-colors"
                >
                  {isLoginView ? "Don't have a citizen account? Connect now" : 'Already part of CivicConnect? Login'}
                </button>
              )}
              
              <div className={cn("h-px my-2 transition-colors", isAdminPortal ? "bg-slate-700" : "bg-slate-100")} />
              
              {!forcedPortal && (
              <button 
                type="button" 
                onClick={() => {
                  setIsAdminPortal(!isAdminPortal);
                  setError('');
                }}
                className={cn("text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all", isAdminPortal ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-slate-100 text-slate-400 hover:border-slate-200")}
              >
                {isAdminPortal ? 'Switch to Citizen Portal' : 'Administrator Portal Login'}
              </button>
              )}
            </div>
          </form>
        </Card>
        
        <p className={cn("text-center mt-10 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors", isAdminPortal ? "text-slate-600" : "text-slate-300")}>
          Secure Civic Management Protocol v4.2
        </p>
      </motion.div>
    </div>
  );
};

// --- View Components ---
