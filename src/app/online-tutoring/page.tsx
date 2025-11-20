'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function OnlineTutoringPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Online Chess Tutoring</h1>
            <p className="text-xl text-gray-300">
              Learn chess from the best coaches in a structured, online environment
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              CHESS KLUB offers an integrated Chess ecosystem with several distinct features, enabling our students to tailor and maximize their learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Champion Coaches', icon: '👑', description: 'Learn from our most accomplished and experienced chess coaches' },
              { title: 'Multiple Class Options', icon: '📚', description: 'Choose from various class formats that fit your schedule and learning style' },
              { title: 'Internal & Rated Tournaments', icon: '🏆', description: 'Participate in both internal club tournaments and official rated competitions' },
              { title: 'Robust Online Community', icon: '👥', description: 'Connect with fellow chess enthusiasts and practice partners' },
              { title: 'Daily Practice Sessions', icon: '♟️', description: 'Regular practice opportunities to reinforce your learning' },
              { title: 'Student Progress Reports', icon: '📊', description: 'Track your improvement with detailed progress reports' },
              { title: 'Student Game Analysis', icon: '🔍', description: 'Get in-depth analysis of your games to identify areas for improvement' },
              { title: 'Student Assignments', icon: '📝', description: 'Homework and assignments to improve your game beyond classes' },
              { title: 'Unlimited Chess Resources', icon: '📖', description: 'Access to extensive learning materials and resources' },
              { title: 'Learning After Classroom', icon: '🎓', description: 'Continue learning with resources available 24/7' },
              { title: 'Students of All Skill Levels', icon: '🌟', description: 'Programs designed for beginners to advanced players' },
              { title: '24x7 Student Support', icon: '💬', description: 'Round-the-clock support for all your chess learning needs' },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Curriculum</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our curriculum, created and practiced by our most accomplished coaches, is always under constant review and improvement to ensure that our students stay ahead!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">The CHESS KLUB Program</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-orange-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>At CHESS KLUB, our mentors follow a thoughtfully designed curriculum to suit online learning.</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-orange-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Our syllabus covers a wide array of subjects, and we provide our students with assignments and homework to improve their game beyond the classes.</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-orange-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Our support portal also gives parents a chance to view the progress made by their child and a place for students to submit their assignments.</span>
                  </li>
                </ul>
                <button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md transition">
                  Download Program Guide
                </button>
              </div>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">♟️</div>
                <p className="text-gray-600">Comprehensive chess curriculum designed for all skill levels</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Benefits</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We go beyond the 64 squares of the chess board and integrate the essence of growth and sportsmanship in every student's personality and life.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                'Strategic Thinking',
                'Lateral Thinking',
                'Time Management',
                'Problem Solving',
                'Concentration',
                'Patience',
                'Sportsmanship',
                'Confidence Building',
              ].map((benefit, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                  <h3 className="font-semibold text-slate-900">{benefit}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-orange-500 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Join the Winning Team!</h2>
            <p className="text-xl mb-8">Start your chess journey with CHESS KLUB today</p>
            <Link
              href="/login"
              className="inline-block bg-white text-orange-500 font-semibold px-8 py-3 rounded-md hover:bg-gray-100 transition"
            >
              Inquire Now
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

