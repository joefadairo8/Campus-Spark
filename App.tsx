import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import RoleSelectionSection from './components/RoleSelectionSection';
import LiveOpportunitiesSection from './components/LiveOpportunitiesSection';
import TrustSection from './components/TrustSection';
import SocialProofSection from './components/SocialProofSection';
import ScrollToTop from './components/ScrollToTop';
import LatestBlogsSection from './components/LatestBlogsSection';
import MarketplaceModules from './components/MarketplaceModules';
import { globalBrandingSettings, getRawAppName } from './constants';

const LoginPage = lazy(() => import('./components/LoginPage'));
const CreateAccountPage = lazy(() => import('./components/CreateAccountPage'));
const AdminLoginPage = lazy(() => import('./components/AdminLoginPage'));
const BrandDashboard = lazy(() => import('./components/BrandDashboard'));
const CreatorDashboard = lazy(() => import('./components/CreatorDashboard'));
const AssociationDashboard = lazy(() => import('./components/AssociationDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const CareersPage = lazy(() => import('./components/CareersPage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const ScheduleCallPage = lazy(() => import('./components/ScheduleCallPage'));
const BlogPage = lazy(() => import('./components/BlogPage'));
const EventsPage = lazy(() => import('./components/EventsPage'));
const ForAssociationsPage = lazy(() => import('./components/ForAssociationsPage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./components/TermsOfServicePage'));
const HelpCenterPage = lazy(() => import('./components/HelpCenterPage'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const OpportunitiesPage = lazy(() => import('./components/OpportunitiesPage'));
const BrandsPage = lazy(() => import('./components/BrandsPage'));
const CreatorsPage = lazy(() => import('./components/CreatorsPage'));

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-spark-red border-t-transparent rounded-full animate-spin" />
  </div>
);

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
      // Webhook redirects
      'api/escrow/webhook', 'webhook'
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
    } else if (path === 'api/escrow/webhook' || path === 'webhook') {
      const userStr = localStorage.getItem('user');
      const storedUser = userStr ? JSON.parse(userStr) : null;
      if (storedUser) {
        let allowedDashboard = 'creator-dashboard';
        if (storedUser.role === 'Admin') {
          allowedDashboard = 'admin-dashboard';
        } else if (storedUser.role === 'Brand') {
          allowedDashboard = 'brand-dashboard';
        } else if (storedUser.role === 'Organization' || storedUser.role === 'Association') {
          allowedDashboard = 'association-dashboard';
        }
        setCurrentPage(allowedDashboard);
        window.history.replaceState({}, '', `/${allowedDashboard}`);
      } else {
        setCurrentPage('login');
        window.history.replaceState({}, '', '/login');
      }
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
      case 'login': return <Suspense fallback={<PageLoader />}><LoginPage onNavigate={navigateTo} /></Suspense>;
      case 'admin-login': return <Suspense fallback={<PageLoader />}><AdminLoginPage onNavigate={navigateTo} /></Suspense>;
      case 'create-account': return <Suspense fallback={<PageLoader />}><CreateAccountPage onNavigate={navigateTo} /></Suspense>;
      case 'brand-dashboard': return <Suspense fallback={<PageLoader />}><BrandDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} /></Suspense>;
      case 'creator-dashboard': return <Suspense fallback={<PageLoader />}><CreatorDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} /></Suspense>;
      case 'association-dashboard': return <Suspense fallback={<PageLoader />}><AssociationDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} /></Suspense>;
      case 'admin-dashboard': return <Suspense fallback={<PageLoader />}><AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} themeMode={themeMode} user={user} /></Suspense>;
      case 'how-it-works':
      case 'about': return <Suspense fallback={<PageLoader />}><AboutPage onNavigate={navigateTo} /></Suspense>;
      case 'for-brands': return <Suspense fallback={<PageLoader />}><BrandsPage onNavigate={navigateTo} /></Suspense>;
      case 'for-creators': return <Suspense fallback={<PageLoader />}><CreatorsPage onNavigate={navigateTo} /></Suspense>;
      case 'for-associations': return <Suspense fallback={<PageLoader />}><ForAssociationsPage onNavigate={navigateTo} /></Suspense>;
      case 'careers': return <Suspense fallback={<PageLoader />}><CareersPage onNavigate={navigateTo} user={user} /></Suspense>;
      case 'opportunities': return <Suspense fallback={<PageLoader />}><OpportunitiesPage onNavigate={navigateTo} user={user} /></Suspense>;
      case 'events': return <Suspense fallback={<PageLoader />}><EventsPage onNavigate={navigateTo} user={user} /></Suspense>;
      case 'contact': return <Suspense fallback={<PageLoader />}><ContactPage onNavigate={navigateTo} /></Suspense>;
      case 'schedule-call': return <Suspense fallback={<PageLoader />}><ScheduleCallPage onNavigate={navigateTo} /></Suspense>;
      case 'blog': return <Suspense fallback={<PageLoader />}><BlogPage onNavigate={navigateTo} /></Suspense>;
      case 'privacy': return <Suspense fallback={<PageLoader />}><PrivacyPolicyPage onNavigate={navigateTo} /></Suspense>;
      case 'terms': return <Suspense fallback={<PageLoader />}><TermsOfServicePage onNavigate={navigateTo} /></Suspense>;
      case 'help': return <Suspense fallback={<PageLoader />}><HelpCenterPage onNavigate={navigateTo} /></Suspense>;
      case 'pricing': return <Suspense fallback={<PageLoader />}><PricingPage onNavigate={navigateTo} /></Suspense>;
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
