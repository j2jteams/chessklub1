import Header from './components/Header';
import Footer from './components/Footer';
import TournamentCard from './components/TournamentCard';
import EventCard from './components/EventCard';
import { featuredTournaments, upcomingEvents } from './data/events';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Join the Ultimate Chess Experience
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Compete in tournaments, attend events, and elevate your game
            </p>
            <button 
              className="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold text-lg hover:bg-gray-100 transition-colors cursor-not-allowed opacity-75"
              disabled
            >
              Explore Upcoming Events
            </button>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900">Blitz</h3>
              <p className="text-sm text-gray-600 mt-1">Fast & Furious</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900">Rapid</h3>
              <p className="text-sm text-gray-600 mt-1">Quick Thinking</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-semibold text-gray-900">Classical</h3>
              <p className="text-sm text-gray-600 mt-1">Deep Strategy</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-semibold text-gray-900">Workshops</h3>
              <p className="text-sm text-gray-600 mt-1">Learn & Grow</p>
            </div>
          </div>
        </div>
      </section>

      {/* More Events Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-blue-100 mb-6">Get notified about new tournaments and events</p>
          <div className="max-w-md mx-auto flex gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              disabled
            />
            <button 
              className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors cursor-not-allowed opacity-75"
              disabled
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
