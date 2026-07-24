import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Eye, Lock, Share2, Clock, UserCheck, Cookie, AlertTriangle, Phone } from 'lucide-react';

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left bg-[var(--bg-secondary)] hover:bg-spark-red/5 transition-colors"
      >
        <span className="flex items-center gap-3 font-black text-[var(--text-primary)] text-sm uppercase tracking-wider">
          <span className="text-spark-red">{icon}</span>
          {title}
        </span>
        <ChevronDown className={`w-5 h-5 text-spark-red transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="p-6 pt-4 bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm leading-relaxed font-medium space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

const PrivacyPolicyPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)]">
      <title>Privacy Policy — ABC Rally</title>
      {/* Hero */}
      <section className="relative py-24 border-b border-[var(--border-color)] overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[80%] bg-spark-red/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[60%] bg-spark-red/3 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-fancy font-black tracking-tight mb-6">
            Privacy <span className="text-gradient-red italic">Policy</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-medium text-base leading-relaxed max-w-2xl">
            This policy explains how ABC Rally collects, uses, stores, and protects your personal data when you use our platform.
          </p>
          <p className="mt-4 text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">
            Last updated: July 2025 &nbsp;·&nbsp; Effective date: July 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Intro */}
          <div className="mb-12 p-8 bg-[var(--bg-secondary)] rounded-[2rem] border border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">
              ABC Rally Limited ("ABC Rally", "we", "our", or "us") operates the ABC Rally collaboration and event sponsorship marketplace platform.
              By registering or using our services, you agree to the collection and use of information in accordance with this policy.
              We are committed to protecting your personal data and ensuring full transparency in how it is handled.
            </p>
          </div>

          <Section title="1. Information We Collect" icon={<Eye className="w-4 h-4" />} defaultOpen>
            <p>We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">Account Data:</strong> Full name, email address, phone number, profile photo, role (Brand, Creator, or Association), and password (encrypted).</li>
              <li><strong className="text-[var(--text-primary)]">Profile Data:</strong> University, bio, social media handles, portfolio URLs, location, industry, company size, and sponsorship preferences.</li>
              <li><strong className="text-[var(--text-primary)]">Transaction Data:</strong> Wallet top-ups, escrow activity, event sponsorship contributions, campaign allocations, gig payments, withdrawals, and bank account details for payouts.</li>
              <li><strong className="text-[var(--text-primary)]">Event Data:</strong> Event listings, sponsorship packages, expected attendees, activation needs, and raised/target sponsorship amounts.</li>
              <li><strong className="text-[var(--text-primary)]">Usage Data:</strong> Pages visited, actions taken within the platform, login timestamps, device type, and browser information.</li>
              <li><strong className="text-[var(--text-primary)]">Communication Data:</strong> Messages, proposals, sponsorship negotiations, and any content you submit through the platform.</li>
              <li><strong className="text-[var(--text-primary)]">Verification Documents:</strong> For associations, faculty letters or accreditation documents submitted for profile verification.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information" icon={<UserCheck className="w-4 h-4" />}>
            <p>We use your data to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Create and manage your account and dashboard.</li>
              <li>Process payments, manage escrow, and release payouts via Paystack.</li>
              <li>Deduct the applicable 10% platform commission fee from event sponsorship payouts.</li>
              <li>Match brands with creators and associations based on profile data.</li>
              <li>Display event listings and sponsorship opportunities to qualified brands.</li>
              <li>Send transactional emails (registration confirmations, payment receipts, proposal updates, sponsorship notifications).</li>
              <li>Monitor platform activity to prevent fraud, abuse, and unauthorised access.</li>
              <li>Improve our services through aggregated, anonymised analytics.</li>
              <li>Respond to your support enquiries and platform feedback.</li>
              <li>Comply with applicable Nigerian and international data protection laws.</li>
            </ul>
          </Section>

          <Section title="3. Legal Basis for Processing" icon={<Lock className="w-4 h-4" />}>
            <p>We process your data on the following legal bases:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">Contract:</strong> Processing necessary to provide the services you signed up for, including managing event listings and processing sponsorship transactions.</li>
              <li><strong className="text-[var(--text-primary)]">Legitimate Interests:</strong> Platform security, fraud prevention, and service improvement.</li>
              <li><strong className="text-[var(--text-primary)]">Consent:</strong> Marketing communications, where you have explicitly opted in.</li>
              <li><strong className="text-[var(--text-primary)]">Legal Obligation:</strong> Where we are required to retain data to comply with law or resolve formal disputes.</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing and Third Parties" icon={<Share2 className="w-4 h-4" />}>
            <p>We do not sell your personal data. We share it only with:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">Paystack:</strong> For payment processing, wallet top-ups, and withdrawals. Paystack's own privacy policy governs their handling of your financial data.</li>
              <li><strong className="text-[var(--text-primary)]">Firebase / Google:</strong> For database storage, authentication, and hosting infrastructure.</li>
              <li><strong className="text-[var(--text-primary)]">Email Service Providers:</strong> For sending transactional and notification emails.</li>
              <li><strong className="text-[var(--text-primary)]">Other Users:</strong> Your public profile (name, bio, university, portfolio) is visible to other verified users on the platform for collaboration purposes. Event listings are publicly accessible for brand discovery.</li>
              <li><strong className="text-[var(--text-primary)]">Law Enforcement:</strong> Where required by valid legal process or to protect the safety of our users.</li>
            </ul>
          </Section>

          <Section title="5. Data Retention" icon={<Clock className="w-4 h-4" />}>
            <p>We retain your data for as long as your account is active or as needed to provide services. Specifically:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Account data is retained until you request deletion.</li>
              <li>Transaction records and sponsorship records are retained for a minimum of 7 years for financial compliance.</li>
              <li>Dispute records are retained until resolution, and for 3 years thereafter.</li>
              <li>Verification documents are retained for the period of your association's active status.</li>
              <li>Usage logs are retained for 12 months then automatically deleted.</li>
            </ul>
          </Section>

          <Section title="6. Your Rights" icon={<UserCheck className="w-4 h-4" />}>
            <p>Under applicable data protection law, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-[var(--text-primary)]">Correction:</strong> Update or correct inaccurate data via your profile settings.</li>
              <li><strong className="text-[var(--text-primary)]">Deletion:</strong> Request that we delete your account and personal data (subject to legal retention obligations).</li>
              <li><strong className="text-[var(--text-primary)]">Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong className="text-[var(--text-primary)]">Portability:</strong> Request your data in a structured, commonly used format.</li>
              <li><strong className="text-[var(--text-primary)]">Withdraw Consent:</strong> Unsubscribe from marketing at any time.</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:hello@abc-rally.com" className="text-spark-red font-bold hover:underline">hello@abc-rally.com</a>.</p>
          </Section>

          <Section title="7. Cookies and Tracking" icon={<Cookie className="w-4 h-4" />}>
            <p>We use essential cookies to maintain your login session and user preferences. We do not use third-party advertising trackers. Analytics data, if collected, is aggregated and anonymised.</p>
            <p className="mt-2">You can disable cookies in your browser settings, but this may affect your ability to use the platform.</p>
          </Section>

          <Section title="8. Security" icon={<Lock className="w-4 h-4" />}>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>HTTPS encryption for all data in transit.</li>
              <li>Firebase Authentication with encrypted password storage.</li>
              <li>Role-based access control and Firestore security rules to restrict data access within the platform.</li>
              <li>Escrow-based fund management to protect financial transactions.</li>
              <li>Admin-only access to sensitive platform operations.</li>
            </ul>
            <p className="mt-2">However, no system is completely immune to breaches. If a breach affects your data, we will notify you within 72 hours of becoming aware.</p>
          </Section>

          <Section title="9. Children's Privacy" icon={<AlertTriangle className="w-4 h-4" />}>
            <p>ABC Rally is intended for users aged 16 and above. We do not knowingly collect data from children under 16. If you believe a minor has registered on our platform, please contact us immediately at <a href="mailto:hello@abc-rally.com" className="text-spark-red font-bold hover:underline">hello@abc-rally.com</a>.</p>
          </Section>

          <Section title="10. Changes to This Policy" icon={<Clock className="w-4 h-4" />}>
            <p>We may update this Privacy Policy periodically. We will notify registered users of material changes via email or in-app notification. Continued use of the platform after changes are posted constitutes your acceptance of the revised policy.</p>
          </Section>

          <Section title="11. Contact Us" icon={<Phone className="w-4 h-4" />}>
            <p>For any privacy-related questions, requests, or complaints:</p>
            <div className="mt-3 space-y-1">
              <p><strong className="text-[var(--text-primary)]">ABC Rally Limited</strong></p>
              <p>42, Olowu Street, Ikeja, Lagos, Nigeria</p>
              <p>Email: <a href="mailto:hello@abc-rally.com" className="text-spark-red font-bold hover:underline">hello@abc-rally.com</a></p>
              <p>Phone: +234 (0) 906 032 0863</p>
            </div>
          </Section>

          {/* CTA */}
          <div className="mt-16 p-8 bg-[var(--bg-secondary)] rounded-[2rem] border border-[var(--border-color)] text-center">
            <p className="text-[var(--text-secondary)] text-sm font-medium mb-6">
              Also read our Terms of Service to understand your rights and responsibilities on the platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('terms')}
                className="px-8 py-3.5 bg-gradient-red text-white font-black rounded-2xl text-sm hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95 uppercase tracking-widest"
              >
                View Terms of Service
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-8 py-3.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-black rounded-2xl text-sm hover:border-spark-red/30 transition-all active:scale-95 uppercase tracking-widest"
              >
                Contact Us
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
