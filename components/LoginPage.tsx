import React, { useState } from 'react';
import { auth, db, signInWithEmailAndPassword, doc, getDoc } from '../firebase';
import { UserRole } from '../types';

const InputField: React.FC<{
    id: string;
    label: string;
    type?: string;
    placeholder: string;
    required?: boolean;
    value: string;
    focusColor: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Ambassador);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getTheme = () => {
        switch (selectedRole) {
            case UserRole.Brand:
                return {
                    primary: 'bg-blue-600',
                    text: 'text-blue-600',
                    shadow: 'shadow-blue-200',
                    focus: 'focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5',
                    lightBg: 'bg-blue-50/50',
                    border: 'border-blue-600'
                };
            case UserRole.StudentOrg:
                return {
                    primary: 'bg-purple-600',
                    text: 'text-purple-600',
                    shadow: 'shadow-purple-200',
                    focus: 'focus:border-purple-600/20 focus:ring-4 focus:ring-purple-600/5',
                    lightBg: 'bg-purple-50/50',
                    border: 'border-purple-600'
                };
            default:
                return {
                    primary: 'bg-spark-red',
                    text: 'text-spark-red',
                    shadow: 'shadow-red-200',
                    focus: 'focus:border-spark-red/20 focus:ring-4 focus:ring-spark-red/5',
                    lightBg: 'bg-red-50/50',
                    border: 'border-spark-red'
                };
        }
    };

    const theme = getTheme();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        
                        if (data.status === 'suspended') {
                            await auth.signOut();
                            setError('ACCESS DENIED: This account has been suspended for violating platform policies.');
                            setLoading(false);
                            return;
                        }

                        const role = data.role;

                        switch (role) {
                            case 'Brand':
                                onNavigate('brand-dashboard');
                                break;
                            case 'Student Organization':
                            case 'Student/Professional Organization':
                                onNavigate('org-dashboard');
                                break;
                            case 'Admin':
                                onNavigate('admin-dashboard');
                                break;
                            default:
                                onNavigate('student-dashboard');
                                break;
                        }
                    } else {
                        onNavigate('student-dashboard');
                    }
                } catch (fsErr: any) {
                    onNavigate('student-dashboard');
                }
            }
        } catch (err: any) {
            let msg = 'Failed to log in.';
            if (err.code === 'auth/network-request-failed') {
                msg = 'Connection error. Please try again.';
            } else {
                msg = 'Check your credentials and try again.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-12 sm:py-20 bg-[var(--bg-primary)] min-h-screen relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] ${theme.primary}/10 rounded-full blur-[120px] transition-colors duration-1000`}></div>
                <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] ${theme.primary}/5 rounded-full blur-[100px] transition-colors duration-1000`}></div>
            </div>

            <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-12">
                    <button
                        onClick={() => onNavigate('home')}
                        className={`flex items-center text-[var(--text-secondary)] hover:${theme.text} font-black transition-colors group uppercase tracking-widest text-xs`}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Home
                    </button>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-4">Welcome Back!</h1>
                    <p className="text-base text-[var(--text-secondary)] font-medium">Ignite your campus journey today.</p>
                </div>

                {/* Role Switcher */}
                <div className="flex bg-[var(--bg-primary)] p-1.5 rounded-2xl border border-[var(--border-color)] mb-8 shadow-sm">
                    <button 
                        onClick={() => setSelectedRole(UserRole.Ambassador)}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === UserRole.Ambassador ? 'bg-spark-red text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-red-50 hover:text-spark-red'}`}
                    >
                        Influencer
                    </button>
                    <button 
                        onClick={() => setSelectedRole(UserRole.Brand)}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === UserRole.Brand ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                        Brand
                    </button>
                    <button 
                        onClick={() => setSelectedRole(UserRole.StudentOrg)}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === UserRole.StudentOrg ? 'bg-purple-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-purple-50 hover:text-purple-600'}`}
                    >
                        Org
                    </button>
                </div>

                <div className="bg-[var(--bg-primary)] p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-black/5 border border-[var(--border-color)]">
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <InputField
                            id="email"
                            label="Email Address"
                            type="email"
                            placeholder="e.g. user@example.com"
                            value={formData.email}
                            focusColor={theme.focus}
                            onChange={handleChange}
                        />

                        <div>
                            <InputField
                                id="password"
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                focusColor={theme.focus}
                                onChange={handleChange}
                            />
                            <div className="text-right mt-3">
                                <a href="#" className={`text-xs font-black ${theme.text} uppercase tracking-widest hover:underline`}>
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-black flex items-center gap-3">
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className={`w-full ${theme.primary} text-white font-black py-5 rounded-2xl text-lg hover:opacity-90 transition-all shadow-xl ${theme.shadow} disabled:opacity-50`}
                        >
                            {loading ? 'Entering...' : 'Log In'}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-12 font-medium">
                    <p className="text-[var(--text-secondary)]">
                        New to the network?{' '}
                        <button onClick={() => onNavigate('create-account')} className={`font-black ${theme.text} hover:underline`}>Sign up</button>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;