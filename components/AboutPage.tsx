import React from 'react';
import {
  Users, Handshake, Lightbulb, Target, Eye, ArrowRight,
  Building2, Star, Globe, CheckCircle2, ChevronRight, Megaphone
} from 'lucide-react';

const AboutPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const competencies = [
    {
      number: '01',
      icon: <Users className="w-7 h-7" />,
      title: 'Community Access',
      description:
        'We understand how to reach, organize, and activate student groups, youth communities, associations, and professional networks.',
      color: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-400',
    },
    {
      number: '02',
      icon: <Handshake className="w-7 h-7" />,
      title: 'Partnership Development',
      description:
        'We have experience designing partnership structures that connect public institutions, private organizations, brands, and community stakeholders.',
      color: 'from-spark-red/20 to-spark-red/10',
      border: 'border-spark-red/20',
      iconBg: 'bg-spark-red/10 text-spark-red',
    },
    {
      number: '03',
      icon: <Lightbulb className="w-7 h-7" />,
      title: 'Opportunity Creation',
      description:
        'We build platforms and programs that help people access visibility, income, sponsorships, internships, skills, campaigns, and growth opportunities.',
      color: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
  ];

  const domains = [
    'Education', 'Entrepreneurship', 'Workforce Development',
    'Campus Engagement', 'Innovation Programs', 'Institutional Partnerships',
    'Youth Community Mobilization', 'Brand Visibility', 'Public-Sector Collaboration',
    'Internship Placement',
  ];

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative py-28 md:py-36 overflow-hidden border-b border-[var(--border-color)]">
        {/* decorative blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50%] h-[70%] bg-spark-red/8 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-blue-500/6 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
          {/* grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(var(--text-primary) 1px,transparent 1px),linear-gradient(90deg,var(--text-primary) 1px,transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* eyebrow */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-spark-red/10 border border-spark-red/20 text-spark-red text-xs font-black uppercase tracking-widest mb-8">
            <Building2 className="w-3.5 h-3.5" />
            A Campus Himpact Hub Product
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[var(--text-primary)] leading-[1.05] mb-6">
            About{' '}
            <span className="text-spark-red relative">
              ABC-Rally
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                <path d="M2 6 Q75 2 150 5 Q225 8 298 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base md:text-lg text-[var(--text-secondary)] leading-relaxed font-medium">
            ABC-Rally is a product of <strong className="text-[var(--text-primary)] font-black">Campus Himpact Hub</strong> — an organization with practical experience in youth engagement, campus activation, internship placement, student community mobilization, public-sector collaboration, brand visibility projects, and partnership development.
          </p>
        </div>
      </section>

      {/* ── Our Story ────────────────────────────────────────────── */}
      <section className="py-24 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* left: text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-spark-red text-xs font-black uppercase tracking-widest">
                <div className="w-8 h-[2px] bg-spark-red" />
                Our Story
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">
                Built on Real Experience.<br />
                <span className="text-spark-red">Not Just an Idea.</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-base">
                Over the years, Campus Himpact Hub has worked across education, entrepreneurship, workforce development, campus engagement, innovation programs, and institutional partnership projects. This experience gives ABC-Rally a strong foundation in understanding how brands, young people, creators, associations, and communities can be organized into meaningful opportunities.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed text-base">
                ABC-Rally was created from this experience. It is not just a platform; it is a structured ecosystem built to make collaboration easier, safer, and more rewarding for brands, creators, associations, and communities.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed text-base font-semibold text-[var(--text-primary)]">
                Our goal is simple: to rally Nigeria's creative economy by helping brands find the right people, creators access paid opportunities, and communities unlock sponsorship and partnership value.
              </p>
            </div>

            {/* right: domain tags */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-spark-red/5 to-blue-500/5 rounded-[3rem]" />
              <div className="relative p-8 md:p-10 rounded-[3rem] border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-6">
                  Areas of Experience
                </p>
                <div className="flex flex-wrap gap-3">
                  {domains.map((domain) => (
                    <span
                      key={domain}
                      className="px-4 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm font-bold text-[var(--text-secondary)] hover:border-spark-red hover:text-spark-red transition-colors duration-200"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Competencies ────────────────────────────────────── */}
      <section className="py-24 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-spark-red text-xs font-black uppercase tracking-widest mb-4">
              <div className="w-8 h-[2px] bg-spark-red" />
              What We're Built On
              <div className="w-8 h-[2px] bg-spark-red" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
              Our Core Competencies
            </h2>
            <p className="max-w-2xl mx-auto text-[var(--text-secondary)] text-base leading-relaxed">
              Our competency is built on three major strengths that inform everything we build.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {competencies.map((c) => (
              <div
                key={c.number}
                className={`relative group rounded-[2.5rem] border ${c.border} p-8 bg-gradient-to-br ${c.color} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}
              >
                {/* large bg number */}
                <div className="absolute top-6 right-8 text-7xl font-black text-[var(--border-color)] select-none leading-none">
                  {c.number}
                </div>

                <div className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center mb-6 relative z-10`}>
                  {c.icon}
                </div>

                <h3 className="text-xl font-black text-[var(--text-primary)] mb-3 relative z-10">
                  {c.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed relative z-10">
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ─────────────────────────────────────── */}
      <section className="py-24 border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Mission */}
            <div className="relative overflow-hidden rounded-[3rem] border border-spark-red/20 bg-gradient-to-br from-spark-red/10 to-transparent p-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-spark-red/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-spark-red/10 border border-spark-red/20 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-spark-red" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-spark-red mb-3">Mission</p>
                <h3 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-tight mb-4">
                  Collaborate.<br />Earn.<br />Grow.
                </h3>
                <p className="text-[var(--text-secondary)] text-base leading-relaxed">
                  To help brands, creators, and communities collaborate, earn, and grow.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="relative overflow-hidden rounded-[3rem] border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                  <Eye className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-3">Vision</p>
                <h3 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-tight mb-4">
                  Africa's Creative<br />Collaboration<br />Economy.
                </h3>
                <p className="text-[var(--text-secondary)] text-base leading-relaxed">
                  To lead Africa's creative collaboration economy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who We Serve ─────────────────────────────────────────── */}
      <section className="py-24 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-3">
              Built For Everyone in the Creative Economy
            </h2>
            <p className="text-[var(--text-secondary)] text-base">
              ABC-Rally brings together the key players that power Nigeria's creative and campus economy.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Megaphone className="w-6 h-6" />,
                label: 'Brands',
                desc: 'Launch campaigns, hire verified creators, sponsor events and partner with associations.',
                page: 'for-brands',
                color: 'text-spark-red',
                bg: 'bg-spark-red/10',
                border: 'hover:border-spark-red/40',
              },
              {
                icon: <Star className="w-6 h-6" />,
                label: 'Creators',
                desc: 'Discover gigs, apply for campaigns, collaborate on tasks, and get paid securely.',
                page: 'for-creators',
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
                border: 'hover:border-amber-400/40',
              },
              {
                icon: <Globe className="w-6 h-6" />,
                label: 'Associations',
                desc: 'List events, set sponsorship targets, receive proposals, and turn your audience into real value.',
                page: 'for-associations',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
                border: 'hover:border-blue-400/40',
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.page)}
                className={`group text-left p-8 rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] ${item.border} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-5`}>
                  {item.icon}
                </div>
                <h3 className={`text-lg font-black ${item.color} mb-2`}>{item.label}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">{item.desc}</p>
                <div className={`flex items-center gap-1 text-xs font-black uppercase tracking-widest ${item.color} group-hover:gap-2 transition-all`}>
                  Learn More <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative overflow-hidden rounded-[3rem] border border-spark-red/20 bg-gradient-to-br from-spark-red/10 via-[var(--bg-secondary)] to-blue-500/10 p-12 md:p-16">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-spark-red/10 rounded-full blur-3xl" />
            </div>

            <div className="flex justify-center mb-6">
              <div className="flex -space-x-2">
                {['🎯', '🤝', '💡'].map((e, i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] flex items-center justify-center text-lg shadow">
                    {e}
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-4">
              Ready to Rally?
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-8 max-w-xl mx-auto">
              Join the ecosystem that's connecting brands, creators, and communities across Nigeria.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('create-account')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-spark-red text-white font-black text-sm hover:bg-red-700 shadow-xl shadow-spark-red/25 transition-all active:scale-95"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-black text-sm hover:border-spark-red hover:text-spark-red transition-all"
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

export default AboutPage;
