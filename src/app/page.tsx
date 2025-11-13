import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Banner Logo - Full width and prominent */}
          <div className="mb-6 md:mb-8 flex justify-center w-full">
            <img 
              src="/chess klub banner logo.jpg" 
              alt="Chess Klub Banner" 
              className="w-full max-w-5xl h-auto object-contain"
            />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Master Chess. Join the Klub.
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-gray-300">
            Compete in tournaments, learn from expert tutors, and connect with chess enthusiasts
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg">
              Browse Tournaments
            </button>
            <button className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition">
              Find a Tutor
            </button>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section id="tournaments" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center">Featured Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tournament Card 1 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">Chess Championship 2024</span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Grand Master Open</h3>
                    <p className="text-gray-600 mt-1">📍 New York, NY</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-orange-500">$150</span>
                  <span className="text-gray-500 line-through">$200</span>
                </div>
                <p className="text-gray-600 mb-4">Join elite players in this prestigious tournament. Prizes up to $10,000!</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>📅 March 15-17, 2024</span>
                </div>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-semibold transition">
                  Register Now
                </button>
              </div>
            </div>

            {/* Tournament Card 2 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">Rapid Chess Blitz</span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Speed Chess Tournament</h3>
                    <p className="text-gray-600 mt-1">📍 Los Angeles, CA</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-orange-500">$75</span>
                  <span className="text-gray-500 line-through">$100</span>
                </div>
                <p className="text-gray-600 mb-4">Fast-paced action! 5-minute games for the ultimate chess challenge.</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>📅 April 5, 2024</span>
                </div>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-semibold transition">
                  Register Now
                </button>
              </div>
            </div>

            {/* Tournament Card 3 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">Youth Championship</span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Junior Chess League</h3>
                    <p className="text-gray-600 mt-1">📍 Chicago, IL</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-orange-500">$50</span>
                  <span className="text-gray-500 line-through">$75</span>
                </div>
                <p className="text-gray-600 mb-4">Perfect for young players! Ages 8-18 welcome. Build skills and make friends.</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>📅 May 10-12, 2024</span>
                </div>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-semibold transition">
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tutoring Section */}
      <section id="tutoring" className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center">Expert Chess Tutoring</h2>
          <p className="text-center text-gray-600 mb-12 text-lg max-w-3xl mx-auto">
            Learn from experienced masters. Choose between in-person or online sessions tailored to your skill level.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* In-Person Tutoring */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">👨‍🏫</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">In-Person Tutoring</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Meet with certified chess instructors at our local centers. Personalized one-on-one or group sessions available.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span className="text-gray-700">Face-to-face instruction</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span className="text-gray-700">Physical board practice</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span className="text-gray-700">Flexible scheduling</span>
                </div>
              </div>
              <button className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-md font-semibold transition">
                Find In-Person Tutors
              </button>
            </div>

            {/* Online Tutoring */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">💻</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Online Tutoring</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Learn from anywhere! Interactive online sessions with top-rated chess coaches. Perfect for busy schedules.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span className="text-gray-700">Learn from home</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span className="text-gray-700">Interactive digital boards</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span className="text-gray-700">Recorded sessions</span>
                </div>
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-semibold transition">
                Find Online Tutors
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Chess Workshop", date: "Feb 20", location: "NYC", price: "$25" },
              { title: "Simul Exhibition", date: "Feb 28", location: "LA", price: "Free" },
              { title: "Chess Camp", date: "Mar 1-3", location: "Chicago", price: "$200" },
              { title: "Blitz Night", date: "Mar 8", location: "Boston", price: "$15" },
            ].map((event, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition">
                <div className="text-sm font-semibold text-orange-500 mb-2">{event.date}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4">📍 {event.location}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-900">{event.price}</span>
                  <button className="text-orange-500 hover:text-orange-600 font-semibold">
                    Learn More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Elevate Your Game?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of players improving their skills and competing in exciting tournaments
          </p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-lg text-lg font-semibold transition shadow-lg">
            Get Started Today
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}