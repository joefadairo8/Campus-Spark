import React, { useState } from 'react';
import { auth, db, signInWithEmailAndPassword, doc, getDoc } from '../firebase';
import { Shield, Lock, User, ArrowRight, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

const AdminLoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
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

        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.role === 'Admin') {
                        onNavigate('admin-dashboard');
                    } else {
                        // Not an admin, sign out immediately
                        await auth.signOut();
                        setError('Access Denied: This portal is reserved for System Administrators only.');
                    }
                } else {
                    await auth.signOut();
                    setError('Account configuration error. Contact technical support.');
                }
            }
        } catch (err: any) {
            console.error('Admin Login Error:', err);
            setError('Authentication failed. Please verify your administrative credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Cyberpunk/Security Style Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-spark-red/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[120px]"></div>
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
            </div>

            <div className="w-full max-w-lg relative z-10">
                {/* Back Link */}
                <button 
                    onClick={() => onNavigate('home')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 text-[10px] font-black uppercase tracking-[0.3em]"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Terminal
                </button>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-red-900/10 backdrop-blur-xl">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-spark-red/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-spark-red/20 shadow-lg shadow-red-900/20">
                            <Shield className="w-10 h-10 text-spark-red" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">System Authority</h1>
                        <p className="text-gray-500 text-sm font-medium tracking-wide">Secure gateway for platform administrators</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="group relative">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 group-focus-within:text-spark-red transition-colors">Admin Identifier</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-spark-red transition-colors" />
                                    <input 
                                        required
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-spark-red/50 focus:ring-4 focus:ring-spark-red/5 transition-all"
                                        placeholder="system.admin@campus-spark.africa"
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 group-focus-within:text-spark-red transition-colors">Security Key</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-spark-red transition-colors" />
                                    <input 
                                        required
                                        type="password" 
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-spark-red/50 focus:ring-4 focus:ring-spark-red/5 transition-all"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4 text-red-500 text-xs font-bold animate-in fade-in zoom-in-95 duration-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button 
                            disabled={loading}
                            className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-spark-red hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/40 group"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Establish Link
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center border-t border-white/5 pt-10">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
                            End-to-End Encrypted Terminal
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
