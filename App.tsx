import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc as firebaseDoc, getDoc as firebaseGetDoc } from 'firebase/firestore';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import DashboardPortal from './components/DashboardPortal';
import FaqSection from './components/FaqSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import BrandsPage from './components/BrandsPage';
import StudentsPage from './components/StudentsPage';
import BrandDashboard from './components/BrandDashboard';
import StudentDashboard from './components/StudentDashboard';
import OrgDashboard from './components/OrgDashboard';
import AdminDashboard from './components/AdminDashboard';
import AboutPage from './components/AboutPage';
import CareersPage from './components/CareersPage';
import ContactPage from './components/ContactPage';
import LoginPage from './components/LoginPage';
import CreateAccountPage from './components/CreateAccountPage';
import RoleSelectionSection from './components/RoleSelectionSection';
import LiveOpportunitiesSection from './components/LiveOpportunitiesSection';
import TrustSection from './components/TrustSection';
import SocialProofSection from './components/SocialProofSection';
import ScrollToTop from './components/ScrollToTop';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Sync with localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        try {
          const userDocRef = firebaseDoc(db, 'users', firebaseUser.uid);
          const userSnap = await firebaseGetDoc(userDocRef);
          if (userSnap.exists()) {
            const profile = { id: firebaseUser.uid, ...userSnap.data() };
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          } else {
            setUser(firebaseUser);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    });
    return () => unsubscribe();
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    const validPages = [
      'login', 'create-account', 'brand-dashboard', 'student-dashboard',
      'org-dashboard', 'admin-dashboard', 'for-brands',
      'for-students', 'about', 'careers', 'contact'
    ];

    if (path === 'admin') {
      setCurrentPage('login');
    } else if (validPages.includes(path)) {
      setCurrentPage(path);
    }

    const handlePopState = () => {
      const newPath = window.location.pathname.replace('/', '') || 'home';
      setCurrentPage(newPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isStandalonePage = [
    'brand-dashboard',
    'student-dashboard',
    'org-dashboard',
    'admin-dashboard',
    'login',
    'create-account'
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
      case 'create-account': return <CreateAccountPage onNavigate={navigateTo} />;
      case 'brand-dashboard': return <BrandDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} />;
      case 'student-dashboard': return <StudentDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} />;
      case 'org-dashboard': return <OrgDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} />;
      case 'admin-dashboard': return <AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} />;
      case 'how-it-works':
      case 'about': return <AboutPage onNavigate={navigateTo} />;
      case 'for-brands': return <BrandsPage onNavigate={navigateTo} />;
      case 'for-students': return <StudentsPage onNavigate={navigateTo} />;
      case 'careers': return <CareersPage onNavigate={navigateTo} user={user} />;
      case 'contact': return <ContactPage onNavigate={navigateTo} />;
      case 'home':
      default:
        return (
          <>
            <HeroSection onNavigate={navigateTo} />
            <RoleSelectionSection onNavigate={navigateTo} />
            <LiveOpportunitiesSection onNavigate={navigateTo} />
            <FeaturesSection />
            <HowItWorksSection />
            <TrustSection />
            <SocialProofSection />
            <DashboardPortal onNavigate={navigateTo} />
            <FaqSection />
            <CtaSection onNavigate={navigateTo} />
          </>
        );
    }
  };

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
