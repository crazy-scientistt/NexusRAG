import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { ParticleField } from '@/components/shared/ParticleField';
import { LandingPage } from '@/pages/LandingPage';
import { FeaturesPage } from '@/pages/FeaturesPage';
import { AuthPage } from '@/pages/AuthPage';
import { WorkspacePage } from '@/pages/WorkspacePage';

type Page = 'landing' | 'features' | 'auth' | 'workspace';

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
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
      <div className="h-screen flex items-center justify-center bg-[#030014]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </motion.div>
      </div>
    );
  }

  // Workspace is a full-screen layout without navbar
  if (currentPage === 'workspace' && isAuthenticated) {
    return <WorkspacePage onBack={() => setCurrentPage('landing')} />;
  }

  return (
    <div className="relative min-h-screen bg-[#030014]">
      <ParticleField />
      <Navbar onNavigate={navigate} currentPage={currentPage} />

      <AnimatePresence mode="wait">
        <motion.div key={currentPage} {...pageTransition}>
          {currentPage === 'landing' && (
            <LandingPage
              onGetStarted={() => navigate(isAuthenticated ? 'workspace' : 'auth')}
              onFeatures={() => navigate('features')}
            />
          )}
          {currentPage === 'features' && (
            <FeaturesPage onGetStarted={() => navigate(isAuthenticated ? 'workspace' : 'auth')} />
          )}
          {currentPage === 'auth' && (
            <AuthPage
              onSuccess={() => setCurrentPage('workspace')}
              onBack={() => setCurrentPage('landing')}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
