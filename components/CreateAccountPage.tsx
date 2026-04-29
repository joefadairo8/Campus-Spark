
import React, { useState } from 'react';
import { auth, db, createUserWithEmailAndPassword, doc, setDoc } from '../firebase';
import { SparkIcon } from '../constants';
import { UserRole } from '../types';

const ProgressIndicator: React.FC<{ step: number; color: string; shadow: string }> = ({ step, color, shadow }) => (
    <div className="flex items-center justify-center space-x-4 mb-12">
        {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= i ? `${color} text-white shadow-lg ${shadow}` : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}>
                    {i}
                </div>
                {i < 3 && (
                    <div className={`w-12 h-1 transition-all duration-500 rounded-full ${step > i ? color : 'bg-[var(--border-color)]'}`} />
                )}
            </React.Fragment>
        ))}
    </div>
);

const RoleCard: React.FC<{
    role: UserRole;
    selected: boolean;
    onClick: () => void;
    title: string;
    description: string;
    icon: string;
    themeColor: string;
    themeBorder: string;
    themeBg: string;
}> = ({ selected, onClick, title, description, icon, themeColor, themeBorder, themeBg }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full p-6 text-left rounded-[2rem] border-4 transition-all duration-300 group ${selected
                ? `${themeBorder} ${themeBg} shadow-xl scale-[1.02]`
                : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-gray-200 hover:bg-gray-50/20'
            }`}
    >
        <div className="flex items-center space-x-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all ${selected ? `${themeColor} text-white` : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] group-hover:bg-gray-100 group-hover:text-[var(--text-primary)]'
                }`}>
                {icon}
            </div>
            <div>
                <h3 className={`text-xl font-black ${selected ? themeColor.replace('bg-', 'text-') : 'text-[var(--text-primary)]'}`}>{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">{description}</p>
            </div>
        </div>
    </button>
);

const InputField: React.FC<{
    id: string;
    label: string;
    type?: string;
    placeholder: string;
    required?: boolean;
    value: string;
    focusColor: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}> = ({ id, label, type = 'text', placeholder, required = true, value, focusColor, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-black text-[var(--text-primary)] mb-3 uppercase tracking-widest">{label}</label>
        <input
            type={type}
            name={id}
            id={id}
            className={`block w-full px-6 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-2xl focus:bg-[var(--bg-primary)] ${focusColor} outline-none transition-all font-bold text-[var(--text-primary)]`}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={onChange}
        />
    </div>
);

const CreateAccountPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Ambassador);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        industry: '',
        university: '',
        handle: '',
        clubType: '',
        companySize: 'Small/Medium (11-50)',
        influencerType: 'Student Influencer',
        orgType: 'Student Organization',
    });

    const getTheme = () => {
        switch (selectedRole) {
            case UserRole.Brand:
                return {
                    primary: 'bg-blue-600',
                    gradient: 'bg-gradient-blue',
                    text: 'text-blue-600',
                    textGradient: 'text-gradient-blue',
                    shadow: 'shadow-blue-200',
                    focus: 'focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5',
                    border: 'border-blue-600',
                    bg: 'bg-blue-50/50',
                    accent: 'accent-blue-600'
                };
            case UserRole.StudentOrg:
                return {
                    primary: 'bg-purple-600',
                    gradient: 'bg-gradient-purple',
                    text: 'text-purple-600',
                    textGradient: 'text-gradient-purple',
                    shadow: 'shadow-purple-200',
                    focus: 'focus:border-purple-600/20 focus:ring-4 focus:ring-purple-600/5',
                    border: 'border-purple-600',
                    bg: 'bg-purple-50/50',
                    accent: 'accent-purple-600'
                };
            default:
                return {
                    primary: 'bg-spark-red',
                    gradient: 'bg-gradient-red',
                    text: 'text-spark-red',
                    textGradient: 'text-gradient-red',
                    shadow: 'shadow-red-200',
                    focus: 'focus:border-spark-red/20 focus:ring-4 focus:ring-spark-red/5',
                    border: 'border-spark-red',
                    bg: 'bg-red-50/50',
                    accent: 'accent-spark-red'
                };
        }
    };

    const theme = getTheme();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (step === 2) {
            if (!formData.email || !formData.password || !formData.name) {
                setError('Please fill in all basic details.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const targetPage =
            selectedRole === UserRole.Brand ? 'brand-dashboard' :
                selectedRole === UserRole.StudentOrg ? 'org-dashboard' :
                    'student-dashboard';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            if (user) {
                const firestorePromise = setDoc(doc(db, "users", user.uid), {
                    name: formData.name,
                    email: formData.email,
                    role: selectedRole,
                    industry: formData.industry,
                    university: formData.university,
                    handle: formData.handle,
                    clubType: formData.clubType,
                    companySize: formData.companySize,
                    influencerType: selectedRole === UserRole.Ambassador ? formData.influencerType : null,
                    orgType: selectedRole === UserRole.StudentOrg ? formData.orgType : null,
                    createdAt: new Date().toISOString(),
                });

                try {
                    await Promise.race([
                        firestorePromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
                    ]);
                } catch (fsErr) {
                    console.warn('Firestore write failed/timed out, redirecting.');
                }
                onNavigate(targetPage);
            }
        } catch (err: any) {
            console.error('Registration Error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered.');
            } else {
                setError('An error occurred during registration.');
            }
            setLoading(false);
        }
    };

    return (
        <section className="py-12 sm:py-20 bg-[var(--bg-primary)] min-h-screen relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${theme.primary.replace('bg-', 'bg-')}/10 rounded-full blur-[120px] transition-colors duration-1000`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${theme.primary.replace('bg-', 'bg-')}/5 rounded-full blur-[100px] transition-colors duration-1000`}></div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex justify-between items-center mb-12">
                    <button
                        onClick={() => onNavigate('home')}
                        className={`flex items-center text-[var(--text-secondary)] hover:${theme.text} font-black transition-colors group`}
                    >
                        <SparkIcon className={`w-6 h-6 mr-2 transition-colors ${theme.text}`} />
                        <span className="uppercase tracking-widest text-xs">Home</span>
                    </button>
                    <p className="text-sm font-bold text-[var(--text-secondary)]">
                        Already have an account?{' '}
                        <button onClick={() => onNavigate('login')} className={`font-bold transition-colors ${theme.text} hover:underline`}>Log In</button>
                    </p>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-4">Create Your Account</h1>
                    <p className="text-base text-[var(--text-secondary)] font-medium">Join Nigeria's largest campus ecosystem.</p>
                </div>

                <ProgressIndicator step={step} color={theme.primary} shadow={theme.shadow} />

                <div className="bg-[var(--bg-primary)] p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-black/5 border border-[var(--border-color)]">
                    {error && (
                        <div className="mb-8 bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-black flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-xl font-black text-[var(--text-primary)] mb-8">Who are you?</h2>
                            <RoleCard
                                role={UserRole.Ambassador}
                                selected={selectedRole === UserRole.Ambassador}
                                onClick={() => setSelectedRole(UserRole.Ambassador)}
                                title="I am an Influencer"
                                description="I want to work with brands and earn from campaigns."
                                icon="⚡"
                                themeColor="bg-spark-red"
                                themeBorder="border-spark-red"
                                themeBg="bg-red-50/50"
                            />
                            <RoleCard
                                role={UserRole.Brand}
                                selected={selectedRole === UserRole.Brand}
                                onClick={() => setSelectedRole(UserRole.Brand)}
                                title="I am a Brand / Agency"
                                description="I want to reach students and launch campaigns."
                                icon="💼"
                                themeColor="bg-blue-600"
                                themeBorder="border-blue-600"
                                themeBg="bg-blue-50/50"
                            />
                            <RoleCard
                                role={UserRole.StudentOrg}
                                selected={selectedRole === UserRole.StudentOrg}
                                onClick={() => setSelectedRole(UserRole.StudentOrg)}
                                title="I am an Organization"
                                description="I want to find sponsors for our events."
                                icon="🏛️"
                                themeColor="bg-purple-600"
                                themeBorder="border-purple-600"
                                themeBg="bg-purple-50/50"
                            />
                            <button
                                type="button"
                                onClick={nextStep}
                                className={`w-full ${theme.primary} text-white font-black py-5 rounded-2xl text-lg mt-8 hover:opacity-90 transition-all shadow-xl ${theme.shadow} active:scale-[0.98]`}
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-xl font-black text-[var(--text-primary)] mb-8">Basic Details</h2>

                            <InputField id="name" label={selectedRole === UserRole.Brand ? "Company Name" : "Your Full Name"} placeholder="e.g. John Doe" value={formData.name} focusColor={theme.focus} onChange={handleChange} />
                            <InputField id="email" label="Email Address" type="email" placeholder="you@example.com" value={formData.email} focusColor={theme.focus} onChange={handleChange} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField id="password" label="Password" type="password" placeholder="••••••••" value={formData.password} focusColor={theme.focus} onChange={handleChange} />
                                <InputField id="confirmPassword" label="Confirm" type="password" placeholder="••••••••" value={formData.confirmPassword} focusColor={theme.focus} onChange={handleChange} />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={prevStep} className="flex-1 bg-spark-black text-white font-black py-5 rounded-2xl hover:bg-gray-800 transition-all">Back</button>
                                <button type="button" onClick={nextStep} className={`flex-[2] ${theme.primary} text-white font-black py-5 rounded-2xl text-lg hover:opacity-90 transition-all shadow-xl ${theme.shadow} active:scale-[0.98]`}>Next</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4" onSubmit={handleSubmit}>
                            <h2 className="text-xl font-black text-[var(--text-primary)] mb-8">Final Step: Profile</h2>

                            {selectedRole === UserRole.Brand ? (
                                <>
                                    <InputField id="industry" label="Industry" placeholder="e.g. Fintech, Beverage, Fashion" value={formData.industry} focusColor={theme.focus} onChange={handleChange} />
                                    <div>
                                        <label htmlFor="companySize" className="block text-sm font-black text-[var(--text-primary)] mb-3 uppercase tracking-widest">Company Size</label>
                                        <select
                                            id="companySize"
                                            name="companySize"
                                            value={formData.companySize}
                                            onChange={handleChange}
                                            className={`w-full px-6 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-2xl outline-none font-bold appearance-none cursor-pointer text-[var(--text-primary)] ${theme.focus}`}
                                        >
                                            <option>Startup (1-10)</option>
                                            <option>Small/Medium (11-50)</option>
                                            <option>Corporate (50+)</option>
                                        </select>
                                    </div>
                                </>
                            ) : selectedRole === UserRole.Ambassador ? (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-black text-[var(--text-primary)] mb-3 uppercase tracking-widest">Influencer Type</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="influencerType" value="Student Influencer" checked={formData.influencerType === 'Student Influencer'} onChange={handleChange} className="hidden peer" />
                                                <div className={`p-4 border-2 border-[var(--border-color)] rounded-2xl peer-checked:${theme.border} peer-checked:${theme.bg} text-center font-bold text-[var(--text-secondary)] peer-checked:${theme.text} transition-all`}>Student Influencer</div>
                                            </label>
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="influencerType" value="Professional Influencer" checked={formData.influencerType === 'Professional Influencer'} onChange={handleChange} className="hidden peer" />
                                                <div className={`p-4 border-2 border-[var(--border-color)] rounded-2xl peer-checked:${theme.border} peer-checked:${theme.bg} text-center font-bold text-[var(--text-secondary)] peer-checked:${theme.text} transition-all`}>Professional Influencer</div>
                                            </label>
                                        </div>
                                    </div>
                                    {formData.influencerType === 'Student Influencer' && (
                                        <InputField id="university" label="Your University" placeholder="e.g. University of Lagos" value={formData.university} focusColor={theme.focus} onChange={handleChange} />
                                    )}
                                    <InputField id="handle" label="Primary Social Handle" placeholder="e.g. @username_spark" value={formData.handle} focusColor={theme.focus} onChange={handleChange} />
                                </>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-black text-[var(--text-primary)] mb-3 uppercase tracking-widest">Organization Type</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="orgType" value="Student Organization" checked={formData.orgType === 'Student Organization'} onChange={handleChange} className="hidden peer" />
                                                <div className={`p-4 border-2 border-[var(--border-color)] rounded-2xl peer-checked:${theme.border} peer-checked:${theme.bg} text-center font-bold text-[var(--text-secondary)] peer-checked:${theme.text} transition-all`}>Student Org</div>
                                            </label>
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="orgType" value="Professional Organization" checked={formData.orgType === 'Professional Organization'} onChange={handleChange} className="hidden peer" />
                                                <div className={`p-4 border-2 border-[var(--border-color)] rounded-2xl peer-checked:${theme.border} peer-checked:${theme.bg} text-center font-bold text-[var(--text-secondary)] peer-checked:${theme.text} transition-all`}>Professional Org</div>
                                            </label>
                                        </div>
                                    </div>
                                    {formData.orgType === 'Student Organization' && (
                                        <InputField id="university" label="University Location" placeholder="e.g. OAU Ife" value={formData.university} focusColor={theme.focus} onChange={handleChange} />
                                    )}
                                    <InputField id="clubType" label="Org Type" placeholder="e.g. Tech Club, Student Union, Sports" value={formData.clubType} focusColor={theme.focus} onChange={handleChange} />
                                </>
                            )}

                            <div className="flex items-start space-x-3 p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl">
                                <input type="checkbox" required className={`mt-1 w-5 h-5 ${theme.accent} rounded cursor-pointer`} />
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    I agree to the <a href="#" className={`${theme.text} font-bold underline`}>Terms of Service</a> and <a href="#" className={`${theme.text} font-bold underline`}>Privacy Policy</a> of Campus Spark Nigeria.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={prevStep} className="flex-1 bg-spark-black text-white font-black py-5 rounded-2xl hover:bg-gray-800 transition-all">Back</button>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className={`flex-[2] ${theme.primary} text-white font-black py-5 rounded-2xl text-lg hover:opacity-90 transition-all shadow-2xl ${theme.shadow} disabled:opacity-50 active:scale-[0.98]`}
                                >
                                    {loading ? 'Igniting...' : 'Create My Account'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-16 text-center text-[var(--text-secondary)] italic font-medium opacity-60">
                    "Join the movement redefining campus influence in Africa."
                </div>
            </div>
        </section>
    );
};

export default CreateAccountPage;