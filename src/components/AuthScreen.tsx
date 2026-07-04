import React, { useState } from 'react';
import { Wallet2, LogIn, UserPlus, Loader2, Settings2 } from 'lucide-react';
import { setWebAppUrl } from '../lib/sheets';

interface Props {
  webAppUrl: string;
  onUrlChange: (url: string) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string) => Promise<void>;
}

const inputCls =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-teal placeholder:text-faint';

export default function AuthScreen({ webAppUrl, onUrlChange, onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showUrlConfig, setShowUrlConfig] = useState(!webAppUrl);
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const saveUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('https://script.google.com')) {
      setErr('Paste a valid Apps Script Web App URL');
      return;
    }
    setWebAppUrl(trimmed);
    onUrlChange(trimmed);
    setShowUrlConfig(false);
    setErr('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (!webAppUrl) {
      setErr('Connect to your Apps Script backend first');
      setShowUrlConfig(true);
      return;
    }
    if (!email || !password) {
      setErr('Email and password are required');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setErr('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') await onSignup(email, password);
      else await onLogin(email, password);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-[440px] w-full">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-teal-dim border border-teal flex items-center justify-center text-teal">
            <Wallet2 size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-tight">Payment Manager</h1>
            <span className="text-[12px] text-muted">Multi-user · Google Sheets backend</span>
          </div>
        </div>

        {showUrlConfig ? (
          <div className="flex flex-col gap-3.5">
            <div className="bg-surface border border-border rounded-lg p-3.5 text-[12px] text-muted leading-relaxed">
              First, connect to your Apps Script backend (the admin deploys this once — see README).
              Paste the Web App URL below.
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-muted mb-1.5">Apps Script Web App URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`${inputCls} font-mono`}
              />
            </div>
            {err && <p className="text-[12px] text-rose">{err}</p>}
            <button
              onClick={saveUrl}
              className="w-full py-2.5 bg-teal text-bg rounded-lg font-bold text-[14px] hover:opacity-90 transition-opacity"
            >
              Save & Continue
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 mb-5">
              <button
                onClick={() => { setMode('login'); setErr(''); }}
                className={`flex-1 py-2 rounded-md text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'login' ? 'bg-teal text-bg' : 'text-muted hover:text-slate-100'
                }`}
              >
                <LogIn size={14} /> Log In
              </button>
              <button
                onClick={() => { setMode('signup'); setErr(''); }}
                className={`flex-1 py-2 rounded-md text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'signup' ? 'bg-teal text-bg' : 'text-muted hover:text-slate-100'
                }`}
              >
                <UserPlus size={14} /> Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11.5px] font-medium text-muted mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-muted mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className={inputCls}
                />
              </div>
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11.5px] font-medium text-muted mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="text-[11.5px] text-teal bg-teal-dim rounded-md px-2.5 py-2 leading-relaxed">
                  Signing up automatically creates your own private Google Spreadsheet for your payment records.
                </div>
              )}

              {err && <p className="text-[12px] text-rose">{err}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal text-bg rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : mode === 'signup' ? (
                  <UserPlus size={16} />
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Log In'}
              </button>
            </form>

            <button
              onClick={() => setShowUrlConfig(true)}
              className="w-full mt-4 text-[11px] text-faint hover:text-muted flex items-center justify-center gap-1.5 transition-colors"
            >
              <Settings2 size={12} /> Backend settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
