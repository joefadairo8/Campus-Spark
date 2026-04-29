import React from 'react';

const ContactPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-[var(--bg-primary)] min-h-screen">
      <section className="py-24 px-4 text-center relative overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-fancy font-black mb-6 tracking-tighter text-[var(--text-primary)]">
            Let's <span className="text-gradient-red italic">Connect</span>.
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">Have questions or want to partner? Our team is ready to help you spark something big.</p>
        </div>
      </section>

      <section className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div className="bg-[var(--bg-primary)] p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border-color)] card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3">Full Name</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-spark-red/5 border border-[var(--border-color)] rounded-xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold text-sm text-[var(--text-primary)]" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3">Email Address</label>
                    <input type="email" className="w-full px-5 py-3.5 bg-spark-red/5 border border-[var(--border-color)] rounded-xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold text-sm text-[var(--text-primary)]" placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3">Subject</label>
                  <select className="w-full px-5 py-3.5 bg-spark-red/5 border border-[var(--border-color)] rounded-xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold text-sm text-[var(--text-primary)] appearance-none">
                    <option>Sponsorship Inquiry</option>
                    <option>Ambassador Program</option>
                    <option>Brand Collaboration</option>
                    <option>Technical Support</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3">Message</label>
                  <textarea rows={5} className="w-full px-5 py-3.5 bg-spark-red/5 border border-[var(--border-color)] rounded-xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold text-sm text-[var(--text-primary)] resize-none" placeholder="Tell us more..."></textarea>
                </div>
                <button type="submit" className="w-full bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95">Send Message</button>
              </form>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <div className="space-y-12">
                <div>
                  <h3 className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-4">Our Hub</h3>
                  <p className="text-xl md:text-2xl font-fancy font-black text-[var(--text-primary)] leading-tight">Ikoyi, Lagos State,<br />Nigeria.</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-4">Talk to Us</h3>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-[var(--text-primary)]">hello@campusspark.ng</p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">+234 (0) 812 345 6789</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-4">Follow Spark</h3>
                  <div className="flex flex-wrap gap-3">
                    {['Instagram', 'Twitter', 'LinkedIn'].map(social => (
                      <button key={social} className="bg-spark-black text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-spark-red transition-all">{social}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-16 p-8 bg-spark-red/5 rounded-3xl border border-spark-red/10">
                <h4 className="font-bold text-[var(--text-primary)] mb-2">Frequently Asked?</h4>
                <p className="text-[var(--text-secondary)] mb-6 text-sm font-medium">Check our FAQ for quick answers to common questions about Spark.</p>
                <button onClick={() => onNavigate('home')} className="text-spark-red font-black uppercase tracking-[0.2em] text-[10px] hover:underline">Go to FAQ →</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;