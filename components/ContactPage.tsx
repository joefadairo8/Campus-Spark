import React from 'react';

const ContactPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-white min-h-screen">
      <section className="py-24 bg-spark-black text-white px-4 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-spark-red/5 skew-y-6 transform origin-bottom-right"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-6xl font-black mb-6">Let's <span className="text-spark-red">Connect</span>.</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">Have questions or want to partner with us? Our team is ready to help you spark something big.</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20">
            {/* Form */}
            <div className="bg-white p-10 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-red-50 border border-gray-100">
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-spark-black uppercase tracking-widest mb-3">Full Name</label>
                    <input type="text" className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-spark-black uppercase tracking-widest mb-3">Email Address</label>
                    <input type="email" className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold" placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-spark-black uppercase tracking-widest mb-3">Subject</label>
                  <select className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold appearance-none">
                    <option>Sponsorship Inquiry</option>
                    <option>Ambassador Program</option>
                    <option>Brand Collaboration</option>
                    <option>Technical Support</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-spark-black uppercase tracking-widest mb-3">Message</label>
                  <textarea rows={6} className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold resize-none" placeholder="Tell us more about your project..."></textarea>
                </div>
                <button type="submit" className="w-full bg-spark-red text-white font-black py-5 px-12 rounded-2xl text-xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">Send Message</button>
              </form>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <div className="space-y-12">
                <div>
                  <h3 className="text-sm font-black text-spark-red uppercase tracking-[0.3em] mb-4">Our Hub</h3>
                  <p className="text-3xl font-black text-spark-black leading-tight">Ikoyi, Lagos State,<br />Nigeria.</p>
                </div>
                <div>
                  <h3 className="text-sm font-black text-spark-red uppercase tracking-[0.3em] mb-4">Talk to Us</h3>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-spark-black">hello@campusspark.ng</p>
                    <p className="text-xl font-bold text-spark-black">+234 (0) 812 345 6789</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-spark-red uppercase tracking-[0.3em] mb-4">Follow Spark</h3>
                  <div className="flex gap-4">
                    {['Instagram', 'Twitter', 'LinkedIn'].map(social => (
                      <button key={social} className="bg-gray-50 px-6 py-3 rounded-xl font-bold text-spark-black hover:bg-spark-red hover:text-white transition-all">{social}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-20 p-8 bg-red-50 rounded-3xl border border-red-100">
                <h4 className="font-black text-spark-black mb-2">Frequently Asked?</h4>
                <p className="text-spark-gray mb-6">Check our FAQ for quick answers to common questions about Spark.</p>
                <button onClick={() => onNavigate('home')} className="text-spark-red font-black uppercase tracking-widest text-sm hover:underline">Go to FAQ →</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;