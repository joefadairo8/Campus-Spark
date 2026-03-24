
import React from 'react';

const ValueProposition: React.FC = () => {
    return (
        <section className="py-16 sm:py-20 bg-spark-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-spark-black sm:text-4xl">
                        Unlock the Heartbeat of Nigerian Youth Culture
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-spark-gray">
                        Campus Spark is more than a platform; it's a bridge to the nation's future leaders, creators, and consumers.
                    </p>
                </div>
                <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                    <div className="p-8 bg-spark-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-spark-black">Our Mission</h3>
                        <p className="mt-2 text-spark-gray">
                            To empower students across Nigeria by connecting them with meaningful opportunities, while enabling brands to build authentic, lasting relationships with the next generation.
                        </p>
                    </div>
                    <div className="p-8 bg-spark-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-spark-black">Why Nigerian Campuses?</h3>
                        <p className="mt-2 text-spark-gray">
                            Nigerian universities are bustling hubs of innovation, culture, and influence. They are micro-cities where trends are born and futures are forged. Engaging here means engaging with the future of the country.
                        </p>
                    </div>
                    <div className="p-8 bg-spark-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-spark-black">The Campus Spark Difference</h3>
                        <p className="mt-2 text-spark-gray">
                            We're built for Nigeria, by people who understand the unique dynamics of its campus life. We prioritize verification, security, and creating genuine connections over transactional interactions.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ValueProposition;
