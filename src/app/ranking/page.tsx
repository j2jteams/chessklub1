'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RankingPage() {
  const achievements = [
    {
      year: '2024',
      tournament: 'SC State Championship',
      results: [
        '1st Place - K-3 Championship',
        '2nd Place - Middle School Blitz',
        '3rd Place - K-5 Blitz',
        '4th Place - Middle School Blitz',
        '5th Place - K-5 Blitz',
        '6th Place - K-5 Championship',
        '7th Place - K-5 National Qualifier',
        '7th Place - K-3 Championship',
        '8th Place - K-3 Championship',
      ],
    },
    {
      year: '2024',
      tournament: 'NC State Championship',
      results: [
        '2nd Place - K-5 Under 900',
        '5th Place - K-8 Under 1200',
        '14th Place - K-5 Championship',
      ],
    },
  ];

  const topPlayers = [
    { rank: 1, name: 'Alex Chen', rating: 1850, category: 'K-8' },
    { rank: 2, name: 'Sarah Johnson', rating: 1780, category: 'K-5' },
    { rank: 3, name: 'Michael Rodriguez', rating: 1720, category: 'K-8' },
    { rank: 4, name: 'Emma Williams', rating: 1680, category: 'K-5' },
    { rank: 5, name: 'James Anderson', rating: 1650, category: 'K-3' },
    { rank: 6, name: 'Olivia Martinez', rating: 1620, category: 'K-5' },
    { rank: 7, name: 'Noah Thompson', rating: 1590, category: 'K-8' },
    { rank: 8, name: 'Sophia Brown', rating: 1560, category: 'K-3' },
    { rank: 9, name: 'Liam Davis', rating: 1530, category: 'K-5' },
    { rank: 10, name: 'Ava Wilson', rating: 1500, category: 'K-8' },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 chess-themed-bg">
        {/* Hero Section */}
        <div 
          className="text-white py-12"
          style={{ 
            backgroundColor: 'var(--color-dark)',
            paddingTop: 'var(--space-md)',
            paddingBottom: 'var(--space-md)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 
              className="mb-4 font-bold"
              style={{ 
                fontSize: 'var(--font-size-h2)',
                color: 'var(--color-light)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Rankings & Achievements
            </h1>
            <p 
              className="text-lg"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Celebrating our students' success and competitive achievements
            </p>
          </div>
        </div>

        {/* Top Players Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Top 10 Players</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Rating</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((player) => (
                    <tr key={player.rank} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          player.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                          player.rank === 2 ? 'bg-gray-300 text-gray-800' :
                          player.rank === 3 ? 'bg-orange-300 text-orange-900' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {player.rank}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900">{player.name}</td>
                      <td className="py-4 px-4 text-orange-500 font-semibold">{player.rating}</td>
                      <td className="py-4 px-4 text-gray-600">{player.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Achievements Section */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Recent Achievements</h2>
            <div className="space-y-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{achievement.tournament}</h3>
                      <p className="text-gray-600">{achievement.year}</p>
                    </div>
                    <div className="text-4xl">🏆</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievement.results.map((result, resultIndex) => (
                      <div key={resultIndex} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 font-medium">{result}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-orange-500 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Want to See Your Name Here?</h2>
            <p className="text-xl mb-8">Join CHESS KLUB and start your journey to the top!</p>
            <a
              href="/login"
              className="inline-block bg-white text-orange-500 font-semibold px-8 py-3 rounded-md hover:bg-gray-100 transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

