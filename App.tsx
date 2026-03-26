import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc as firebaseDoc, getDoc as firebaseGetDoc } from 'firebase/firestore';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import SocialProofSection from './components/SocialProofSection';
import DashboardPortal from './components/DashboardPortal';
import FaqSection from './components/FaqSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import HowItWorksPage from './components/HowItWorksPage';
import BrandsPage from './components/BrandsPage';
import StudentsPage from './components/StudentsPage';
import BrandDashboard from './components/BrandDashboard';
import StudentDashboard from './components/StudentDashboard';
import OrgDashboard from './components/OrgDashboard';
import AdminDashboard from './components/AdminDashboard';
import AboutPage from './components/AboutPage';
import BlogPage from './components/BlogPage';
import CareersPage from './components/CareersPage';
import ContactPage from './components/ContactPage';
import LoginPage from './components/LoginPage';
import CreateAccountPage from './components/CreateAccountPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<any>(null);

  // Sync with localStorage
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
    // Silent URL update without reload
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    const path = window.location.pathname.replace('/', '');
    const validPages = [
      'login', 'create-account', 'brand-dashboard', 'student-dashboard',
      'org-dashboard', 'admin-dashboard', 'how-it-works', 'for-brands',
      'for-students', 'about', 'blog', 'careers', 'contact'
    ];

    if (path === 'admin') {
      setCurrentPage('login');
    } else if (validPages.includes(path)) {
      setCurrentPage(path);
    }

    // Handle back/forward buttons
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigateTo('home');
    window.location.reload();
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={navigateTo} />;
      case 'create-account':
        return <CreateAccountPage onNavigate={navigateTo} />;
      case 'brand-dashboard':
        return <BrandDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'student-dashboard':
        return <StudentDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'org-dashboard':
        return <OrgDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'how-it-works':
        return <HowItWorksPage onNavigate={navigateTo} />;
      case 'for-brands':
        return <BrandsPage onNavigate={navigateTo} />;
      case 'for-students':
        return <StudentsPage onNavigate={navigateTo} />;
      case 'about':
        return <AboutPage onNavigate={navigateTo} />;
      case 'blog':
        return <BlogPage onNavigate={navigateTo} />;
      case 'careers':
        return <CareersPage onNavigate={navigateTo} />;
      case 'contact':
        return <ContactPage onNavigate={navigateTo} />;
      case 'home':
      default:
        return (
          <>
            <HeroSection onNavigate={navigateTo} />
            <FeaturesSection />
            <HowItWorksSection />
            <DashboardPortal onNavigate={navigateTo} />
            <SocialProofSection />
            <FaqSection />
            <CtaSection onNavigate={navigateTo} />
          </>
        );
    }
  };

  return (
    <div className="bg-white text-spark-black font-sans antialiased min-h-screen">
      {isStandalonePage ? (
        renderPageContent()
      ) : (
        <>
          <Navbar onNavigate={navigateTo} user={user} onLogout={handleLogout} />
          <main>
            {renderPageContent()}
          </main>
          <Footer onNavigate={navigateTo} />
        </>
      )}
    </div>
  );
};

export default App;
