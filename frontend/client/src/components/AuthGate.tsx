/**
 * AuthGate Component
 * Displays login/signup form when user is not authenticated
 * Minimal, clean design inspired by ChatGPT
 */

import { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FC } from 'react';

interface AuthGateProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onSignup: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const AuthGate: FC<AuthGateProps> = ({
  onLogin,
  onGoogleLogin,
  onSignup,
  onResetPassword,
  isLoading,
  error,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else if (mode === 'signup') {
        await onSignup(email, password);
      } else {
        await onResetPassword(email);
        setLocalError(null);
        setMode('login');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Cloud RAG
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {mode === 'login'
              ? 'Sign in to your account'
              : mode === 'signup'
              ? 'Create a new account'
              : 'Reset your password'}
          </p>
      </div>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onGoogleLogin}
            className="w-full h-11 font-semibold border-slate-300 dark:border-slate-700"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span>or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-11"
            />
          </div>

          {/* Password Input */}
          {mode !== 'reset' && (
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-10 h-11"
              />
            </div>
          )}

          {/* Error Message */}
          {(error || localError) && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || localError}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !email || (mode !== 'reset' && !password)}
            className="w-full h-11 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'login'
                  ? 'Signing in...'
                  : mode === 'signup'
                  ? 'Creating account...'
                  : 'Sending reset link...'}
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </Button>

          {/* Mode Toggle */}
          <div className="text-center text-sm">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setLocalError(null);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create an account
                </button>
                <span className="text-slate-400 mx-2">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setLocalError(null);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLocalError(null);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Already have an account? Sign in
              </button>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLocalError(null);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3L17.9 19c1.6-1.5 2.6-3.7 2.6-6.3 0-.6-.1-1.2-.2-1.8H12z"
    />
    <path
      fill="#34A853"
      d="M6.6 14.3c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L4.3 8.2A7.77 7.77 0 0 0 3 12.3c0 1.2.3 2.3.7 3.3z"
    />
    <path
      fill="#4A90E2"
      d="M12 4.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.6 1.9 14.4 1 12 1 7.9 1 4.3 3.4 2.7 6.9l2.3 2.1c.6-1.9 2.3-4.2 7-4.2"
    />
    <path
      fill="#FBBC05"
      d="M12 23c2.4 0 4.6-.8 6.1-2.2l-2.7-2.2c-.7.5-1.7.8-3.4.8-2.6 0-4.9-1.8-5.7-4.3l-2.3 2c1.5 3.6 4.9 5.9 8 5.9"
    />
  </svg>
);
