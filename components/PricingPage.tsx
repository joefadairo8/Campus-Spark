import React, { useState } from 'react';
import { Check, X, Zap, Briefcase, Building2, ShieldCheck, ArrowRight, ChevronDown, UserCheck, Lock, Scale, ShieldAlert, FileText, AlertCircle, CreditCard, RefreshCcw, Gavel, BadgeCheck, ListX } from 'lucide-react';
import { FAQ_ITEMS } from '../constants';
import { FaqItem } from '../types';

interface PricingCardProps {
  role: string;
  icon: React.ReactNode;
  tagline: string;
  price: string;
  priceNote: string;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
  highlight?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  onNavigate: (page: string) => void;
  navTarget: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  role, icon, tagline, price, priceNote, color, borderColor, bgColor, badgeColor,
  highlight, features, cta, onNavigate, navTarget,
}) => (
  <div className={`relative flex flex-col rounded-[2.5rem] border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
    highlight
      ? `${borderColor} ${bgColor} shadow-2xl shadow-spark-red/10`
      : 'border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm'
  }`}>
    {highlight && (
      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 ${badgeColor} text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg`}>
        Most Popular
      </div>
    )}

    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${bgColor} ${color} border ${borderColor}`}>
      {icon}
    </div>

    <h3 className={`text-2xl font-black mb-1 ${color}`}>{role}</h3>
    <p className="text-[var(--text-secondary)] text-sm font-medium mb-6">{tagline}</p>

    <div className="mb-6">
      <span className={`text-5xl font-black ${color}`}>{price}</span>
      <p className="text-[var(--text-secondary)] text-sm font-medium mt-2 leading-relaxed">{priceNote}</p>
    </div>

    <div className="flex-1 space-y-3 mb-8">
      {features.map((f, i) => (
        <div key={i} className="flex items-start gap-3">
          {f.included
            ? <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
            : <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--text-secondary)] opacity-40" />
          }
          <span className={`text-sm font-medium ${f.included ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-60'}`}>
            {f.text}
          </span>
        </div>
      ))}
    </div>

    <button
      onClick={() => onNavigate(navTarget)}
      className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
        highlight
          ? `${badgeColor} text-white shadow-lg hover:opacity-90`
          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-spark-red/40 hover:text-spark-red'
      }`}
    >
      {cta}
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

const FaqAccordion: React.FC<{ items: FaqItem[] }> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-spark-red/5 transition-colors"
          >
            <span className={`font-bold pr-4 transition-colors ${openIndex === i ? 'text-spark-red' : 'text-[var(--text-primary)]'}`}>
              {item.question}
            </span>
            <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-spark-red' : 'text-[var(--text-secondary)]'}`} />
          </button>
          <div className={`px-6 overflow-hidden transition-all duration-400 ease-in-out ${openIndex === i ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const POLICY_PAGES = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Terms of Service',
    desc: 'General rights, obligations, platform rules, account limitations and acceptable use.',
    color: 'text-blue-600',
    border: 'border-blue-500/20',
    bg: 'bg-blue-50/40 dark:bg-blue-900/10',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Privacy Policy',
    desc: 'Data collection, storage, sharing, security, cookies and your rights as a user.',
    color: 'text-purple-600',
    border: 'border-purple-500/20',
    bg: 'bg-purple-50/40 dark:bg-purple-900/10',
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Payment & Wallet Policy',
    desc: 'Funding, deductions, platform fees, payment processor, failed transactions and account balances.',
    color: 'text-green-600',
    border: 'border-green-500/20',
    bg: 'bg-green-50/40 dark:bg-green-900/10',
  },
  {
    icon: <ArrowRight className="w-6 h-6" />,
    title: 'Withdrawal Policy',
    desc: 'Who can withdraw, timing, minimum amount, bank verification and failed withdrawal handling.',
    color: 'text-spark-red',
    border: 'border-spark-red/20',
    bg: 'bg-red-50/40 dark:bg-red-900/10',
  },
  {
    icon: <RefreshCcw className="w-6 h-6" />,
    title: 'Refund Policy',
    desc: 'When users may request a refund and what happens when a campaign, gig or event is cancelled.',
    color: 'text-orange-600',
    border: 'border-orange-500/20',
    bg: 'bg-orange-50/40 dark:bg-orange-900/10',
  },
  {
    icon: <Gavel className="w-6 h-6" />,
    title: 'Dispute Resolution Policy',
    desc: 'How payment, campaign delivery, event sponsorship and task disputes are reported and resolved.',
    color: 'text-red-700',
    border: 'border-red-500/20',
    bg: 'bg-red-50/40 dark:bg-red-900/10',
  },
  {
    icon: <BadgeCheck className="w-6 h-6" />,
    title: 'Verification Policy',
    desc: 'What the verified badge means, how verification is conducted and what it does not guarantee.',
    color: 'text-teal-600',
    border: 'border-teal-500/20',
    bg: 'bg-teal-50/40 dark:bg-teal-900/10',
  },
  {
    icon: <ListX className="w-6 h-6" />,
    title: 'Campaign & Event Listing Rules',
    desc: 'Prohibited listings, misleading claims, illegal products, fake events and rejection or removal rules.',
    color: 'text-gray-600',
    border: 'border-gray-400/20',
    bg: 'bg-gray-50/40 dark:bg-gray-800/10',
  },
];

const PricingPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const plans: PricingCardProps[] = [
    {
      role: 'Associations',
      icon: <Building2 className="w-7 h-7" />,
      tagline: 'For student clubs, campus bodies, and cultural organisations.',
      price: 'Free to join',
      priceNote: 'List events for sponsors — free. 10% platform service fee applies on sponsorship transactions completed through ABC-Rally.',
      color: 'text-purple-600',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-50/50 dark:bg-purple-900/10',
      badgeColor: 'bg-purple-600',
      navTarget: 'create-account',
      cta: 'Join as an Association',
      features: [
        { text: 'Free Association profile & verification', included: true },
        { text: 'List events & sponsorship packages — free', included: true },
        { text: 'Receive direct proposals from brands', included: true },
        { text: 'Browse the full Talent Directory', included: true },
        { text: 'Secure payment processing via Paystack', included: true },
        { text: '10% service fee on sponsorship transactions', included: true },
        { text: 'Funds released per agreed sponsorship terms', included: true },
      ],
    },
    {
      role: 'Brands',
      icon: <Briefcase className="w-7 h-7" />,
      tagline: 'For companies, agencies, and startups targeting campus audiences.',
      price: 'Free to join',
      priceNote: '₦20,000 per campaign or gig listing. 10% platform service fee on sponsorship transactions. Large or multi-city campaigns may require custom pricing.',
      color: 'text-blue-600',
      borderColor: 'border-blue-500/40',
      bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
      badgeColor: 'bg-blue-600',
      highlight: true,
      navTarget: 'create-account',
      cta: 'Start a Campaign',
      features: [
        { text: 'Free Brand profile & verification', included: true },
        { text: '₦20,000 per campaign or gig listing posted', included: true },
        { text: 'Browse the full Talent Directory', included: true },
        { text: 'Send unlimited proposals to creators', included: true },
        { text: 'Secure payment processing via Paystack', included: true },
        { text: '10% service fee on sponsorship transactions', included: true },
        { text: 'Real-time campaign dashboard & analytics', included: true },
      ],
    },
    {
      role: 'Creators',
      icon: <Zap className="w-7 h-7" />,
      tagline: 'For students, influencers, and campus ambassadors.',
      price: 'Free to apply',
      priceNote: '10% platform service fee on creator paid gigs completed through ABC-Rally. Deducted at settlement — no upfront cost.',
      color: 'text-spark-red',
      borderColor: 'border-spark-red/30',
      bgColor: 'bg-red-50/50 dark:bg-red-900/10',
      badgeColor: 'bg-spark-red',
      navTarget: 'create-account',
      cta: 'Join as a Creator',
      features: [
        { text: 'Free Creator profile & verification badge', included: true },
        { text: 'Apply to unlimited campaigns & gigs — free', included: true },
        { text: 'Browse the full Talent Directory', included: true },
        { text: 'Payment held pending delivery confirmation', included: true },
        { text: 'Withdraw to any Nigerian bank account', included: true },
        { text: '10% service fee on completed paid gigs only', included: true },
        { text: 'No upfront fees — ever', included: true },
      ],
    },
  ];

  return (
    <div className="pt-28 pb-24 min-h-screen bg-[var(--bg-primary)]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
        <div className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl md:text-6xl font-fancy font-black text-[var(--text-primary)] mb-6 leading-tight">
          Simple, transparent pricing for<br />
          <span className="text-gradient-red italic">campaigns, gigs and sponsorships.</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          No monthly subscriptions. No hidden fees. Everyone joins free.
          Platform service fees only apply when a transaction is completed through ABC-Rally.
        </p>
      </div>

      {/* ── Quick Fee Summary Banner ───────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Campaign / Gig Listing', fee: '₦20,000', note: 'Flat fee per listing posted by a brand', color: 'from-blue-500/10 to-spark-red/10', border: 'border-blue-200/40' },
            { label: 'Event Sponsorship Listing', fee: 'Free', note: 'Associations & Brands list events free', color: 'from-purple-500/10 to-green-500/10', border: 'border-purple-200/40' },
            { label: 'Sponsorship Service Fee', fee: '10%', note: 'On sponsorship transactions completed through ABC-Rally', color: 'from-purple-500/10 to-spark-red/10', border: 'border-purple-200/40' },
            { label: 'Creator Gig Service Fee', fee: '10%', note: 'On creator paid gigs completed through ABC-Rally', color: 'from-spark-red/10 to-orange-500/10', border: 'border-spark-red/20' },
          ].map(item => (
            <div key={item.label} className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-6 text-center`}>
              <div className="text-3xl font-black text-[var(--text-primary)] mb-1">{item.fee}</div>
              <div className="text-sm font-black text-[var(--text-primary)] mb-1">{item.label}</div>
              <div className="text-xs font-medium text-[var(--text-secondary)]">{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pricing Cards ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => (
            <PricingCard key={plan.role} {...plan} onNavigate={onNavigate} />
          ))}
        </div>
        <p className="text-center text-[var(--text-secondary)] text-sm mt-6 font-medium">
          ✓ All users get free access to the <strong className="text-[var(--text-primary)]">Talent Directory</strong> &nbsp;·&nbsp;
          ✓ Events are <strong className="text-[var(--text-primary)]">free to list</strong> &nbsp;·&nbsp;
          ✓ Creators apply <strong className="text-[var(--text-primary)]">for free</strong>
        </p>
      </div>

      {/* ── Custom Campaigns Banner ──────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-14 h-14 bg-spark-red/10 text-spark-red rounded-2xl flex items-center justify-center flex-shrink-0 border border-spark-red/20">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Custom Campaigns</h3>
            <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-sm">
              Large campaigns, multi-city activations or managed projects may require custom pricing based on scope.
              Reach out to our team to discuss your specific requirements.
            </p>
          </div>
          <button
            onClick={() => onNavigate('contact')}
            className="bg-spark-red hover:bg-red-700 text-white font-black py-3 px-7 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 flex-shrink-0 shadow-lg shadow-spark-red/20"
          >
            Get a Quote <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-2 text-center">
            How fees actually <span className="text-gradient-red italic">work</span>
          </h2>
          <p className="text-center text-[var(--text-secondary)] text-sm font-medium mb-10">
            Example: a Creator earns ₦100,000 — ABC-Rally deducts ₦10,000 (10%) as platform service fee. Creator receives ₦90,000.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                title: 'Campaign posted',
                desc: 'Brands pay ₦20,000 per campaign or gig listing. Associations list events free. Opportunities go live immediately after review.',
                color: 'text-blue-600',
                bg: 'bg-blue-50/60 dark:bg-blue-900/10',
              },
              {
                step: '02',
                title: 'Creator applies — free',
                desc: 'Creators apply with no upfront fee. No cost until a gig is accepted and completed through the platform.',
                color: 'text-purple-600',
                bg: 'bg-purple-50/60 dark:bg-purple-900/10',
              },
              {
                step: '03',
                title: 'Payment held pending delivery',
                desc: 'Payment may be held pending delivery confirmation where applicable. Funds are released according to agreed task, campaign or sponsorship terms.',
                color: 'text-spark-red',
                bg: 'bg-red-50/60 dark:bg-red-900/10',
              },
              {
                step: '04',
                title: 'Approved → 10% fee → Creator paid',
                desc: 'Brand confirms delivery. ABC-Rally deducts a 10% platform service fee. The remaining 90% is released to the Creator\'s wallet.',
                color: 'text-green-600',
                bg: 'bg-green-50/60 dark:bg-green-900/10',
              },
            ].map((item) => (
              <div key={item.step} className={`${item.bg} rounded-2xl p-5`}>
                <div className={`text-3xl font-black mb-3 ${item.color} opacity-30`}>{item.step}</div>
                <h3 className={`font-black text-sm mb-2 ${item.color}`}>{item.title}</h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Safer Payment Language Banner ────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-spark-black rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-spark-red/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white">Payment & Transaction Protection</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { text: 'Secure payment processing powered by Paystack.', icon: <CreditCard className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> },
                { text: 'Payment may be held pending delivery confirmation where applicable.', icon: <Lock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> },
                { text: 'Funds are released according to the agreed task, campaign or sponsorship terms.', icon: <CheckCircleIcon /> },
                { text: 'Disputes are reviewed through ABC-Rally support in line with the Payment, Refund and Dispute Policy.', icon: <Scale className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                  {item.icon}
                  <p className="text-gray-300 text-sm font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust & Safety Section ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 mb-4 text-xs font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Our Security Commitment
          </div>
          <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6">
            Designed for <span className="text-gradient-red italic">Safety & Trust</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-base font-medium max-w-2xl mx-auto leading-relaxed">
            ABC-Rally connects Brands, Creators and Associations under a framework of verification, payment protection and dispute support.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: 'Profile Verification',
              description: 'Creators verify social metrics, brands verify company registration, and associations verify their credentials before going live.',
              icon: <UserCheck className="w-8 h-8 text-spark-red" />,
              color: 'border-spark-red/30',
              bgColor: 'bg-red-50/20 dark:bg-red-900/5',
            },
            {
              title: 'Paystack Payment Processing',
              description: 'Secure payment processing powered by Paystack. Funds are handled according to agreed campaign, gig or sponsorship terms.',
              icon: <Lock className="w-8 h-8 text-purple-600" />,
              color: 'border-purple-500/30',
              bgColor: 'bg-purple-50/20 dark:bg-purple-900/5',
            },
            {
              title: 'Dispute Support',
              description: 'Payment, campaign delivery and event sponsorship disputes are reviewed through ABC-Rally support in line with the Dispute Resolution Policy.',
              icon: <Scale className="w-8 h-8 text-blue-600" />,
              color: 'border-blue-500/30',
              bgColor: 'bg-blue-50/20 dark:bg-blue-900/5',
            },
            {
              title: 'Data & Privacy Security',
              description: 'Secure integrations, encrypted wallet data, and compliance with NDPR data privacy standards protecting all user information.',
              icon: <ShieldAlert className="w-8 h-8 text-green-600" />,
              color: 'border-green-500/30',
              bgColor: 'bg-green-50/20 dark:bg-green-900/5',
            },
          ].map((item, index) => (
            <div key={index} className={`rounded-[2rem] border-2 ${item.color} ${item.bgColor} p-6 flex flex-col hover:scale-[1.02] transition-all duration-300`}>
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-spark-black flex items-center justify-center mb-6 shadow-md border border-[var(--border-color)]">
                {item.icon}
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">{item.title}</h3>
              <p className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Policy Pages Section ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 mb-4 text-xs font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Platform Policies
          </div>
          <h2 className="text-3xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">
            Required <span className="text-gradient-red italic">Policy Pages</span>
          </h2>
          <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
            ABC-Rally operates under a clear set of policies covering payments, data, disputes, verification and listing rules.
            All users are expected to read and accept these policies before transacting on the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {POLICY_PAGES.map((policy, i) => (
            <div
              key={i}
              className={`border ${policy.border} ${policy.bg} rounded-[2rem] p-6 flex flex-col gap-3 hover:scale-[1.01] transition-all duration-300`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-spark-black flex items-center justify-center shadow-sm border border-[var(--border-color)] ${policy.color}`}>
                {policy.icon}
              </div>
              <h3 className={`font-black text-sm ${policy.color}`}>{policy.title}</h3>
              <p className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed">{policy.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[var(--text-secondary)] text-sm font-medium">
            All policy documents are available in our <strong className="text-[var(--text-primary)]">Terms & Policies</strong> section.
            Questions? <button onClick={() => onNavigate('contact')} className="text-spark-red font-black hover:underline">Contact our support team →</button>
          </p>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">
            Pricing <span className="text-gradient-red italic">FAQ</span>
          </h2>
          <p className="text-[var(--text-secondary)] font-medium">
            Clear answers to the most common questions about how we charge.
          </p>
        </div>
        <FaqAccordion items={FAQ_ITEMS} />

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-[var(--text-secondary)] font-medium mb-4">Still have questions?</p>
          <button
            onClick={() => onNavigate('contact')}
            className="bg-spark-red hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl transition-all active:scale-95 shadow-lg shadow-spark-red/20"
          >
            Chat with our team
          </button>
        </div>
      </div>
    </div>
  );
};

// Small inline icon helper to avoid importing an extra unused icon
const CheckCircleIcon = () => (
  <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default PricingPage;
