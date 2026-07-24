import React, { useState } from 'react';
import { Sparkles, Layers, MessageSquare, Target, Check, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { db, doc, setDoc } from '../firebase';

interface CreatorOnboardingModalProps {
  userId: string;
  existingProfile?: any;
  onComplete: (updatedProfile: any) => void;
}

export const CAPABILITY_OPTIONS = [
  {
    id: 'Create',
    title: 'Create',
    description: 'I create content or campaign materials.',
    icon: Sparkles,
    services: [
      'Content Writer',
      'Copywriter',
      'Graphic Designer',
      'Photographer',
      'Videographer',
      'Video Editor',
      'UGC Creator',
      'Voice-over Artist',
      'Animator',
      'Presenter/Host',
      'Podcaster'
    ]
  },
  {
    id: 'Manage',
    title: 'Manage',
    description: 'I manage communication, communities or campaigns.',
    icon: Layers,
    services: [
      'Social Media Manager',
      'Community Manager',
      'Email Marketer',
      'Digital Marketer',
      'Content Strategist',
      'Campaign Manager',
      'Influencer Campaign Manager',
      'Public Relations/Publicity',
      'Brand Strategist'
    ]
  },
  {
    id: 'Distribute',
    title: 'Distribute',
    description: 'I own or manage a media platform or audience.',
    icon: MessageSquare,
    services: [
      'WhatsApp Status TV',
      'WhatsApp Channel',
      'Campus Media Page',
      'Social Media Community Page',
      'Newsletter',
      'Podcast/Online Radio',
      'Telegram or Community Broadcast Platform'
    ]
  },
  {
    id: 'Activate',
    title: 'Activate',
    description: 'I execute events, mobilisation or physical campaigns.',
    icon: Target,
    services: [
      'Campus Mobiliser',
      'Event Host/MC',
      'Brand Activation Representative',
      'Event Support Personnel',
      'Field Campaign Supervisor',
      'Product Demonstrator',
      'Ticket/Event Promoter'
    ]
  }
];

export const CreatorOnboardingModal: React.FC<CreatorOnboardingModalProps> = ({
  userId,
  existingProfile,
  onComplete
}) => {
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(
    existingProfile?.capabilities || []
  );
  const [primaryCapability, setPrimaryCapability] = useState<string>(
    existingProfile?.primaryCapability || ''
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    existingProfile?.services || existingProfile?.skills || []
  );
  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const toggleCapability = (capId: string) => {
    setError('');
    let updated: string[];
    if (selectedCapabilities.includes(capId)) {
      updated = selectedCapabilities.filter(c => c !== capId);
    } else {
      updated = [...selectedCapabilities, capId];
    }
    setSelectedCapabilities(updated);

    // Auto set or adjust primary capability
    if (updated.length === 1) {
      setPrimaryCapability(updated[0]);
    } else if (!updated.includes(primaryCapability)) {
      setPrimaryCapability(updated[0] || '');
    }
  };

  const toggleService = (serviceName: string) => {
    setError('');
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
    }
  };

  const handleNextStep = () => {
    if (selectedCapabilities.length === 0) {
      setError('Please select at least one capability to continue.');
      return;
    }
    const primary = primaryCapability || selectedCapabilities[0];
    setPrimaryCapability(primary);
    setStep(2);
    setError('');
  };

  const handleFinish = async () => {
    if (selectedCapabilities.length === 0) {
      setError('Please select at least one capability.');
      setStep(1);
      return;
    }
    if (selectedServices.length === 0) {
      setError('Please select at least one service or skill to complete setup.');
      return;
    }

    setSaving(true);
    setError('');

    const activePrimary = primaryCapability || selectedCapabilities[0];
    const updatePayload = {
      capabilities: selectedCapabilities,
      primaryCapability: activePrimary,
      services: selectedServices,
      skills: selectedServices, // Legacy compatibility
      onboardingCompleted: true,
      onboardedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', userId), updatePayload, { merge: true });
      const merged = { ...existingProfile, ...updatePayload };
      onComplete(merged);
    } catch (err: any) {
      console.error('Failed to save onboarding selections:', err);
      setError('Failed to save selections. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // Get list of available services based on chosen capabilities
  const availableServices = CAPABILITY_OPTIONS
    .filter(cap => selectedCapabilities.includes(cap.id))
    .flatMap(cap => cap.services.map(s => ({ service: s, capTitle: cap.title })));

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] p-6 sm:p-10 max-w-2xl w-full shadow-2xl relative my-auto animate-in fade-in zoom-in-95">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-spark-red/10 text-spark-red font-black text-xs flex items-center justify-center">
              0{step}
            </span>
            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
              {step === 1 ? 'Capability Classification' : 'Services & Skills'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className={`w-8 h-1.5 rounded-full transition-all ${step === 1 ? 'bg-spark-red' : 'bg-spark-red/20'}`} />
            <div className={`w-8 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-spark-red' : 'bg-spark-red/20'}`} />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        {/* ── STEP 1: CAPABILITY SELECTION ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em] bg-spark-red/5 border border-spark-red/10 px-3 py-1 rounded-full">
                First-Time Onboarding
              </span>
              <h2 className="text-2xl sm:text-3xl font-fancy font-black text-[var(--text-primary)] mt-3">
                How do you help brands and communities?
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                Select all capabilities that apply to your work. (At least 1 required)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAPABILITY_OPTIONS.map(opt => {
                const isSelected = selectedCapabilities.includes(opt.id);
                const IconComponent = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleCapability(opt.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-spark-red/5 border-spark-red ring-2 ring-spark-red/20 shadow-lg shadow-spark-red/5'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-spark-red/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-spark-red text-white' : 'bg-spark-red/10 text-spark-red'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-spark-red border-spark-red text-white' : 'border-gray-400'}`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-1">
                        {opt.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Primary Capability Selector if multiple capabilities chosen */}
            {selectedCapabilities.length > 1 && (
              <div className="p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl space-y-3">
                <label className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider block">
                  Select your Primary Capability:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCapabilities.map(capId => (
                    <button
                      key={capId}
                      type="button"
                      onClick={() => setPrimaryCapability(capId)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        (primaryCapability || selectedCapabilities[0]) === capId
                          ? 'bg-spark-red text-white shadow-md'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-spark-red/30'
                      }`}
                    >
                      {capId} {(primaryCapability || selectedCapabilities[0]) === capId && ' (Primary)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                disabled={selectedCapabilities.length === 0}
                className="bg-gradient-red text-white font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                Next: Select Services <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SERVICE SELECTION ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em] bg-spark-red/5 border border-spark-red/10 px-3 py-1 rounded-full">
                Step 2 of 2
              </span>
              <h2 className="text-2xl sm:text-3xl font-fancy font-black text-[var(--text-primary)] mt-3">
                Select your specific services
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                Choose the services you offer to brands and associations. (At least 1 required)
              </p>
            </div>

            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-4">
              {selectedCapabilities.map(capId => {
                const capObj = CAPABILITY_OPTIONS.find(c => c.id === capId);
                if (!capObj) return null;
                return (
                  <div key={capId} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl">
                    <h4 className="text-xs font-black text-spark-red uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5" /> {capObj.title} Services
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {capObj.services.map(service => {
                        const isChecked = selectedServices.includes(service);
                        return (
                          <div
                            key={service}
                            onClick={() => toggleService(service)}
                            className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                              isChecked
                                ? 'bg-spark-red/10 border-spark-red text-[var(--text-primary)] font-bold'
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-spark-red/30'
                            }`}
                          >
                            <span>{service}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isChecked ? 'bg-spark-red border-spark-red text-white' : 'border-gray-400'}`}>
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-spark-red transition-colors"
              >
                ← Back to Capabilities
              </button>

              <button
                type="button"
                onClick={handleFinish}
                disabled={saving || selectedServices.length === 0}
                className="bg-gradient-red text-white font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                {saving ? 'Saving...' : 'Continue to Profile'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
