import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LandingPage } from '@/pages/LandingPage';
import { FeaturesPage } from '@/pages/FeaturesPage';
import { SecurityPage } from '@/pages/SecurityPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { AuthPage } from '@/pages/AuthPage';
import { WorkspacePage } from '@/pages/WorkspacePage';

type Page = 'landing' | 'features' | 'security' | 'terms' | 'privacy' | 'auth' | 'workspace';

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  // Auto-redirect to workspace if authenticated and on auth page
  useEffect(() => {
    if (isAuthenticated && currentPage === 'auth') {
      setCurrentPage('workspace');
    }
  }, [isAuthenticated, currentPage]);

  // Auto-redirect to landing if logged out while on workspace
  useEffect(() => {
    if (!isAuthenticated && currentPage === 'workspace') {
      setCurrentPage('landing');
    }
  }, [isAuthenticated, currentPage]);

  const navigate = (page: string) => {
    if (page === 'workspace' && !isAuthenticated) {
      setCurrentPage('auth');
      return;
    }
    setCurrentPage(page as Page);
    if (page !== 'workspace') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-foreground text-background flex items-center justify-center font-mono font-bold text-base">
            N
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Workspace has its own full-screen canvas
  if (currentPage === 'workspace' && isAuthenticated) {
    return <WorkspacePage onBack={() => setCurrentPage('landing')} />;
  }

  // Auth has its own dedicated page
  if (currentPage === 'auth') {
    return (
      <AuthPage
        onSuccess={() => setCurrentPage('workspace')}
        onBack={() => setCurrentPage('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-foreground selection:text-background transition-colors duration-200">
      <Navbar onNavigate={navigate} currentPage={currentPage} />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={currentPage} {...pageTransition}>
            {currentPage === 'landing' && (
              <LandingPage
                onGetStarted={() => navigate(isAuthenticated ? 'workspace' : 'auth')}
                onFeatures={() => navigate('features')}
                onNavigate={navigate}
              />
            )}
            {currentPage === 'features' && (
              <FeaturesPage
                onGetStarted={() => navigate(isAuthenticated ? 'workspace' : 'auth')}
                onBack={() => navigate('landing')}
              />
            )}
            {currentPage === 'security' && (
              <SecurityPage
                onBack={() => navigate('landing')}
                onGetStarted={() => navigate(isAuthenticated ? 'workspace' : 'auth')}
              />
            )}
            {currentPage === 'terms' && (
              <TermsPage onBack={() => navigate('landing')} />
            )}
            {currentPage === 'privacy' && (
              <PrivacyPage onBack={() => navigate('landing')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer onNavigate={navigate} />
    </div>
  );
}
