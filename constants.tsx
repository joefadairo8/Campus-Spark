
import React from 'react';
import { NavLink, Feature, HowItWorksContent, Testimonial, FaqItem, UserType, Opportunity } from './types';

export const SparkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

export const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);

export const NAV_LINKS: NavLink[] = [
    { label: 'About Us', href: 'about' },
    { label: 'For Brands', href: 'for-brands' },
    { label: 'For Students', href: 'for-students' },
    { label: 'Opportunities', href: 'careers' },
    { label: 'Contact', href: 'contact' },
];

export const FEATURES: Feature[] = [
    {
        icon: <CalendarIcon className="w-8 h-8 text-spark-red" />,
        title: "Event Sponsorship Finder",
        description: "Fund your next major campus event. Connect with premium Nigerian brands looking to sponsor concerts, tech fests, and student gatherings.",
        bullets: ["Direct sponsorship requests", "Verified organizer profiles", "Tiered visibility options"],
        useCase: "A computer science club at UNILAG secures a ₦5M tech sponsorship for their annual hackathon.",
    },
    {
        icon: <UsersIcon className="w-8 h-8 text-spark-red" />,
        title: "Ambassador Marketplace",
        description: "Scale your campus influence. Our marketplace allows brands to find and hire the top student voices across all 36 Nigerian states.",
        bullets: ["Nationwide university coverage", "Performance-based rewards", "Integrated task management"],
        useCase: "A top Nigerian lifestyle brand launches an ambassador program with 50 students across 5 universities in 24 hours.",
    },
];

export const HOW_IT_WORKS_CONTENT: HowItWorksContent = {
    [UserType.Brands]: [
        { title: "Set Your Objective", description: "Define your campaign goals—be it app downloads, brand awareness, or product sampling." },
        { title: "Browse the Marketplace", description: "Search for influencers and student clubs by university, state, or interest group." },
        { title: "Initiate Collaboration", description: "Send automated offers or custom sponsorship proposals to your selected student leads." },
        { title: "Track Performance", description: "Monitor real-time engagement and growth through our integrated dashboard." },
    ],
    [UserType.Clubs]: [
        { title: "Build Your Profile", description: "Create a verified digital home for your student organization." },
        { title: "List Your Events", description: "Post upcoming concerts, seminars, or festivals to attract corporate sponsors." },
        { title: "Secure Funding", description: "Chat directly with brand managers and finalize sponsorship agreements." },
        { title: "Execute & Grow", description: "Grow your club's impact with professional resources and corporate backing." },
    ],
    [UserType.Ambassadors]: [
        { title: "Join the Elite", description: "Create a portfolio that showcases your campus influence and creative skills." },
        { title: "Apply for Campaigns", description: "Apply to work with brands you love. Get selected based on your profile." },
        { title: "Create Content", description: "Promote products, host events, and drive authentic buzz on campus." },
        { title: "Get Paid", description: "Receive secure payments directly to your account for every successful task." },
    ],
};

export const PARTNER_LOGOS = [
    { name: 'Flutterwave', alt: 'Flutterwave' },
    { name: 'Paystack', alt: 'Paystack' },
    { name: 'MTN', alt: 'MTN Nigeria' },
    { name: 'PiggyVest', alt: 'PiggyVest' },
    { name: 'Kuda', alt: 'Kuda Bank' },
    { name: 'Jumia', alt: 'Jumia Nigeria' },
];

export const TESTIMONIALS: Testimonial[] = [
    {
        quote: "Campus Spark bridged the gap between us and the Gen-Z market in Lagos. The ROI on our ambassador program was 4x compared to traditional ads.",
        name: "Damilola Ade",
        title: "Growth Lead, FinTech X",
    },
    {
        quote: "Our student week used to be underfunded. Now, brands reach out to us directly via Spark. It's been a game changer for our organization.",
        name: "Ikenna Eze",
        title: "President, UNN Student Union",
    },
    {
        quote: "I've worked with 3 brands this semester as an ambassador. The payments are fast and the experience is helping me build a solid marketing CV.",
        name: "Fatima Yusuf",
        title: "Student Influencer, ABU Zaria",
    },
];

export const FAQ_ITEMS: FaqItem[] = [
    { question: "How do I get verified?", answer: "Students are verified using university emails or valid student ID cards. Organizations must provide proof of registration." },
    { question: "Is it really free for students?", answer: "Yes, 100%. We only charge brands a service fee when they hire ambassadors or sponsor events." },
];

// Mock data for campus campaigns and gigs - REMOVED for production readiness

export const LIVE_OPPORTUNITIES: Opportunity[] = [
    { id: '1', title: 'Promote Fintech App', amount: '₦20,000', type: 'Campaign', category: 'Fintech', company: 'NeoBank' },
    { id: '2', title: 'Campus Tech Event', amount: '₦150,000', type: 'Sponsorship', category: 'Technology', company: 'GlobalDev' },
    { id: '3', title: 'NGO Awareness Drive', amount: '₦80,000', type: 'Campaign', category: 'Social Impact', company: 'HealthFirst' },
    { id: '4', title: 'Brand Ambassador', amount: '₦50,000/mo', type: 'Ambassador', category: 'Lifestyle', company: 'SparkStyle' },
];

export const STATES = ["All", "Lagos", "Oyo", "Ogun", "Abuja", "Enugu", "Kaduna", "Rivers", "Edo"];
export const UNIVERSITIES = ["All", "University of Lagos", "Obafemi Awolowo University", "Covenant University", "University of Ibadan"];
