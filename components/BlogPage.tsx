
import React from 'react';

const BlogPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const posts = [
    {
      id: 1,
      title: "How to Secure Your First ₦1M Campus Sponsorship",
      category: "Guides",
      excerpt: "Step-by-step tactics used by UNILAG student leaders to land major tech sponsorships...",
      author: "Damilola A.",
      date: "May 12, 2024"
    },
    {
      id: 2,
      title: "The Rise of Gen-Z Consumers in Nigeria",
      category: "Insights",
      excerpt: "Why traditional TV ads are failing and how peer-to-peer campus marketing is winning...",
      author: "Ikenna E.",
      date: "June 05, 2024"
    },
    {
      id: 3,
      title: "10 Campus Ambassador Programs You Should Join in 2024",
      category: "Opportunities",
      excerpt: "From Fintech to Lifestyle, here are the brands looking for new student voices across Nigeria...",
      author: "Fatima Y.",
      date: "July 20, 2024"
    }
  ];

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen">
      <section className="py-24 px-4 text-center relative overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6 tracking-tighter">
            The <span className="text-gradient-red italic">Spark</span> Blog
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">Stories, insights, and opportunities from the heart of Nigeria's youth scene.</p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <article key={post.id} className="group cursor-pointer bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] shadow-sm hover:shadow-2xl hover:shadow-spark-red/5 transition-all duration-500 card-hover">
                <div className="h-2 bg-spark-red opacity-10 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-8">
                  <div className="flex items-center text-[10px] font-black text-[var(--text-secondary)] mb-4 uppercase tracking-[0.2em]">
                    <span>{post.date}</span>
                    <span className="mx-2 text-spark-red">•</span>
                    <span>By {post.author}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 group-hover:text-spark-red transition-colors leading-tight">{post.title}</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-sm font-medium">{post.excerpt}</p>
                  <span className="text-spark-red font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                    Read Article 
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
