import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function AuthPage({ onSuccess, onBack }: AuthPageProps) {
  const { login, signup, loginWithGoogle, resetPassword, loginAsGuest, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleGuestAccess = () => {
    loginAsGuest();
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (mode === 'reset') {
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch {
        // error in context
      }
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      onSuccess();
    } catch {
      // error handled by context
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 noise-grid pointer-events-none opacity-40" />

      <div className="max-w-md w-full mx-auto relative z-10 space-y-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Overview
        </button>

        {/* Title */}
        <div className="text-left space-y-2">
          <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-mono font-bold text-sm mb-4">
            N
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {mode === 'login' && 'Enter Studio Canvas'}
            {mode === 'signup' && 'Create Workspace'}
            {mode === 'reset' && 'Reset Access Key'}
          </h1>
          <p className="text-xs text-muted-foreground">
            Access your isolated document partitions and frontier model fleet.
          </p>
        </div>

        {/* Guest Access Card (Fast One-Click Bypass) */}
        <div className="p-5 rounded-lg border border-border bg-card space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase font-mono tracking-wider">
              Developer & Guest Access
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
              NO SIGNUP NEEDED
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter immediately with a local guest partition to upload documents and run frontier model queries without an external auth account.
          </p>
          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full py-2.5 rounded-md bg-foreground text-background font-semibold text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span>Enter Studio as Guest</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-[11px] font-mono uppercase text-muted-foreground">
            OR FIREBASE ACCOUNT
          </span>
          <div className="border-t border-border w-full" />
        </div>

        {/* Errors */}
        {(error || localError) && (
          <div className="p-3.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error || localError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="analyst@domain.com"
              className="w-full px-3.5 py-2.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full px-3.5 py-2.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full px-3.5 py-2.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs font-mono uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="text-center text-xs text-muted-foreground">
          {mode === 'login' ? (
            <p>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-semibold text-foreground underline underline-offset-4"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-foreground underline underline-offset-4"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
