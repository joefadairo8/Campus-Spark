import React, { useState, useEffect } from 'react';
import { db, collection, query, where, getDocs, orderBy, limit } from '../firebase';
import { FileText, Calendar, ArrowRight } from 'lucide-react';

const LatestBlogsSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLatestBlogs();
    }, []);

    const fetchLatestBlogs = async () => {
        try {
            console.log("Fetching latest blogs...");
            const q = query(collection(db, "blogs"));
            const snap = await getDocs(q);
            console.log("Latest blogs fetched:", snap.size);
            const allFetched = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            // Sort in memory by createdAt
            const sorted = allFetched.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setBlogs(sorted.filter(b => b.status === 'published').slice(0, 3));
        } catch (error) {
            console.error("CRITICAL: Error fetching latest blogs:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-[var(--text-secondary)]">Loading blogs...</div>;
    if (blogs.length === 0) return (
        <div className="py-20 text-center text-[var(--text-secondary)]">
            <p>No published blogs found.</p>
            <p className="text-xs opacity-50">Check your Firestore "blogs" collection and status field.</p>
        </div>
    );

    return (
        <section className="py-24 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-spark-red/10 text-spark-red rounded-full text-sm font-black uppercase tracking-widest mb-6">
                            <FileText className="w-4 h-4" /> The Spark Blog
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter">
                            Latest from our <span className="text-transparent bg-clip-text bg-gradient-to-r from-spark-red to-orange-500">Newsroom</span>
                        </h2>
                    </div>
                    <button 
                        onClick={() => onNavigate('blog')}
                        className="px-8 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-black rounded-xl hover:bg-spark-red hover:text-white hover:border-spark-red transition-all flex items-center gap-2 uppercase tracking-widest text-sm"
                    >
                        View All Posts <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map(blog => (
                        <article 
                            key={blog.id} 
                            onClick={() => onNavigate('blog')}
                            className="group cursor-pointer bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-spark-red/5 transition-all duration-500 flex flex-col"
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
                                    <Calendar className="w-3 h-3 mr-2" />
                                    <span>{blog.createdAt?.seconds ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 group-hover:text-spark-red transition-colors leading-tight line-clamp-2">
                                    {blog.title}
                                </h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-sm font-medium flex-1 line-clamp-3">
                                    {blog.excerpt}
                                </p>
                                <span className="text-spark-red font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                                    Read Article <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LatestBlogsSection;
