export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          {/* Top Bar */}
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2">
                <span className="text-3xl">♟️</span>
                <h1 className="text-2xl font-bold text-gray-900">Chess Klub</h1>
              </a>
            </div>
            
            {/* Search Box - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search tournaments, events..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 cursor-not-allowed opacity-75"
                  disabled
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Mobile Search Icon */}
              <button
                className="lg:hidden text-gray-700 hover:text-gray-900 transition-colors cursor-not-allowed opacity-75"
                disabled
                aria-label="Search"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              
              <button 
                className="hidden sm:block text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-not-allowed opacity-75"
                disabled
              >
                Log In
              </button>
              <button 
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors cursor-not-allowed opacity-75"
                disabled
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="flex items-center justify-between border-t border-gray-200 py-3">
            {/* Main Navigation */}
            <nav className="flex items-center space-x-6">
              <a 
                href="#" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-not-allowed opacity-75"
              >
                Home
              </a>
              <a 
                href="#" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-not-allowed opacity-75"
              >
                Tournaments
              </a>
              <a 
                href="#" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-not-allowed opacity-75"
              >
                Events
              </a>
              <a 
                href="#" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-not-allowed opacity-75"
              >
                About
              </a>
              <a 
                href="#" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-not-allowed opacity-75"
              >
                Contact
              </a>
              <a 
                href="#" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-not-allowed opacity-75"
              >
                Rules
              </a>
            </nav>

            {/* Play Now Button */}
            <button 
              className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 cursor-not-allowed opacity-75"
              disabled
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Play Now</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Hidden by default, can be toggled */}
        <div className="lg:hidden pb-3 hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tournaments, events..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 cursor-not-allowed opacity-75"
              disabled
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
