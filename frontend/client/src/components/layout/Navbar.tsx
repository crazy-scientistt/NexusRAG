import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, ArrowUpRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { mode, setMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Overview', page: 'landing' },
    { label: 'Architecture', page: 'features' },
    { label: 'Security', page: 'security' },
    { label: 'Studio', page: 'workspace' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/85 backdrop-blur-xl border-b border-border shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <motion.button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-mono font-bold text-sm tracking-tight transition-transform group-hover:scale-105">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-display text-base font-bold tracking-tight text-foreground">
                  NexusRAG
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                  Document Intelligence
                </span>
              </div>
            </motion.button>

            {/* Desktop Editorial Navigation */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-full border border-border bg-secondary/60 backdrop-blur-md">
              {navItems.map((item) => {
                const isActive = currentPage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                      isActive
                        ? 'text-background bg-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Action Section */}
            <div className="hidden md:flex items-center gap-4">
              {/* Header Theme Mode Segmented Button (Light / System / Dark) */}
              <div
                className="flex items-center p-1 rounded-full border border-border bg-secondary/60 backdrop-blur-md"
                role="group"
                aria-label="Theme Mode Selection"
              >
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  title="Light Mode"
                  className={`p-1.5 rounded-full transition-colors ${
                    mode === 'light'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMode('system')}
                  title="System Theme"
                  className={`p-1.5 rounded-full transition-colors ${
                    mode === 'system'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  title="Dark Mode"
                  className={`p-1.5 rounded-full transition-colors ${
                    mode === 'dark'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onNavigate('workspace')}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background font-semibold text-xs tracking-wide hover:opacity-90 transition-opacity"
              >
                <span>Launch Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Mobile theme toggle */}
              <div className="flex items-center p-0.5 rounded-full border border-border bg-secondary">
                <button
                  onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 text-foreground"
                  title="Toggle Theme"
                >
                  {mode === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-md border border-border text-foreground hover:bg-secondary transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-border bg-background px-4 py-6 space-y-4"
            >
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => {
                      onNavigate(item.page);
                      setMobileOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === item.page
                        ? 'bg-secondary text-foreground font-semibold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Theme Preference</span>
                  <div className="flex items-center gap-1 p-1 rounded-md border border-border">
                    <button
                      onClick={() => setMode('light')}
                      className={`px-2 py-1 rounded text-xs ${mode === 'light' ? 'bg-foreground text-background' : ''}`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setMode('system')}
                      className={`px-2 py-1 rounded text-xs ${mode === 'system' ? 'bg-foreground text-background' : ''}`}
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => setMode('dark')}
                      className={`px-2 py-1 rounded text-xs ${mode === 'dark' ? 'bg-foreground text-background' : ''}`}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigate('workspace');
                    setMobileOpen(false);
                  }}
                  className="w-full py-2.5 rounded-md bg-foreground text-background text-xs font-semibold text-center"
                >
                  Launch Studio
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
