import React, { useState, useEffect } from 'react';
import { db, collection, query, where, getDocs, orderBy } from '../firebase';
import { FileText, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';

const BlogPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlog, setSelectedBlog] = useState<any>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            console.log("Fetching blogs...");
            const q = query(collection(db, "blogs"));
            const snap = await getDocs(q);
            console.log("Blogs fetched:", snap.size);
            const allFetched = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            // Sort in memory by createdAt
            const sorted = allFetched.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setBlogs(sorted.filter(b => b.status === 'published'));
        } catch (error) {
            console.error("CRITICAL: Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    if (selectedBlog) {
        return (
            <div className="bg-[var(--bg-primary)] min-h-screen pt-32 pb-24 text-[var(--text-primary)]">
                <div className="max-w-3xl mx-auto px-6">
                    <button 
                        onClick={() => setSelectedBlog(null)}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-spark-red font-bold transition-colors mb-10 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Blog
                    </button>
                    
                    {selectedBlog.imageUrl && (
                        <div className="w-full h-[400px] rounded-[2rem] overflow-hidden mb-10 border border-[var(--border-color)]">
                            <img src={selectedBlog.imageUrl} alt={selectedBlog.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-6">
                        <span className="flex items-center gap-2 bg-[var(--bg-secondary)] px-4 py-2 rounded-full border border-[var(--border-color)]">
                            <Calendar className="w-4 h-4" /> 
                            {selectedBlog.createdAt?.seconds ? new Date(selectedBlog.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-10 leading-tight">{selectedBlog.title}</h1>
                    
                    <div className="prose prose-lg dark:prose-invert prose-red max-w-none">
                        {/* A very basic implementation to show content, retaining line breaks */}
                        {selectedBlog.content?.split('\n').map((paragraph: string, idx: number) => (
                            <p key={idx} className="mb-6 leading-relaxed font-medium text-[var(--text-secondary)]">{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-primary)] min-h-screen">
            <section className="py-24 px-4 text-center relative overflow-hidden border-b border-[var(--border-color)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px]"></div>
                </div>
                <div className="max-w-7xl mx-auto relative z-10 pt-10">
                    <h1 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6 tracking-tighter">
                        The <span className="text-gradient-red italic">ABC-Rally</span> Blog
                    </h1>
                    <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">Stories, insights, and opportunities from the heart of Nigeria's youth scene.</p>
                </div>
            </section>

            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div>
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-24 bg-[var(--bg-secondary)] rounded-[3rem] border border-[var(--border-color)]">
                            <div className="w-20 h-20 bg-[var(--bg-primary)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--border-color)] text-gray-400">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Check Back Soon</h3>
                            <p className="text-[var(--text-secondary)] font-medium">We're cooking up some great content for you.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map(blog => (
                                <article 
                                    key={blog.id} 
                                    onClick={() => setSelectedBlog(blog)}
                                    className="group cursor-pointer bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] shadow-sm hover:shadow-2xl hover:shadow-spark-red/5 transition-all duration-500 card-hover flex flex-col"
                                >
                                    {blog.imageUrl ? (
                                        <div className="h-48 bg-[var(--bg-primary)] overflow-hidden border-b border-[var(--border-color)]">
                                            <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        </div>
                                    ) : (
                                        <div className="h-2 bg-spark-red opacity-10 group-hover:opacity-100 transition-opacity"></div>
                                    )}
                                    
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center text-[10px] font-black text-[var(--text-secondary)] mb-4 uppercase tracking-[0.2em]">
                                            <span>{blog.createdAt?.seconds ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                                            <span className="mx-2 text-spark-red">•</span>
                                            <span>Platform Admin</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 group-hover:text-spark-red transition-colors leading-tight">{blog.title}</h2>
                                        <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-sm font-medium flex-1">{blog.excerpt}</p>
                                        <span className="text-spark-red font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                                            Read Article 
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default BlogPage;
