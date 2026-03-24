
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
    <div className="bg-white min-h-screen">
      <section className="bg-red-50 py-24 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black text-spark-black mb-6">The <span className="text-spark-red">Spark</span> Blog</h1>
          <p className="text-xl text-spark-gray max-w-2xl mx-auto">Stories, insights, and opportunities from the heart of Nigeria's university scene.</p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {posts.map(post => (
              <article key={post.id} className="group cursor-pointer bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="h-4 bg-spark-red opacity-10 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-10">
                  <div className="flex items-center text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                    <span>{post.date}</span>
                    <span className="mx-2">•</span>
                    <span>By {post.author}</span>
                  </div>
                  <h2 className="text-2xl font-black text-spark-black mb-4 group-hover:text-spark-red transition-colors leading-tight">{post.title}</h2>
                  <p className="text-spark-gray leading-relaxed mb-8">{post.excerpt}</p>
                  <span className="text-spark-red font-black text-sm uppercase tracking-widest group-hover:underline underline-offset-4">Read Article →</span>
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
