import React from 'react';
import {
  Users, Wallet, Briefcase, Shield, CheckCircle2, ArrowRight,
  MessageSquare, Star, Sparkles, UserCheck, Video, Camera,
  FileText, Award, BadgeAlert, Layers, Target, Compass
} from 'lucide-react';

const CreatorsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const handleStart = () => {
    localStorage.setItem('preselectedRole', 'Creator');
    onNavigate('create-account');
  };

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans text-[var(--text-primary)]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-24 border-b border-[var(--border-color)] text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-spark-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            For Creators &amp; Influencers
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-fancy font-black tracking-tighter leading-[1.1] mb-6 text-[var(--text-primary)]">
            Get Discovered. Get Hired.<br />
            <span className="text-gradient-red italic">Get Paid.</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
            Turn your creativity, influence, skills, and portfolio into paid brand campaigns, event gigs, and collaboration opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStart}
              className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Create Creator Profile <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('careers')}
              className="bg-transparent border-2 border-spark-red text-spark-red font-bold py-4 px-10 rounded-2xl text-base hover:bg-spark-red/5 transition-all active:scale-95"
            >
              Browse Opportunities
            </button>
          </div>
        </div>
      </section>

      {/* ── Choose Your Path ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Paths to Participate
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
              Choose Your <span className="text-gradient-red italic">Role</span>
            </h2>
            <p className="text-base text-[var(--text-secondary)] font-medium">
              Whether your strength is on the field, behind the camera, or on the stage, ABC-Rally has a path for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {/* Campus Creator Card */}
            <div className="bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
              <div className="h-2 bg-spark-red"></div>
              <div className="p-8 flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors">Campus Creator</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium leading-relaxed">
                    Become the face of premium brands on your campus. Connect companies directly to student communities.
                  </p>
                  <ul className="space-y-3 mb-10 text-[var(--text-secondary)] font-semibold text-xs">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Organize meetups &amp; activations</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Distribute swag &amp; merch</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Drive signups &amp; app downloads</li>
                  </ul>
                </div>
                <button
                  onClick={handleStart}
                  className="w-full text-center bg-spark-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all text-sm active:scale-95"
                >
                  Join as Campus Creator
                </button>
              </div>
            </div>

            {/* Content Creator Card */}
            <div className="bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
              <div className="h-2 bg-[var(--text-primary)] opacity-20"></div>
              <div className="p-8 flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors">Content Creator</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium leading-relaxed">
                    Monetize your social media audience and creative skills with paid sponsorship campaigns.
                  </p>
                  <ul className="space-y-3 mb-10 text-[var(--text-secondary)] font-semibold text-xs">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Create sponsored videos &amp; posts</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Promote custom discount codes</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Generate launch buzz &amp; user reviews</li>
                  </ul>
                </div>
                <button
                  onClick={handleStart}
                  className="w-full text-center bg-spark-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all text-sm active:scale-95"
                >
                  Join as Content Creator
                </button>
              </div>
            </div>

            {/* Event Talent & Gig Creator Card */}
            <div className="bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
              <div className="h-2 bg-[var(--text-secondary)] opacity-10"></div>
              <div className="p-8 flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors">Event Talent &amp; Gig Creator</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium leading-relaxed">
                    Provide real, hands-on value at physical events and local promotional projects.
                  </p>
                  <ul className="space-y-3 mb-10 text-[var(--text-secondary)] font-semibold text-xs">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>MCs, DJs, photographers &amp; videographers</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Event ushers, hosts &amp; hospitality staff</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Brand ambassadors &amp; activation crew</li>
                  </ul>
                </div>
                <button
                  onClick={handleStart}
                  className="w-full text-center bg-spark-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all text-sm active:scale-95"
                >
                  Join as Event Talent
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who It Is For ── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Who It Is For
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
            Built for Nigeria's Diverse <span className="text-gradient-red italic">Creative Class</span>
          </h2>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            ABC-Rally connects a wide spectrum of creative and activation talent to brands that need their unique energy and skills.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Content Creators', icon: <Sparkles className="w-5 h-5" /> },
              { label: 'Influencers', icon: <Users className="w-5 h-5" /> },
              { label: 'Photographers', icon: <Camera className="w-5 h-5" /> },
              { label: 'Videographers', icon: <Video className="w-5 h-5" /> },
              { label: 'Graphic Designers', icon: <Layers className="w-5 h-5" /> },
              { label: 'Event MCs & Hosts', icon: <UserCheck className="w-5 h-5" /> },
              { label: 'Campus Ambassadors', icon: <Compass className="w-5 h-5" /> },
              { label: 'Social Media Managers', icon: <FileText className="w-5 h-5" /> },
              { label: 'Brand Activation Crew', icon: <Target className="w-5 h-5" /> },
              { label: 'Local Talent', icon: <Award className="w-5 h-5" /> },
            ].map((role, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl hover:border-spark-red/30 transition-all duration-300">
                <div className="text-spark-red mb-3 bg-spark-red/10 p-2.5 rounded-xl">{role.icon}</div>
                <span className="text-xs font-bold text-[var(--text-primary)]">{role.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Key Benefits
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
            Why Creators Work <span className="text-gradient-red italic">Through Us</span>
          </h2>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            We take the friction out of pitching, negotiating, and tracking brand deals so you can focus entirely on delivering outstanding work.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { icon: <Compass className="w-6 h-6" />, title: 'Discover Gigs', desc: 'Find open roles tailored to your exact skills and campus location.' },
              { icon: <FileText className="w-6 h-6" />, title: 'Apply for Campaigns', desc: 'Send structured campaign bids directly to verified brands looking for talent.' },
              { icon: <MessageSquare className="w-6 h-6" />, title: 'Receive Direct Invites', desc: 'Brands looking for your profile can invite you directly for private custom gigs.' },
              { icon: <Users className="w-6 h-6" />, title: 'Seamless Collaboration', desc: 'Access brief details, communication channels, and guidelines in one secure space.' },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: 'Submit Securely', desc: 'Upload proof of deliverables directly inside your creator dashboard.' },
              { icon: <Wallet className="w-6 h-6" />, title: 'Get Paid on Time', desc: 'No more chasing brands. Funds are locked in escrow and paid out as soon as work is approved.' },
              { icon: <Star className="w-6 h-6" />, title: 'Build Ratings', desc: 'Earn top ratings and feedback to rank higher in the creator directory search results.' },
              { icon: <Award className="w-6 h-6" />, title: 'Professional Portfolio', desc: 'A beautiful profile showcasing your campaign statistics and history for brands to see.' },
            ].map((benefit, i) => (
              <div key={i} className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] group card-hover transition-all duration-300">
                <div className="w-11 h-11 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red mb-4 group-hover:scale-105 transition-transform">{benefit.icon}</div>
                <h3 className="text-sm font-black text-[var(--text-primary)] mb-2">{benefit.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            The Process
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            Your Blueprint to <span className="text-gradient-red italic">Success</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              { step: '01', title: 'Create Profile', desc: 'Set up your professional portfolio and showcase your past work and social metrics.' },
              { step: '02', title: 'Upload Portfolio', desc: 'Connect your socials, upload media, and define your creative skills and interests.' },
              { step: '03', title: 'Browse & Apply', desc: 'Search and apply for active campaigns, event sponsorships, and specific event gigs.' },
              { step: '04', title: 'Receive Brief', desc: 'Get clear directions, instructions, and timelines directly from verified brands or associations.' },
              { step: '05', title: 'Deliver Work', desc: 'Collaborate, execute tasks, and submit verification of your deliverables through the portal.' },
              { step: '06', title: 'Get Approved & Paid', desc: 'Receive your payout immediately in your wallet once milestones are completed and approved.' },
            ].map((s, i) => (
              <div key={i} className="p-8 bg-[var(--bg-secondary)] rounded-[2rem] border border-[var(--border-color)] flex flex-col gap-4 relative overflow-hidden group hover:border-spark-red/30 transition-all duration-300">
                <div className="absolute top-4 right-6 text-5xl font-black text-spark-red/5 group-hover:text-spark-red/10 transition-colors">{s.step}</div>
                <div className="w-10 h-10 rounded-xl bg-spark-red text-white font-black text-sm flex items-center justify-center shadow-lg shadow-spark-red/20">{s.step}</div>
                <h3 className="font-black text-sm text-[var(--text-primary)] mt-2">{s.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Section ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Trust &amp; Security
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            Safe. Secure. <span className="text-gradient-red italic">Guaranteed.</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 text-left">
            {[
              { icon: <UserCheck className="w-5 h-5" />, title: 'Verified Brands Only', desc: 'Every brand listing is thoroughly verified for security and authenticity.' },
              { icon: <Wallet className="w-5 h-5" />, title: 'Escrow-Funded Tasks', desc: 'Payouts are deposited in escrow before you start, guaranteeing payment.' },
              { icon: <CheckCircle2 className="w-5 h-5" />, title: 'Clear Revision Steps', desc: 'Standardized review guidelines to avoid endless changes.' },
              { icon: <Shield className="w-5 h-5" />, title: 'Guaranteed Payouts', desc: 'Withdraw earnings immediately after project approval.' },
              { icon: <BadgeAlert className="w-5 h-5" />, title: 'Dispute Channel', desc: 'Dedicated support team ready to resolve issues fairly and quickly.' },
            ].map((t, i) => (
              <div key={i} className="p-6 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] flex flex-col gap-4">
                <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red">{t.icon}</div>
                <h3 className="font-black text-xs text-[var(--text-primary)] leading-tight">{t.title}</h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="p-12 bg-spark-black rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-spark-red/10 rounded-full blur-3xl -z-0" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-4">Start Earning</p>
              <h2 className="text-3xl md:text-4xl font-fancy font-black mb-4">Ready to Monetize Your Talents?</h2>
              <p className="text-gray-400 font-medium mb-10 max-w-xl mx-auto text-sm">
                Set up your creator profile, link your portfolios, and unlock access to paid gigs and sponsored campaigns on campuses and cities across Nigeria.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStart}
                  className="bg-gradient-red text-white font-black py-4 px-10 rounded-2xl hover:shadow-2xl hover:shadow-spark-red/30 transition-all active:scale-95"
                >
                  Create Creator Profile
                </button>
                <button
                  onClick={() => onNavigate('careers')}
                  className="bg-white/10 text-white font-bold py-4 px-10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                >
                  Browse Opportunities
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreatorsPage;
