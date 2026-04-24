
import React, { useState } from 'react';
import { auth, db, createUserWithEmailAndPassword, doc, setDoc } from '../firebase';
import { SparkIcon } from '../constants';
import { UserRole } from '../types';

const ProgressIndicator: React.FC<{ step: number }> = ({ step }) => (
    <div className="flex items-center justify-center space-x-4 mb-12">
        {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= i ? 'bg-spark-red text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {i}
                </div>
                {i < 3 && (
                    <div className={`w-12 h-1 transition-all duration-500 rounded-full ${step > i ? 'bg-spark-red' : 'bg-gray-100'}`} />
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
}> = ({ selected, onClick, title, description, icon }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full p-6 text-left rounded-[2rem] border-4 transition-all duration-300 group ${selected
                ? 'border-spark-red bg-red-50/50 shadow-xl scale-[1.02]'
                : 'border-gray-50 bg-white hover:border-red-100 hover:bg-red-50/20'
            }`}
    >
        <div className="flex items-center space-x-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all ${selected ? 'bg-spark-red text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-red-100 group-hover:text-spark-red'
                }`}>
                {icon}
            </div>
            <div>
                <h3 className={`text-xl font-black ${selected ? 'text-spark-red' : 'text-spark-black'}`}>{title}</h3>
                <p className="text-sm text-spark-gray font-medium mt-1">{description}</p>
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
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}> = ({ id, label, type = 'text', placeholder, required = true, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-black text-spark-black mb-3 uppercase tracking-widest">{label}</label>
        <input
            type={type}
            name={id}
            id={id}
            className="block w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-spark-red/20 focus:ring-4 focus:ring-spark-red/5 outline-none transition-all font-bold text-spark-black"
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
            console.log('Attempting to create user with Auth...');
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            if (user) {
                console.log('Auth user created successfully:', user.uid);

                // Firestore write is important but shouldn't block user access if it hangs
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

                // Race the firestore write with a 2-second timeout to ensure the UI proceeds
                try {
                    await Promise.race([
                        firestorePromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
                    ]);
                    console.log('Firestore profile created successfully.');
                } catch (fsErr) {
                    console.warn('Firestore write took too long or failed, redirecting anyway.', fsErr);
                }

                console.log('Redirecting to dashboard:', targetPage);
                onNavigate(targetPage);
            }
        } catch (err: any) {
            console.error('Registration Main Error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in instead.');
            } else if (err.code === 'auth/invalid-email') {
                 setError('Please enter a valid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please use at least 6 characters.');
            } else {
                setError('An error occurred during registration. Please try again.');
            }
            setLoading(false);
        }
    };

    return (
        <section className="py-12 sm:py-20 bg-white min-h-screen">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-12">
                    <button
                        onClick={() => onNavigate('home')}
                        className="flex items-center text-spark-gray hover:text-spark-red font-black transition-colors group"
                    >
                        <SparkIcon className="w-6 h-6 mr-2" />
                        <span className="uppercase tracking-widest text-xs">Home</span>
                    </button>
                    <p className="text-sm font-bold text-spark-gray">
                        Already have an account?{' '}
                        <button onClick={() => onNavigate('login')} className="text-spark-red hover:underline">Log In</button>
                    </p>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-spark-black tracking-tight mb-4">Create Your Account</h1>
                    <p className="text-lg text-spark-gray font-medium">Join Nigeria's largest campus ecosystem.</p>
                </div>

                <ProgressIndicator step={step} />

                <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-red-50 border border-gray-100">
                    {error && (
                        <div className="mb-8 bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-black flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-2xl font-black text-spark-black mb-8">Who are you?</h2>
                            <RoleCard
                                role={UserRole.Ambassador}
                                selected={selectedRole === UserRole.Ambassador}
                                onClick={() => setSelectedRole(UserRole.Ambassador)}
                                title="I am a Student Influencer / Professional Influencer"
                                description="I want to work with brands and build my resume."
                                icon="⚡"
                            />
                            <RoleCard
                                role={UserRole.Brand}
                                selected={selectedRole === UserRole.Brand}
                                onClick={() => setSelectedRole(UserRole.Brand)}
                                title="I am a Brand / Agency"
                                description="I want to reach students and launch campaigns."
                                icon="💼"
                            />
                            <RoleCard
                                role={UserRole.StudentOrg}
                                selected={selectedRole === UserRole.StudentOrg}
                                onClick={() => setSelectedRole(UserRole.StudentOrg)}
                                title="I represent a Student / Professional Organization"
                                description="I want to find sponsors for our campus events."
                                icon="🏛️"
                            />
                            <button
                                type="button"
                                onClick={nextStep}
                                className="w-full bg-spark-black text-white font-black py-5 rounded-2xl text-xl mt-8 hover:bg-spark-red transition-all shadow-xl shadow-gray-200 active:scale-[0.98]"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-2xl font-black text-spark-black mb-8">Basic Details</h2>

                            <InputField id="name" label={selectedRole === UserRole.Brand ? "Company Name" : "Your Full Name"} placeholder="e.g. John Doe" value={formData.name} onChange={handleChange} />
                            <InputField id="email" label="Email Address" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField id="password" label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                                <InputField id="confirmPassword" label="Confirm" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={prevStep} className="flex-1 border-2 border-gray-100 text-spark-gray font-black py-5 rounded-2xl hover:bg-gray-50 transition-all">Back</button>
                                <button type="button" onClick={nextStep} className="flex-[2] bg-spark-black text-white font-black py-5 rounded-2xl text-xl hover:bg-spark-red transition-all shadow-xl shadow-gray-200 active:scale-[0.98]">Next</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4" onSubmit={handleSubmit}>
                            <h2 className="text-2xl font-black text-spark-black mb-8">Final Step: Profile</h2>

                            {selectedRole === UserRole.Brand ? (
                                <>
                                    <InputField id="industry" label="Industry" placeholder="e.g. Fintech, Beverage, Fashion" value={formData.industry} onChange={handleChange} />
                                    <div>
                                        <label htmlFor="companySize" className="block text-sm font-black text-spark-black mb-3 uppercase tracking-widest">Company Size</label>
                                        <select
                                            id="companySize"
                                            name="companySize"
                                            value={formData.companySize}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-spark-red/20 outline-none font-bold appearance-none cursor-pointer"
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
                                        <label className="block text-sm font-black text-spark-black mb-3 uppercase tracking-widest">Influencer Type</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="influencerType" value="Student Influencer" checked={formData.influencerType === 'Student Influencer'} onChange={handleChange} className="hidden peer" />
                                                <div className="p-4 border-2 rounded-2xl peer-checked:border-spark-red peer-checked:bg-red-50 text-center font-bold text-spark-gray peer-checked:text-spark-red transition-all">Student Influencer</div>
                                            </label>
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="influencerType" value="Professional Influencer" checked={formData.influencerType === 'Professional Influencer'} onChange={handleChange} className="hidden peer" />
                                                <div className="p-4 border-2 rounded-2xl peer-checked:border-spark-red peer-checked:bg-red-50 text-center font-bold text-spark-gray peer-checked:text-spark-red transition-all">Professional Influencer</div>
                                            </label>
                                        </div>
                                    </div>
                                    {formData.influencerType === 'Student Influencer' && (
                                        <InputField id="university" label="Your University" placeholder="e.g. University of Lagos" value={formData.university} onChange={handleChange} />
                                    )}
                                    <InputField id="handle" label="Primary Social Handle" placeholder="e.g. @username_spark" value={formData.handle} onChange={handleChange} />
                                </>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-black text-spark-black mb-3 uppercase tracking-widest">Organization Type</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="orgType" value="Student Organization" checked={formData.orgType === 'Student Organization'} onChange={handleChange} className="hidden peer" />
                                                <div className="p-4 border-2 rounded-2xl peer-checked:border-spark-red peer-checked:bg-red-50 text-center font-bold text-spark-gray peer-checked:text-spark-red transition-all">Student Org</div>
                                            </label>
                                            <label className="flex-1 cursor-pointer">
                                                <input type="radio" name="orgType" value="Professional Organization" checked={formData.orgType === 'Professional Organization'} onChange={handleChange} className="hidden peer" />
                                                <div className="p-4 border-2 rounded-2xl peer-checked:border-spark-red peer-checked:bg-red-50 text-center font-bold text-spark-gray peer-checked:text-spark-red transition-all">Professional Org</div>
                                            </label>
                                        </div>
                                    </div>
                                    {formData.orgType === 'Student Organization' && (
                                        <InputField id="university" label="University Location" placeholder="e.g. OAU Ife" value={formData.university} onChange={handleChange} />
                                    )}
                                    <InputField id="clubType" label="Org Type" placeholder="e.g. Tech Club, Student Union, Sports" value={formData.clubType} onChange={handleChange} />
                                </>
                            )}

                            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl">
                                <input type="checkbox" required className="mt-1 w-5 h-5 accent-spark-red rounded cursor-pointer" />
                                <p className="text-sm text-spark-gray font-medium leading-relaxed">
                                    I agree to the <a href="#" className="text-spark-red font-bold underline">Terms of Service</a> and <a href="#" className="text-spark-red font-bold underline">Privacy Policy</a> of Campus Spark Nigeria.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={prevStep} className="flex-1 border-2 border-gray-100 text-spark-gray font-black py-5 rounded-2xl hover:bg-gray-50 transition-all">Back</button>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="flex-[2] bg-spark-red text-white font-black py-5 rounded-2xl text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-200 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {loading ? 'Igniting...' : 'Create My Account'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-16 text-center text-spark-gray italic font-medium opacity-60">
                    "Join the movement redefining campus influence in Africa."
                </div>
            </div>
        </section>
    );
};

export default CreateAccountPage;