
import React from 'react';
import { NavLink, Feature, HowItWorksContent, Testimonial, FaqItem, UserType, Opportunity } from './types';

import * as LucideIcons from 'lucide-react';
import { useState, useEffect } from 'react';

// Global observer store for branding settings
export const globalBrandingSettings = {
    title: 'ABC‑Rally by Campus Himpact Hub',
    abbrev: 'ABC‑Rally',
    favicon: '/vite.svg',
    logoType: 'icon',
    logoValue: 'Megaphone',
    landingImage: '',
    listeners: [] as (() => void)[],

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    update(settings: { title?: string; abbrev?: string; favicon?: string; logoType?: string; logoValue?: string; landingImage?: string }) {
        Object.assign(this, settings);
        this.listeners.forEach(l => l());
    }
};

export const DynamicText: React.FC<{ type: 'name' | 'abbrev' }> = ({ type }) => {
    const [value, setValue] = useState(type === 'name' ? globalBrandingSettings.title : globalBrandingSettings.abbrev);

    useEffect(() => {
        const unsubscribe = globalBrandingSettings.subscribe(() => {
            setValue(type === 'name' ? globalBrandingSettings.title : globalBrandingSettings.abbrev);
        });
        return unsubscribe;
    }, [type]);

    return <>{value}</>;
};

export const APP_NAME = <DynamicText type="name" />;
export const APP_ABBREV = <DynamicText type="abbrev" />;

export const getRawAppName = () => globalBrandingSettings.title;
export const getRawAppAbbrev = () => globalBrandingSettings.abbrev;

export const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'https://abc-rally.onrender.com';

export const SparkIcon = ({ className }: { className?: string }) => {
    const [logoType, setLogoType] = useState(globalBrandingSettings.logoType);
    const [logoValue, setLogoValue] = useState(globalBrandingSettings.logoValue);

    useEffect(() => {
        const unsubscribe = globalBrandingSettings.subscribe(() => {
            setLogoType(globalBrandingSettings.logoType);
            setLogoValue(globalBrandingSettings.logoValue);
        });
        return unsubscribe;
    }, []);

    if (logoType === 'image') {
        return <img src={logoValue} className={className} alt={globalBrandingSettings.abbrev as any} />;
    }
    const IconComponent = (LucideIcons as any)[logoValue] || LucideIcons.Megaphone;
    return <IconComponent className={className} />;
};

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
    { label: 'About', href: 'about' },
    { label: 'Associations', href: 'for-associations' },
    { label: 'Brands', href: 'for-brands' },
    { label: 'Creators', href: 'for-creators' },
    { label: 'Opportunities', href: 'opportunities' },
    { label: 'Events', href: 'events' },
    { label: 'Pricing', href: 'pricing' },
    { label: 'Contact', href: 'contact' },
];

export const FEATURES: Feature[] = [
    {
        icon: <CalendarIcon className="w-8 h-8 text-spark-red" />,
        title: "Event Sponsorship Finder",
        description: "Fund your next major campus event. Connect with premium Nigerian brands looking to sponsor concerts, tech fests, and campus gatherings.",
        bullets: ["Direct sponsorship requests", "Verified organizer profiles", "Tiered visibility options"],
        useCase: "A computer science club at UNILAG secures a ₦5M tech sponsorship for their annual hackathon.",
    },
    {
        icon: <UsersIcon className="w-8 h-8 text-spark-red" />,
        title: "Creator Marketplace",
        description: "Scale your campus influence. Our marketplace allows brands to find and hire the top voices across all 36 Nigerian states.",
        bullets: ["Nationwide coverage", "Performance-based rewards", "Integrated task management"],
        useCase: "A top Nigerian lifestyle brand launches a creator program with 50 creators across 5 universities in 24 hours.",
    },
];

export const HOW_IT_WORKS_CONTENT: HowItWorksContent = {
    [UserType.Brands]: [
        { title: "Set Your Objective", description: "Define your campaign goals—be it app downloads, brand awareness, or product sampling." },
        { title: "Browse the Marketplace", description: "Search for creators and Associations by university, state, or interest group." },
        { title: "Initiate Collaboration", description: "Send automated offers or custom sponsorship proposals to your selected leads." },
        { title: "Track Performance", description: "Monitor real-time engagement and growth through our integrated dashboard." },
    ],
    [UserType.Associations]: [
        { title: "Build Your Profile", description: "Create a verified digital home for your Association." },
        { title: "List Your Events", description: "Post upcoming concerts, seminars, or festivals to attract corporate sponsors." },
        { title: "Secure Funding", description: "Chat directly with brand managers and finalize sponsorship agreements." },
        { title: "Execute & Grow", description: "Grow your club's impact with professional resources and corporate backing." },
    ],
    [UserType.Creators]: [
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
        quote: "ABC-Rally bridged the gap between us and the Gen-Z market in Lagos. The ROI on our creator program was 4x compared to traditional ads.",
        name: "Damilola Ade",
        title: "Growth Lead, FinTech X",
    },
    {
        quote: "Our campus week used to be underfunded. Now, brands reach out to us directly via Spark. It's been a game changer for our Association.",
        name: "Ikenna Eze",
        title: "President, UNN Campus Union",
    },
    {
        quote: "I've worked with 3 brands this semester as a creator. The payments are fast and the experience is helping me build a solid marketing CV.",
        name: "Yusuf",
        title: "Creator, ABU Zaria",
    },
];

export const FAQ_ITEMS: FaqItem[] = [
    // Platform & Getting Started
    {
        question: "What exactly is ABC-Rally and who is it for?",
        answer: "ABC-Rally is Nigeria's campus marketing platform connecting three types of users — Associations (A), Brands (B), and Creators (C). Associations are student clubs and campus bodies looking for sponsorship. Brands are companies wanting to reach the Gen-Z campus market. Creators are students with social followings who earn money promoting brands on campus."
    },
    {
        question: "Is ABC-Rally only for Nigerian universities?",
        answer: "Currently, yes — ABC-Rally focuses on Nigerian campuses. We support all 36 states and over 100 universities. We are actively planning expansion to other African countries in 2026."
    },
    {
        question: "Is it free to sign up and create an account?",
        answer: "Yes, creating an account is completely free for everyone — Creators, Brands, and Associations. Creators pay nothing at all. Brands and Associations pay small fees only when they want to actively post campaigns or list events."
    },
    // Creators
    {
        question: "How do Creators earn money on ABC-Rally?",
        answer: "Creators apply to paid brand campaigns directly from the marketplace. When accepted, the brand locks the agreed payment in escrow before you begin. Once you submit your deliverables (Instagram posts, reels, tweets, etc.) and the brand approves them, the money is immediately released to your ABC-Rally wallet. You can withdraw to your Nigerian bank account within 24–48 hours."
    },
    {
        question: "Is it really free for Creators?",
        answer: "100% free. Creators pay zero platform fees to join, apply for campaigns, or receive payments. We only charge brands when they hire creators, so all your earnings go directly to you."
    },
    {
        question: "How do I get verified as a Creator?",
        answer: "Verification uses your university email address or a valid student ID. Once submitted, our team reviews it within 48 hours. Verified creators appear with a badge and rank higher in brand search results, which significantly increases your chances of being hired."
    },
    // Brands
    {
        question: "Is it free for Brands to post campaigns?",
        answer: "There is a flat ₦20,000 listing fee per campaign or gig posted by brands. This helps maintain a high-quality, serious marketplace. Event sponsorship listings — for associations and brands seeking sponsors — are posted for free. The campaign budget itself is held securely in escrow and only released to the creator when you approve the completed work."
    },
    {
        question: "What does the escrow system mean for Brands?",
        answer: "When you hire a creator, you pre-fund their payment into a secure escrow account. The money leaves your wallet immediately but the creator cannot access it until they deliver what was agreed. If a creator doesn't deliver, your funds are protected. This eliminates the risk of paying for work that never gets done."
    },
    {
        question: "How do I find the right Creators for my campaign?",
        answer: "Use the Talent Directory to search and filter creators by university, state, niche (tech, fashion, lifestyle, etc.), audience size, and completion rate. You can view full profiles, past campaign history, and ratings before sending a proposal."
    },
    // Associations
    {
        question: "How can our Association get corporate sponsorship through ABC-Rally?",
        answer: "Create a free Association profile, then list your upcoming event in the Events module. Set sponsorship packages (Gold, Silver, Bronze) with their benefits and pricing. Brands browsing the platform can discover your event and send you a proposal directly. You negotiate, agree, and the funds are transferred through the platform."
    },
    {
        question: "What types of associations can join?",
        answer: "Any registered campus group can join — academic associations, tech clubs, cultural bodies, sports unions, entrepreneurship clubs, religious fellowships, and more. You just need a school email and evidence of registration to get verified."
    },
    // Payments & Safety
    {
        question: "What payment methods are supported?",
        answer: "We use Paystack as our payment processor, which supports all major Nigerian bank cards, bank transfers, and USSD. Withdrawals go directly to any Nigerian bank account. All transactions are encrypted and PCI-DSS compliant."
    },
    {
        question: "What happens if there is a dispute between a Brand and a Creator?",
        answer: "If a brand rejects submitted work, they must provide a written reason and the creator gets an opportunity to revise. If both parties still cannot agree, our support team mediates the dispute based on the original campaign brief and submitted evidence. Funds remain locked in escrow throughout the dispute process — no one can withdraw them until it is resolved."
    },
    {
        question: "How long do withdrawals take?",
        answer: "Wallet withdrawals to Nigerian bank accounts are typically processed within 24–48 business hours. Most banks receive the transfer on the same day during business hours. International transfers are not currently supported."
    },
];

// Mock data for campus campaigns and gigs - REMOVED for production readiness

export const LIVE_OPPORTUNITIES: Opportunity[] = [
    { id: '1', title: 'Promote Fintech App', amount: '₦20,000', type: 'Campaign', category: 'Fintech', company: 'NeoBank' },
    { id: '2', title: 'Campus Tech Event', amount: '₦150,000', type: 'Sponsorship', category: 'Technology', company: 'GlobalDev' },
    { id: '3', title: 'NGO Awareness Drive', amount: '₦80,000', type: 'Campaign', category: 'Social Impact', company: 'HealthFirst' },
    { id: '4', title: 'Brand Creator', amount: '₦50,000/mo', type: 'Creator', category: 'Lifestyle', company: 'SparkStyle' },
];

export const STATES = ["All", "Lagos", "Oyo", "Ogun", "Abuja", "Enugu", "Kaduna", "Rivers", "Edo"];
export const UNIVERSITIES = ["All", "University of Lagos", "Obafemi Awolowo University", "Covenant University", "University of Ibadan"];
