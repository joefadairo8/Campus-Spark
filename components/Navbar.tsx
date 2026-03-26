
import React, { useState } from 'react';
import { NAV_LINKS, SparkIcon } from '../constants';
import { NavLink } from '../types';

const SparkLogo: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
  <button onClick={() => onNavigate('home')} className="flex items-center space-x-2 focus:outline-none group">
    <SparkIcon className="w-9 h-9 text-spark-red group-hover:scale-110 transition-transform" />
    <span className="text-2xl font-black text-spark-black tracking-tighter">Spark</span>
  </button>
);

const Navbar: React.FC<{ onNavigate: (page: string) => void, user: any, onLogout: () => void }> = ({ onNavigate, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
  };

  const dashboardPage = user?.role === 'Admin' ? 'admin-dashboard' :
    user?.role === 'Brand' ? 'brand-dashboard' :
      user?.role === 'Ambassador' ? 'student-dashboard' :
        user?.role === 'Student Organization' ? 'org-dashboard' : 'login';

  return (
    <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <SparkLogo onNavigate={onNavigate} />
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
                  className="text-spark-gray hover:text-spark-red px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-red-50"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate(dashboardPage)}
                  className="text-spark-black hover:text-spark-red font-black text-sm uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-spark-red text-xs">
                    {user?.name ? user.name.charAt(0) : '?'}
                  </div>
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-50 hover:bg-gray-100 text-spark-gray font-black py-3 px-6 rounded-2xl transition-all active:scale-95 text-sm"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-spark-gray hover:text-spark-red font-black text-sm uppercase tracking-widest px-4 py-2 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('create-account')}
                  className="bg-spark-red hover:bg-red-700 text-white font-black py-3 px-8 rounded-2xl transition-all shadow-lg shadow-red-100 active:scale-95 text-sm"
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
              className="inline-flex items-center justify-center p-2 rounded-xl text-spark-gray hover:text-spark-red hover:bg-red-50 focus:outline-none transition-colors"
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
        <div className="lg:hidden bg-white border-b border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {NAV_LINKS.map((link: NavLink) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  onNavigate(link.href);
                }}
                className="text-spark-gray hover:text-spark-red block px-4 py-3 rounded-2xl text-base font-bold hover:bg-red-50 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-6 border-t border-gray-100 flex flex-col space-y-3">
              {user ? (
                <>
                  <button onClick={() => { onNavigate(dashboardPage); setIsOpen(false); }} className="w-full text-center bg-spark-red text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100">
                    Dashboard
                  </button>
                  <button onClick={handleLogout} className="w-full text-center text-spark-gray font-black py-4 uppercase tracking-widest text-xs">
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="w-full text-center text-spark-gray font-black py-4 uppercase tracking-widest text-xs">
                    Login
                  </button>
                  <button onClick={() => { onNavigate('create-account'); setIsOpen(false); }} className="w-full text-center bg-spark-red text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100">
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
