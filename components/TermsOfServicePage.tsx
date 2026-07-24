import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Users, CreditCard, Percent, Scale, Gavel, AlertTriangle, FileText, Lock, Ban, Phone } from 'lucide-react';

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

const TermsOfServicePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)]">
      <title>Terms of Service — ABC Rally</title>
      {/* Hero */}
      <section className="relative py-24 border-b border-[var(--border-color)] overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[80%] bg-spark-red/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[60%] bg-spark-red/3 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            <Gavel className="w-3.5 h-3.5" /> Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-fancy font-black tracking-tight mb-6">
            Terms of <span className="text-gradient-red italic">Service</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-medium text-base leading-relaxed max-w-2xl">
            Please read these terms carefully. By registering for or using ABC Rally, you agree to comply with and be bound by this agreement.
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
              Welcome to ABC Rally. This Terms of Service agreement ("Agreement" or "Terms") is a legal contract between you
              ("User", "you", or "your") and ABC Rally Limited ("ABC Rally", "we", "our", or "us"). These Terms govern your access to
              and use of the ABC Rally collaboration marketplace website, web application, and related services.
            </p>
          </div>

          {/* Key Policy Highlights */}
          <div className="mb-8 grid sm:grid-cols-3 gap-4">
            <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">10% Platform Fee</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                A 10% commission applies on all successful event sponsorship funds raised.
              </p>
            </div>
            <div className="p-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider">In-Platform Payments</span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                All transactions must be processed via ABC Rally. Off-platform payments are prohibited.
              </p>
            </div>
            <div className="p-5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider">In-Platform Disputes</span>
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
                All disputes must be submitted and resolved through the ABC Rally Disputes System.
              </p>
            </div>
          </div>

          <Section title="1. Agreement to Terms" icon={<FileText className="w-4 h-4" />} defaultOpen>
            <p>
              By accessing, browsing, registering for, or using our services, you signify that you have read, understood, and agree
              to be bound by these Terms, along with our Privacy Policy. If you do not agree to these Terms, you must immediately stop
              using our platform.
            </p>
            <p className="mt-2">
              If you are entering into this Agreement on behalf of a company, organization, or professional association, you represent
              and warrant that you have the authority to bind such entity to these Terms.
            </p>
          </Section>

          <Section title="2. Account Registration and Eligibility" icon={<Users className="w-4 h-4" />}>
            <p>To register an account and participate on the platform, you must meet the following criteria:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">Eligibility:</strong> You must be at least 16 years of age (or the minimum legal age in your jurisdiction) and possess the legal capacity to enter into binding agreements.</li>
              <li><strong className="text-[var(--text-primary)]">Roles:</strong> You must sign up under one of three specified roles: Brands (Sponsors/Advertisers), Creators (Influencers/Ambassadors), or Associations (University Clubs/Societies/NGOs). Only one primary role can be associated with a single email address.</li>
              <li><strong className="text-[var(--text-primary)]">Accuracy:</strong> You agree to provide true, accurate, current, and complete information during registration and to maintain the accuracy of this data.</li>
              <li><strong className="text-[var(--text-primary)]">Security:</strong> You are solely responsible for safeguarding your password and credentials. You must immediately notify ABC Rally of any unauthorized use or security breach of your account.</li>
            </ul>
          </Section>

          <Section title="3. Association Verification & Student Bodies" icon={<ShieldCheck className="w-4 h-4" />}>
            <p>
              To protect brands and creators, ABC Rally requires verification for accounts registered as Associations or Student Bodies:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>You may be required to upload official documentation, such as university registration letters, faculty authorization, or constitution drafts.</li>
              <li>ABC Rally reserves the right to deny verification, suspend unverified student bodies, or contact university administrations to confirm the authenticity of any student leader.</li>
              <li>You represent that you are authorized to represent the association and commit its influence or events to brand sponsorship contracts.</li>
            </ul>
          </Section>

          <Section title="4. Event Listings and Sponsorship Rules" icon={<FileText className="w-4 h-4" />}>
            <p>
              ABC Rally facilitates event listings whereby associations and brands can attract sponsor funding. By listing an event on the platform, you agree to the following:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">Truthful Listings:</strong> All event details (name, date, venue, attendee count, sponsorship packages, activation perks) must be accurate and not misleading.</li>
              <li><strong className="text-[var(--text-primary)]">10% Platform Commission:</strong> ABC Rally charges a 10% service fee on all successful sponsorship funds raised for listed events. This fee is automatically deducted from payouts before disbursement to the event planner's wallet.</li>
              <li><strong className="text-[var(--text-primary)]">In-Platform Payments Only:</strong> All sponsorship funds, brand contributions, and financial transactions for listed events must be processed exclusively via the ABC Rally secure payment portal. Soliciting or accepting off-platform payments for listed events is strictly prohibited.</li>
              <li><strong className="text-[var(--text-primary)]">Deliverable Fulfillment:</strong> Event listers agree to fulfill all promised activation perks (branding, booth spaces, signage, attendee access, digital mentions) as stated in their package descriptions for confirmed brand sponsors.</li>
              <li><strong className="text-[var(--text-primary)]">Acceptance of Terms:</strong> You must read and accept the Event Listing Terms & Conditions displayed before creating each listing.</li>
            </ul>
          </Section>

          <Section title="5. Campaigns, Gigs, and Escrow Transactions" icon={<CreditCard className="w-4 h-4" />}>
            <p>
              ABC Rally facilitates contracts, campaigns, and gigs between brands, creators, and associations. Our transaction system operates as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">Campaign Offers:</strong> Brands may set budgets and offer sponsorships or gigs. Creators or associations can apply or negotiate terms through the proposal system.</li>
              <li><strong className="text-[var(--text-primary)]">Escrow Payment:</strong> Upon contract agreement, the brand funds the budget. The funds are held securely in a digital escrow system powered by Paystack until the deliverables are completed and verified.</li>
              <li><strong className="text-[var(--text-primary)]">Deliverables & Releases:</strong> Funds are released to the creator or association wallet once the brand approves the completed deliverables, or when a pre-arranged milestone is met.</li>
              <li><strong className="text-[var(--text-primary)]">Disputes:</strong> If a brand or creator raises a dispute, the funds will remain in escrow until both parties reach an agreement or until ABC Rally's arbitration team resolves the dispute based on evidence of deliverables.</li>
            </ul>
          </Section>

          <Section title="6. Platform Fees and Financial Terms" icon={<Percent className="w-4 h-4" />}>
            <p>
              ABC Rally charges fees to maintain platform security, escrow services, and continuous operation:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">10% Platform Commission Fee:</strong> ABC Rally charges a 10% service fee on all successful sponsorship funds raised for listed events. This fee is automatically deducted from payouts to maintain platform security, escrow processing, and sponsor matching.</li>
              <li><strong className="text-[var(--text-primary)]">In-Platform Payment Policy:</strong> All sponsorship funds, brand contributions, and financial transactions for listed events must be processed exclusively via the ABC Rally secure payment portal. Soliciting or accepting off-platform payments for listed events is strictly prohibited and may result in account suspension.</li>
              <li><strong className="text-[var(--text-primary)]">Withdrawals:</strong> Creators and associations can withdraw cleared funds from their wallet to their registered bank account. Withdrawals are processed via Paystack and may carry standard processing fees.</li>
              <li><strong className="text-[var(--text-primary)]">Taxes:</strong> Users are solely responsible for calculating, reporting, and paying any taxes or statutory levies applicable to their earnings or spendings on ABC Rally.</li>
            </ul>
          </Section>

          <Section title="7. User Conduct and Acceptable Use" icon={<Ban className="w-4 h-4" />}>
            <p>You agree not to use the platform to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Violate any local, state, national, or international laws or regulations.</li>
              <li>Post false, misleading, defamatory, offensive, or infringing content.</li>
              <li>Circumvent ABC Rally's fee structures or escrow system by negotiating payments outside the platform for campaigns or events initiated on ABC Rally.</li>
              <li>Post fraudulent event listings with no intent to deliver on promised sponsorship activations.</li>
              <li>Deploy bots, spiders, crawlers, or scrapers to extract data or interact with our system.</li>
              <li>Harass, abuse, or spam other users with unsolicited marketing or malicious proposals.</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property Rights" icon={<Lock className="w-4 h-4" />}>
            <p>
              Ownership of intellectual property (IP) created during collaborations is determined as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-[var(--text-primary)]">User Content:</strong> You retain ownership of all content you upload or submit to the platform. By posting, you grant ABC Rally a non-exclusive, royalty-free, worldwide license to display your public profile, campaign reviews, event listings, and portfolio items to promote the platform.</li>
              <li><strong className="text-[var(--text-primary)]">Campaign Content:</strong> Unless otherwise agreed in the specific campaign contract, creators grant brands a non-exclusive, worldwide, royalty-free license to use, repost, and feature the promotional content for a period agreed upon in the project scope.</li>
              <li><strong className="text-[var(--text-primary)]">Platform IP:</strong> ABC Rally's logos, designs, source code, and assets are the exclusive property of ABC Rally Limited. You may not copy, reverse-engineer, or redistribute any of our materials without express written authorization.</li>
            </ul>
          </Section>

          <Section title="9. Account Termination & Suspension" icon={<AlertTriangle className="w-4 h-4" />}>
            <p>
              ABC Rally reserves the right to suspend, terminate, or restrict access to your account at our sole discretion, without prior notice, if:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>You violate these Terms of Service or our community guidelines.</li>
              <li>You engage in fraudulent, illicit, or abusive actions.</li>
              <li>You accept or solicit off-platform payments in violation of the in-platform payment policy.</li>
              <li>You post a fraudulent event listing or fail to deliver on confirmed sponsorship packages.</li>
              <li>Your association is determined to be non-existent or fraudulent.</li>
              <li>Your account is suspended by a platform administrator. Any remaining funds in your wallet may be held or refunded to the source depending on the nature of the suspension.</li>
            </ul>
          </Section>

          <Section title="10. Disclaimer of Warranties" icon={<AlertTriangle className="w-4 h-4" />}>
            <p>
              The platform and all services are provided on an "as-is" and "as-available" basis. ABC Rally makes no warranties,
              express or implied, regarding the reliability, availability, accuracy, or safety of the platform. We do not guarantee
              that campaigns will yield specific business results, or that creators/associations will perform contracts up to your satisfaction.
            </p>
          </Section>

          <Section title="11. Limitation of Liability" icon={<ShieldCheck className="w-4 h-4" />}>
            <p>
              To the maximum extent permitted by law, ABC Rally Limited, its directors, employees, and partners, shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or
              other intangible losses arising from your use of or inability to use the platform.
            </p>
            <p className="mt-2">
              In no event shall our total liability for all claims under this Agreement exceed the total fees paid by you to ABC Rally
              in the six (6) months preceding the event giving rise to the claim.
            </p>
          </Section>

          <Section title="12. Mandatory In-Platform Dispute Resolution & Governing Law" icon={<Scale className="w-4 h-4" />}>
            <p>
              Any disagreements, non-fulfillment of agreed sponsorship deliverables, or payment issues must be formally submitted and mediated through the <strong>ABC Rally Disputes System</strong> for official platform arbitration. You agree not to pursue legal remedies before first exhausting the in-platform dispute resolution process.
            </p>
            <p className="mt-2">
              These Terms and any dispute arising out of or in connection with them shall be governed by, and construed in accordance
              with, the laws of the Federal Republic of Nigeria. If an in-platform dispute cannot be resolved through internal mediation,
              it shall be referred to and finally resolved by arbitration in Lagos, Nigeria.
            </p>
          </Section>

          <Section title="13. Contact Information" icon={<Phone className="w-4 h-4" />}>
            <p>If you have any questions or feedback regarding these Terms, please reach out to us:</p>
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
              Read our Privacy Policy to understand how we collect and manage your personal data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('privacy')}
                className="px-8 py-3.5 bg-gradient-red text-white font-black rounded-2xl text-sm hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95 uppercase tracking-widest"
              >
                View Privacy Policy
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

export default TermsOfServicePage;
