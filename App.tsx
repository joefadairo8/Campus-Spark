import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc as firebaseDoc, getDoc as firebaseGetDoc, onSnapshot } from 'firebase/firestore';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import DashboardPortal from './components/DashboardPortal';
import FaqSection from './components/FaqSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import BrandsPage from './components/BrandsPage';
import CreatorsPage from './components/CreatorsPage';
import BrandDashboard from './components/BrandDashboard';
import CreatorDashboard from './components/CreatorDashboard';
import AssociationDashboard from './components/AssociationDashboard';
import AdminDashboard from './components/AdminDashboard';
import AboutPage from './components/AboutPage';
import CareersPage from './components/CareersPage';
import ContactPage from './components/ContactPage';
import LoginPage from './components/LoginPage';
import CreateAccountPage from './components/CreateAccountPage';
import AdminLoginPage from './components/AdminLoginPage';
import RoleSelectionSection from './components/RoleSelectionSection';
import LiveOpportunitiesSection from './components/LiveOpportunitiesSection';
import TrustSection from './components/TrustSection';
import SocialProofSection from './components/SocialProofSection';
import ScrollToTop from './components/ScrollToTop';
import ScheduleCallPage from './components/ScheduleCallPage';
import LatestBlogsSection from './components/LatestBlogsSection';
import MarketplaceModules from './components/MarketplaceModules';
import BlogPage from './components/BlogPage';
import EventsPage from './components/EventsPage';
import ForAssociationsPage from './components/ForAssociationsPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import HelpCenterPage from './components/HelpCenterPage';
import PricingPage from './components/PricingPage';
import OpportunitiesPage from './components/OpportunitiesPage';
import { globalBrandingSettings, getRawAppName } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Dynamic Title, Favicon & Brand Sync via Firestore onSnapshot
  useEffect(() => {
    const docRef = firebaseDoc(db, 'site_settings', 'branding');
    const unsubscribeBranding = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        globalBrandingSettings.update({
          title: data.title || 'ABC‑Rally by Campus Himpact Hub',
          abbrev: data.abbrev || 'ABC‑Rally',
          favicon: data.favicon || '/vite.svg',
          logoType: data.logoType || 'icon',
          logoValue: data.logoValue || 'Megaphone',
          landingImage: data.landingImage || ''
        });
        document.title = data.title || 'ABC‑Rally by Campus Himpact Hub';
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = data.favicon || '/vite.svg';
      } else {
        document.title = getRawAppName();
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) link.href = '/vite.svg';
      }
    }, (err) => {
      console.error('Error fetching dynamic branding settings:', err);
    });

    return () => unsubscribeBranding();
  }, []);

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto');

  const determineIsDarkMode = (mode: 'light' | 'dark' | 'auto') => {
    if (mode === 'light') return false;
    if (mode === 'dark') return true;
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  };

  const toggleTheme = () => {
    let nextMode: 'light' | 'dark' | 'auto' = 'light';
    if (themeMode === 'light') nextMode = 'dark';
    else if (themeMode === 'dark') nextMode = 'auto';
    else nextMode = 'light';

    setThemeMode(nextMode);
    localStorage.setItem('themeMode', nextMode);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | 'auto' | null;
    const initialMode = savedMode || 'auto';
    setThemeMode(initialMode);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const isDark = determineIsDarkMode(themeMode);
      setIsDarkMode(isDark);
    };

    syncTheme();

    let interval: any;
    if (themeMode === 'auto') {
      interval = setInterval(syncTheme, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [themeMode]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      try {
        if (firebaseUser) {
          const userDocRef = firebaseDoc(db, 'users', firebaseUser.uid);
          const userSnap = await firebaseGetDoc(userDocRef);
          if (userSnap.exists()) {
            const profileData = userSnap.data() as any;
            if (profileData.status === 'suspended') {
              await auth.signOut();
              alert('ACCESS DENIED: Your account has been suspended by a platform administrator.');
              setUser(null);
              setAuthLoading(false);
              return;
            }
            const profile = { id: firebaseUser.uid, ...profileData };
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));

            // SECURITY ENFORCEMENT: Admins cannot access regular dashboards
            const regularDashboards = ['creator-dashboard', 'brand-dashboard', 'association-dashboard'];
            if (profileData.role === 'Admin' && regularDashboards.includes(currentPage)) {
              setCurrentPage('admin-dashboard');
              window.history.pushState({}, '', '/admin-dashboard');
            }
          } else {
            setUser(firebaseUser);
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        if (firebaseUser) {
          setUser(firebaseUser);
        }
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  /**
   * Pages that are ONLY reachable by navigating inside the app.
   * Direct URL access (paste, refresh, WhatsApp link, Google crawl, email)
   * will redirect to the homepage instead of rendering the page.
   *
   * Add any funnel/wizard page slugs here.
   */
  const FUNNEL_ONLY_PAGES: string[] = [
    // Example: 'creator', 'brand-signup', 'onboarding'
    // Add page slugs here to lock them behind internal navigation only.
  ];

  const navigateTo = (page: string) => {
    // Mark this as an internal navigation so funnel-only pages know
    // the user arrived from within the app (not via paste/refresh/external link).
    sessionStorage.setItem('_nav_from_app', '1');
    setCurrentPage(page);
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    // Strip leading slash; handle root as 'home'
    const rawPath = window.location.pathname;
    const path = rawPath === '/' ? '' : rawPath.replace(/^\//, '');

    /**
     * ALL slugs the router knows how to render.
     * Every page listed in renderPageContent's switch-case is externally
     * linkable: paste, refresh, WhatsApp share, email, Google crawl.
     * Firebase hosting serves index.html for every path via the "**" rewrite
     * in firebase.json, so the only thing needed here is matching the slug.
     */
    const allRenderablePages = [
      // Auth & account
      'login', 'create-account', 'admin-login',
      // Dashboards (protected by the auth guard below)
      'brand-dashboard', 'creator-dashboard', 'association-dashboard', 'admin-dashboard',
      // Marketing / public pages
      'for-brands', 'for-creators', 'for-associations',
      'about', 'how-it-works',
      // Info pages
      'careers', 'opportunities', 'events', 'contact', 'admin-login', 'schedule-call', 'blog',
      'privacy', 'terms', 'help', 'pricing',
    ];

    /**
     * FUNNEL-ONLY routes — only accessible via internal navigation.
     * Pasting the URL, refreshing, sharing via WhatsApp/email, or Google
     * crawling will redirect to '/' instead of rendering the page.
     * The check relies on a sessionStorage token set by navigateTo().
     */
    const cameFromApp = sessionStorage.getItem('_nav_from_app') === '1';

    if (FUNNEL_ONLY_PAGES.includes(path)) {
      if (!cameFromApp) {
        // External/direct access to a funnel page → send to homepage
        setCurrentPage('home');
        window.history.replaceState({}, '', '/');
      } else {
        setCurrentPage(path);
      }
    } else if (path === 'admin') {
      // Legacy /admin alias → admin login
      setCurrentPage('admin-login');
    } else if (path === 'org-dashboard') {
      // Legacy alias
      setCurrentPage('association-dashboard');
      window.history.replaceState({}, '', '/association-dashboard');
    } else if (allRenderablePages.includes(path)) {
      // Role protection: non-admins cannot directly open /admin-dashboard
      const adminOnly = ['admin-dashboard'];
      const userStr = localStorage.getItem('user');
      const storedUser = userStr ? JSON.parse(userStr) : null;

      if (adminOnly.includes(path) && storedUser?.role !== 'Admin') {
        setCurrentPage('admin-login');
      } else {
        setCurrentPage(path);
      }
    }
    // Unknown / unrecognised paths fall through to the 'home' default
    // already set by useState('home') — no 404 page needed.

    const handlePopState = () => {
      // Browser back/forward = still in-app navigation, so set the token.
      sessionStorage.setItem('_nav_from_app', '1');
      const newPath = window.location.pathname.replace(/^\//, '') || 'home';
      setCurrentPage(newPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // STRICT ROUTING ENFORCEMENT
  React.useEffect(() => {
    if (authLoading) return;

    const dashboardPages = ['brand-dashboard', 'creator-dashboard', 'association-dashboard', 'admin-dashboard'];
    if (dashboardPages.includes(currentPage)) {
      if (!user) {
        // Not logged in -> redirect to login page
        setCurrentPage('login');
        window.history.replaceState({}, '', '/login');
        return;
      }

      const role = user.role;
      
      // Determine what their allowed dashboard is
      let allowedDashboard = 'creator-dashboard'; // default fallback
      if (role === 'Admin') {
        allowedDashboard = 'admin-dashboard';
      } else if (role === 'Brand') {
        allowedDashboard = 'brand-dashboard';
      } else if (role === 'Organization' || role === 'Association') {
        allowedDashboard = 'association-dashboard';
      } else if (role?.includes('Creator') || role?.includes('Ambassador') || role?.includes('Influencer')) {
        allowedDashboard = 'creator-dashboard';
      }

      // If they are on a dashboard page that is NOT their allowed dashboard, force-redirect them
      if (currentPage !== allowedDashboard) {
        console.warn(`[Route Protection] Redirecting user with role "${role}" from "${currentPage}" to "${allowedDashboard}"`);
        setCurrentPage(allowedDashboard);
        window.history.replaceState({}, '', `/${allowedDashboard}`);
      }
    }
  }, [user, currentPage, authLoading]);

  const isStandalonePage = [
    'brand-dashboard',
    'creator-dashboard',
    'association-dashboard',
    'admin-dashboard',
    'login',
    'create-account',
    'admin-login'
  ].includes(currentPage);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
    window.history.pushState({}, '', '/');
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'login': return <LoginPage onNavigate={navigateTo} />;
      case 'admin-login': return <AdminLoginPage onNavigate={navigateTo} />;
      case 'create-account': return <CreateAccountPage onNavigate={navigateTo} />;
      case 'brand-dashboard': return <BrandDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} />;
      case 'creator-dashboard': return <CreatorDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} />;
      case 'association-dashboard': return <AssociationDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} />;
      case 'admin-dashboard': return <AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} />;
      case 'how-it-works':
      case 'about': return <AboutPage onNavigate={navigateTo} />;
      case 'for-brands': return <BrandsPage onNavigate={navigateTo} />;
      case 'for-creators': return <CreatorsPage onNavigate={navigateTo} />;
      case 'for-associations': return <ForAssociationsPage onNavigate={navigateTo} />;
      case 'careers': return <CareersPage onNavigate={navigateTo} user={user} />;
      case 'opportunities': return <OpportunitiesPage onNavigate={navigateTo} user={user} />;
      case 'events': return <EventsPage onNavigate={navigateTo} user={user} />;
      case 'contact': return <ContactPage onNavigate={navigateTo} />;
      case 'schedule-call': return <ScheduleCallPage onNavigate={navigateTo} />;
      case 'blog': return <BlogPage onNavigate={navigateTo} />;
      case 'privacy': return <PrivacyPolicyPage onNavigate={navigateTo} />;
      case 'terms': return <TermsOfServicePage onNavigate={navigateTo} />;
      case 'help': return <HelpCenterPage onNavigate={navigateTo} />;
      case 'pricing': return <PricingPage onNavigate={navigateTo} />;
      case 'home':
      default:
        return (
          <>
            <HeroSection onNavigate={navigateTo} />
            <RoleSelectionSection onNavigate={navigateTo} />
            <HowItWorksSection />
            <MarketplaceModules />
            <TrustSection />
            <SocialProofSection />
            <LiveOpportunitiesSection onNavigate={navigateTo} />
            <LatestBlogsSection onNavigate={navigateTo} />
            <FaqSection />
            <CtaSection onNavigate={navigateTo} />
          </>
        );
    }
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-spark-black' : 'bg-white'} flex items-center justify-center`}>
        <div className="w-10 h-10 border-4 border-spark-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} transition-colors duration-300`}>
      <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased min-h-screen">
        {isStandalonePage ? (
          renderPageContent()
        ) : (
          <>
            <Navbar 
              onNavigate={navigateTo} 
              user={user} 
              onLogout={handleLogout} 
              isDarkMode={isDarkMode} 
              toggleTheme={toggleTheme} 
              themeMode={themeMode}
              currentPage={currentPage}
            />
            <main>
              {renderPageContent()}
            </main>
            <Footer onNavigate={navigateTo} />
          </>
        )}
        <ScrollToTop />
      </div>
    </div>
  );
};

export default App;
