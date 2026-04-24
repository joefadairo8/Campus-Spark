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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, type = 'text', placeholder, required = true, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-black text-spark-black mb-3 uppercase tracking-widest">{label}</label>
        <input
            type={type}
            name={id}
            id={id}
            className="block w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-spark-red/20 outline-none transition-all font-bold"
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Real backend login

        try {
            console.log('Logging in...');
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            if (user) {
                try {
                    // Fetch user role from backend
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        const role = data.role;

                        console.log('User logged in with role:', role);

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
                            case 'Ambassador':
                            case 'Ambassador/Influencer':
                            case 'Student/Professional Influencer':
                            default:
                                onNavigate('student-dashboard');
                                break;
                        }
                    } else {
                        onNavigate('student-dashboard');
                    }
                } catch (fsErr: any) {
                    console.error('Role fetch error:', fsErr);
                    onNavigate('student-dashboard');
                }
            }
        } catch (err: any) {
            console.error('Login Error:', err);
            let msg = 'Failed to log in.';
            if (err.code === 'auth/network-request-failed' || err.message?.includes('offline')) {
                msg = 'Connection error. Please check your internet and try again.';
            } else {
                msg = err.message || 'Check your credentials and try again.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-12 sm:py-20 bg-white min-h-screen">
            <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <button
                        onClick={() => onNavigate('home')}
                        className="flex items-center text-spark-gray hover:text-spark-red font-black transition-colors group uppercase tracking-widest text-xs"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Home
                    </button>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-spark-black tracking-tight mb-4">Welcome Back!</h1>
                    <p className="text-lg text-spark-gray font-medium">Ignite your campus journey today.</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-red-50 border border-gray-100">
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <InputField
                            id="email"
                            label="Email Address"
                            type="email"
                            placeholder="e.g. student@test.com"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <div>
                            <InputField
                                id="password"
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <div className="text-right mt-3">
                                <a href="#" className="text-xs font-black text-spark-red uppercase tracking-widest hover:underline">
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
                            className="w-full bg-spark-red text-white font-black py-5 rounded-2xl text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-200 disabled:opacity-50"
                        >
                            {loading ? 'Entering...' : 'Log In'}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-12 font-medium">
                    <p className="text-spark-gray">
                        New to the network?{' '}
                        <button onClick={() => onNavigate('create-account')} className="font-black text-spark-red hover:underline">Sign up</button>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;