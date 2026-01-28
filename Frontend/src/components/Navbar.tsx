import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../constants';
import { api } from '../lib/api';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  // Search State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Logic for desktop search
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // Only clear if NOT mobile search (mobile search has explicit close button)
        // Actually, for consistency, let's keep it but handle mobile separately if needed.
        if (!isMobileSearchOpen) {
          setSearchResults([]);
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileSearchOpen]);

  // Handle closing mobile search if clicking outside might be tricky due to results
  // For mobile, let's rely on the X button or navigating to close it.

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/profile/search?q=${query}&limit=5`);
        setSearchResults(res.data.users);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Shared Search Results Component (to reuse logic)
  const SearchResultsDropdown = () => (
    ((searchResults.length > 0 || isSearching) && (searchQuery.trim().length > 0)) ? (
      <div className="absolute top-full mt-2 w-full bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 left-0">
        {isSearching ? (
          <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
        ) : (
          searchResults.length > 0 ? (
            searchResults.map(user => (
              <div
                key={user._id}
                onClick={() => {
                  navigate(`/u/${user.username}`);
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsMobileSearchOpen(false); // Close mobile search on selection
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                  <img src={user.avatar || DEFAULT_AVATAR_URL} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">No users found.</div>
          )
        )}
      </div>
    ) : null
  );

  return (
    <nav className="mt-6 mx-auto bg-black/50 text-white backdrop-blur-md shadow-lg rounded-full w-[95%] max-w-5xl fixed top-4 left-1/2 transform -translate-x-1/2 z-50 border border-white/20">
      <div className="px-6 sm:px-8">
        <div className="flex justify-between items-center h-16 relative">

          {/* Mobile Search View */}
          {isMobileSearchOpen ? (
            <div className="absolute inset-0 flex items-center w-full animate-in fade-in zoom-in-95 duration-200">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3 text-gray-400" size={18} />
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-white/10 border border-white/10 rounded-full py-2 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 transition-colors"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <button
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
                {/* Reuse results dropdown for mobile */}
                <SearchResultsDropdown />
              </div>
            </div>
          ) : (
            <>
              <Link to="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <Logo className="h-8 w-8 text-white" />
                <span className="text-xl font-bold tracking-tight text-white">QueryPort</span>
              </Link>

              {/* Search Bar (Desktop) */}
              <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative" ref={searchRef}>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/10 rounded-full leading-5 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:text-white sm:text-sm transition-colors"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  <SearchResultsDropdown />
                </div>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-8 ml-8">
                <Link to="/docs" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  API Docs
                </Link>
                {!isAuthenticated && (
                  <div className="relative">
                    <button
                      onClick={() => setIsExploreOpen(!isExploreOpen)}
                      className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Explore
                      <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isExploreOpen && (
                      <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl py-2 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-200">
                        <Link
                          to="/projects"
                          onClick={() => setIsExploreOpen(false)}
                          className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                        >
                          Projects
                        </Link>
                        <Link
                          to="/achievements"
                          onClick={() => setIsExploreOpen(false)}
                          className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                        >
                          Achievements
                        </Link>
                        <Link
                          to="/certifications"
                          onClick={() => setIsExploreOpen(false)}
                          className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                        >
                          Certifications
                        </Link>
                        <Link
                          to="/leaderboard"
                          onClick={() => setIsExploreOpen(false)}
                          className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                        >
                          Leaderboard
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {isAuthenticated ? (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 hover:bg-white/10 rounded-full pr-4 pl-2 py-1 transition-all border border-transparent hover:border-white/10"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                          <img
                            src={user?.avatar || DEFAULT_AVATAR_URL}
                            alt={user?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-300">{user?.name?.split(' ')[0]}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl py-2 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-200">
                          <div className="px-4 py-3 border-b border-white/10 mb-1">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
                          </div>

                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                          >
                            Profile
                          </Link>
                          <Link
                            to="/projects"
                            onClick={() => setIsProfileOpen(false)}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                          >
                            Projects
                          </Link>
                          <Link
                            to="/achievements"
                            onClick={() => setIsProfileOpen(false)}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                          >
                            Achievements
                          </Link>
                          <Link
                            to="/certifications"
                            onClick={() => setIsProfileOpen(false)}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                          >
                            Certifications
                          </Link>
                          <Link
                            to="/leaderboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                          >
                            Leaderboard
                          </Link>
                          <Link
                            to="/skills"
                            onClick={() => setIsProfileOpen(false)}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                          >
                            Skills
                          </Link>

                          <div className="border-t border-white/10 my-1"></div>

                          <button
                            onClick={() => {
                              handleLogout();
                              setIsProfileOpen(false);
                            }}
                            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors text-left"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <button className="text-gray-300 hover:text-white font-medium px-4 py-2 transition-colors">
                        Login
                      </button>
                    </Link>
                    <Link to="/register">
                      <button className="bg-white text-black hover:bg-gray-200 font-bold px-6 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-white/10">
                        Get Started
                      </button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu & Search Icons */}
              <div className="md:hidden flex items-center gap-4">
                <button onClick={() => setIsMobileSearchOpen(true)} className="text-white focus:outline-none">
                  <Search size={22} className="text-gray-200" />
                </button>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {
        isMenuOpen && !isMobileSearchOpen && (
          <div className="md:hidden absolute top-full mt-2 left-0 w-full bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex flex-col space-y-4 shadow-2xl">
            {isAuthenticated ? (
              <>
                <div className="flex flex-col items-center gap-2 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20">
                    <img
                      src={user?.avatar || DEFAULT_AVATAR_URL}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-gray-200 font-medium">{user?.name}</span>
                </div>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Profile</Link>
                <Link to="/projects" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Projects</Link>
                <Link to="/achievements" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Achievements</Link>
                <Link to="/certifications" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Certifications</Link>
                <Link to="/leaderboard" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Leaderboard</Link>
                <Link to="/skills" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Skills</Link>

                <button onClick={handleLogout} className="bg-white/10 text-white py-2 rounded-lg border border-white/20 hover:bg-white/20 mt-2">Logout</button>
              </>
            ) : (
              <>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider text-center mt-2">Explore</div>
                <Link to="/projects" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Projects</Link>
                <Link to="/achievements" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Achievements</Link>
                <Link to="/certifications" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Certifications</Link>
                <Link to="/leaderboard" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Leaderboard</Link>
                {/* <Link to="/skills" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white">Skills</Link> */}

                <div className="border-t border-white/10 my-2"></div>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-center text-gray-300 py-2 hover:text-white">Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="bg-white text-black text-center py-2 rounded-lg font-bold hover:bg-gray-200">Get Started</Link>
              </>
            )}
            <div className="border-t border-white/10 my-2"></div>
            <Link to="/docs" onClick={() => setIsMenuOpen(false)} className="text-gray-300 text-center py-2 hover:text-white font-medium text-blue-400">API Docs</Link>
          </div>
        )
      }
    </nav>
  );
};

export default Navbar;
