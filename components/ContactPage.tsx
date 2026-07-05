import React, { useState, useRef } from 'react';
import { 
  Mail, Phone, MapPin, MessageSquare, Shield, HelpCircle, 
  FileText, ArrowRight, Clock, UserCheck, Megaphone, Users, 
  Building2, Landmark, HelpCircleIcon, HeartHandshake, Laptop, 
  AlertTriangle, Upload, CheckCircle2, Video, Info
} from 'lucide-react';

const ContactPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: 'Creator',
    organisation: '',
    enquiryType: 'general',
    message: '',
    callbackTime: 'anytime',
  });

  const [fileName, setFileName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = (type: string) => {
    setFormData(prev => ({ ...prev, enquiryType: type }));
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setIsSubmitted(true);
      // Reset form (except file name which gets cleared)
      setFormData({
        name: '',
        email: '',
        phone: '',
        userType: 'Creator',
        organisation: '',
        enquiryType: 'general',
        message: '',
        callbackTime: 'anytime',
      });
      setFileName('');
    }, 1500);
  };

  const ROUTING_CARDS = [
    { id: 'brand-campaign', title: 'Brand Campaign Enquiry', icon: <Megaphone className="w-5 h-5" />, desc: 'Partner with creators or set up campaigns.' },
    { id: 'creator-support', title: 'Creator Support', icon: <Users className="w-5 h-5" />, desc: 'Help with profile, gigs, or payments.' },
    { id: 'association-onboarding', title: 'Association Onboarding', icon: <Landmark className="w-5 h-5" />, desc: 'Register your society or union.' },
    { id: 'event-sponsorship', title: 'Event Sponsorship', icon: <HeartHandshake className="w-5 h-5" />, desc: 'Sponsorship funding or listing events.' },
    { id: 'partnership-demo', title: 'Partnership / Demo', icon: <Laptop className="w-5 h-5" />, desc: 'Explore corporate partnerships.' },
    { id: 'technical-support', title: 'Technical & Payment', icon: <AlertTriangle className="w-5 h-5" />, desc: 'Wallet disputes, bugs, or account issues.' },
    { id: 'press-media', title: 'Press & Media', icon: <FileText className="w-5 h-5" />, desc: 'Interviews, PR, and press kits.' },
    { id: 'general', title: 'General Enquiry', icon: <HelpCircleIcon className="w-5 h-5" />, desc: 'Any other questions or feedback.' },
  ];

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans text-[var(--text-primary)]">
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 overflow-hidden border-b border-[var(--border-color)] text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-spark-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Contact ABC-Rally
          </div>
          <h1 className="text-3xl md:text-5xl font-fancy font-black tracking-tighter leading-[1.1] mb-6 text-[var(--text-primary)]">
            How Can We <span className="text-gradient-red italic">Help You?</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] mb-4 leading-relaxed max-w-2xl mx-auto font-medium">
            Select an enquiry category below to route your message to the right department, or use the form below to reach out directly.
          </p>
        </div>
      </section>

      {/* Routing Cards Grid */}
      <section className="py-12 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ROUTING_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`p-6 text-left rounded-2xl border transition-all duration-300 flex flex-col justify-between h-40 ${
                  formData.enquiryType === card.id
                    ? 'bg-spark-black text-white border-spark-red shadow-lg shadow-spark-red/10'
                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-spark-red/50 hover:shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  formData.enquiryType === card.id ? 'bg-spark-red text-white' : 'bg-spark-red/10 text-spark-red'
                }`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-bold text-xs mb-1 line-clamp-1">{card.title}</h3>
                  <p className={`text-[10px] font-medium leading-tight line-clamp-2 ${
                    formData.enquiryType === card.id ? 'text-gray-300' : 'text-[var(--text-secondary)]'
                  }`}>
                    {card.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Section: Form & Info Column */}
      <section ref={formSectionRef} className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Form Column */}
            <div className="lg:col-span-7 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 sm:p-10 shadow-lg relative overflow-hidden">
              {isSubmitted ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Enquiry Sent!</h3>
                  <p className="text-[var(--text-secondary)] text-sm font-medium max-w-sm">
                    Thank you for contacting ABC-Rally. We have routed your query to the correct department and our representative will get back to you shortly.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-6 text-xs font-black text-spark-red hover:underline uppercase tracking-wider"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Send Us a Message</h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Phone/WhatsApp */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+234 (0) 906 000 0000"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    {/* User Type */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">User Type</label>
                      <select
                        name="userType"
                        value={formData.userType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)]"
                      >
                        <option value="Creator">Creator / Influencer</option>
                        <option value="Brand">Brand / Advertiser</option>
                        <option value="Association">Association / Club Lead</option>
                        <option value="Other">Other / Individual</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Organisation */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Organisation (Optional)</label>
                      <input
                        type="text"
                        name="organisation"
                        placeholder="Company or School Association"
                        value={formData.organisation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    {/* Enquiry Type */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Enquiry Category</label>
                      <select
                        name="enquiryType"
                        value={formData.enquiryType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)]"
                      >
                        <option value="brand-campaign">Brand Campaign Enquiry</option>
                        <option value="creator-support">Creator Support</option>
                        <option value="association-onboarding">Association Onboarding</option>
                        <option value="event-sponsorship">Event Sponsorship</option>
                        <option value="partnership-demo">Partnership / Demo</option>
                        <option value="technical-support">Technical &amp; Payment Support</option>
                        <option value="press-media">Press &amp; Media</option>
                        <option value="general">General Enquiry</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Tell us how we can help you..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)] resize-none"
                    ></textarea>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Callback Time */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Preferred Callback Time</label>
                      <select
                        name="callbackTime"
                        value={formData.callbackTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-spark-red font-bold text-xs text-[var(--text-primary)]"
                      >
                        <option value="anytime">Anytime (During Working Hours)</option>
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                        <option value="evening">Evening (4 PM - 7 PM)</option>
                      </select>
                    </div>

                    {/* Attachment Upload */}
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Attach Document (Optional)</label>
                      <div className="relative">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between text-xs text-[var(--text-secondary)] font-bold focus:outline-none hover:border-spark-red transition-all"
                        >
                          <span className="truncate">{fileName || 'Choose file...'}</span>
                          <Upload className="w-4 h-4 text-spark-red flex-shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-red text-white font-bold py-4 rounded-xl text-sm shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Enquiry...' : 'Send Enquiry'}
                  </button>
                </form>
              )}
            </div>

            {/* Info Column */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-10">
              {/* Direct contacts info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-3">Our Office</h3>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-spark-red mt-1 flex-shrink-0" />
                    <p className="text-base md:text-lg font-fancy font-black text-[var(--text-primary)] leading-tight">
                      42, Olowu Street, off Mobolaji Bank Anthony Road,<br />
                      Ikeja, Lagos State, Nigeria.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-3">Direct Contacts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-spark-red flex-shrink-0" />
                      <p className="text-base font-bold text-[var(--text-primary)]">hello@abc-rally.com</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-spark-red flex-shrink-0" />
                      <p className="text-base font-bold text-[var(--text-primary)]">+234 (0) 906 032 0863</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-3">Follow ABC-Rally</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Instagram', 'Twitter', 'LinkedIn'].map(social => (
                      <button 
                        key={social} 
                        className="bg-spark-black text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-spark-red transition-all border border-white/5"
                        onClick={() => window.open('#', '_blank')}
                      >
                        {social}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust/Support Policy links card */}
              <div className="p-8 bg-spark-red/5 rounded-[2rem] border border-spark-red/10 space-y-4">
                <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-spark-red" />
                  Policy &amp; Support Hub
                </h4>
                <p className="text-[var(--text-secondary)] text-xs font-semibold leading-relaxed mb-2">
                  Need quick documents or dispute assistance? Check our resources below:
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs font-bold">
                  {[
                    { label: 'Frequently Asked Questions', target: 'home', icon: <HelpCircle className="w-4 h-4 text-spark-red" /> },
                    { label: 'Wallet & Payment Policy', target: 'pricing', icon: <FileText className="w-4 h-4 text-spark-red" /> },
                    { label: 'Organiser Verification Policy', target: 'help', icon: <UserCheck className="w-4 h-4 text-spark-red" /> },
                    { label: 'Dispute & Resolution Policy', target: 'help', icon: <Shield className="w-4 h-4 text-spark-red" /> },
                    { label: 'Knowledge Base & Help Center', target: 'help', icon: <Info className="w-4 h-4 text-spark-red" /> },
                  ].map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => onNavigate(link.target)}
                      className="flex items-center gap-3 py-2 text-[var(--text-secondary)] hover:text-spark-red transition-all text-left"
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Book Demo Booking CTA */}
      <section className="py-20 bg-[var(--bg-secondary)] text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-10 md:p-12 bg-spark-black text-white rounded-[2.5rem] relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-spark-red/10 rounded-full blur-3xl -z-0" />
            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-fancy font-black mb-3 text-white">Want to See How ABC-Rally Works?</h2>
              <p className="text-gray-400 font-medium mb-8 text-sm">
                Schedule a 15-minute live demo with our partnerships team. We will walk you through launching campaigns, hiring creators, and securing event sponsorship.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-transparent border border-white/20 text-white font-bold py-3 px-8 rounded-xl text-sm hover:bg-white/10 transition-all active:scale-95"
                >
                  Send Enquiry
                </button>
                <button
                  onClick={() => onNavigate('schedule-call')}
                  className="bg-gradient-red text-white font-bold py-3 px-8 rounded-xl text-sm hover:shadow-lg hover:shadow-spark-red/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Video className="w-4 h-4" /> Book Live Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
