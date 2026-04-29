
import React, { useState } from 'react';
import { NAV_LINKS, SparkIcon } from '../constants';
import { NavLink } from '../types';

const SparkLogo: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
  <button onClick={() => onNavigate('home')} className="flex items-center space-x-2 focus:outline-none group">
    <SparkIcon className="w-9 h-9 text-spark-red group-hover:scale-110 transition-transform" />
    <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Spark</span>
  </button>
);

const Navbar: React.FC<{ 
  onNavigate: (page: string) => void, 
  user: any, 
  onLogout: () => void,
  isDarkMode: boolean,
  toggleTheme: () => void
}> = ({ onNavigate, user, onLogout, isDarkMode, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
  };

  const dashboardPage = user?.role === 'Admin' ? 'admin-dashboard' :
    user?.role === 'Brand' ? 'brand-dashboard' :
      (user?.role === 'Ambassador/Influencer' || user?.role === 'Student/Professional Influencer') ? 'student-dashboard' :
        (user?.role === 'Student Organization' || user?.role === 'Student/Professional Organization') ? 'org-dashboard' : 'login';

  return (
    <nav className="bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          <div className="flex items-center">
            <button onClick={() => onNavigate('home')} className="flex items-center space-x-2 focus:outline-none group">
              <SparkIcon className="w-7 h-7 md:w-8 md:h-8 text-spark-red group-hover:rotate-12 transition-transform" />
              <span className="text-lg md:text-xl font-fancy font-black text-[var(--text-primary)] tracking-tighter">Spark</span>
            </button>
          </div>

          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {NAV_LINKS.map((link: NavLink) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (link.href.startsWith('#')) {
                      onNavigate('home');
                      setTimeout(() => {
                        const el = document.querySelector(link.href);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      onNavigate(link.href);
                    }
                  }}
                  className="text-[var(--text-secondary)] hover:text-spark-red px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-spark-red/5"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-spark-red/5 text-spark-red hover:bg-spark-red/10 transition-all"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <button
                  onClick={() => onNavigate(dashboardPage)}
                  className="text-[var(--text-primary)] hover:text-spark-red font-black text-xs uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-spark-red/10 rounded-lg flex items-center justify-center text-spark-red text-xs">
                    {user?.name ? user.name.charAt(0) : '?'}
                  </div>
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="glass text-[var(--text-primary)] font-bold py-3 px-6 rounded-2xl transition-all active:scale-95 text-xs border border-[var(--border-color)]"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-[var(--text-secondary)] hover:text-spark-red font-bold text-xs uppercase tracking-widest px-4 py-2 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('create-account')}
                  className="bg-spark-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-spark-red/20 active:scale-95 text-xs"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          <div className="-mr-2 flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-[var(--text-secondary)] hover:text-spark-red hover:bg-red-50 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[var(--bg-primary)] border-b border-[var(--border-color)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-2 pb-10 space-y-2">
            <div className="flex items-center justify-between px-4 py-4 mb-4 border-b border-[var(--border-color)]">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Menu</span>
              <button
                onClick={toggleTheme}
                className="p-3 rounded-2xl bg-spark-red/5 text-spark-red"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
            {NAV_LINKS.map((link: NavLink) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  onNavigate(link.href);
                }}
                className="text-[var(--text-secondary)] hover:text-spark-red block px-4 py-4 rounded-2xl text-base font-bold hover:bg-spark-red/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-6 border-t border-[var(--border-color)] flex flex-col space-y-4">
              {user ? (
                <>
                  <button onClick={() => { onNavigate(dashboardPage); setIsOpen(false); }} className="w-full text-center bg-spark-red text-white font-black py-5 rounded-2xl shadow-lg shadow-spark-red/20">
                    Dashboard
                  </button>
                  <button onClick={handleLogout} className="w-full text-center bg-[var(--text-primary)] text-[var(--bg-primary)] font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-spark-red hover:text-white transition-all shadow-lg shadow-black/5">
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="w-full text-center bg-[var(--text-primary)] text-[var(--bg-primary)] font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-spark-red hover:text-white transition-all shadow-lg shadow-black/5">
                    Login
                  </button>
                  <button onClick={() => { onNavigate('create-account'); setIsOpen(false); }} className="w-full text-center bg-spark-red text-white font-black py-5 rounded-2xl shadow-lg shadow-spark-red/20">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
