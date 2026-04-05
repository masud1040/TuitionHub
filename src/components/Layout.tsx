import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, LayoutDashboard, LogOut, Menu, X as CloseIcon } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    console.log("Logging out from Layout...");
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed from Layout:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <span className="text-2xl font-display font-bold text-gray-900 tracking-tight">
                Edu<span className="text-primary">Diary</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/math" 
                className={`font-medium transition-colors ${location.pathname === '/math' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
              >
                Math
              </Link>
              <Link 
                to="/bangla" 
                className={`font-medium transition-colors ${location.pathname === '/bangla' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
              >
                Bangla
              </Link>
              <Link 
                to="/english" 
                className={`font-medium transition-colors ${location.pathname === '/english' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
              >
                English
              </Link>
              <Link 
                to="/" 
                className={`font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
              >
                Diary
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/admin" 
                    className={`font-medium transition-colors ${location.pathname === '/admin' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="premium-button-primary py-2 px-5"
                >
                  Teacher Login
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                <Link 
                  to="/math" 
                  className={cn(
                    "block px-4 py-3 rounded-xl font-medium transition-colors",
                    location.pathname === '/math' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-gray-50"
                  )}
                >
                  Math
                </Link>
                <Link 
                  to="/bangla" 
                  className={cn(
                    "block px-4 py-3 rounded-xl font-medium transition-colors",
                    location.pathname === '/bangla' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-gray-50"
                  )}
                >
                  Bangla
                </Link>
                <Link 
                  to="/english" 
                  className={cn(
                    "block px-4 py-3 rounded-xl font-medium transition-colors",
                    location.pathname === '/english' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-gray-50"
                  )}
                >
                  English
                </Link>
                <Link 
                  to="/" 
                  className={cn(
                    "block px-4 py-3 rounded-xl font-medium transition-colors",
                    location.pathname === '/' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-gray-50"
                  )}
                >
                  Diary
                </Link>
                
                <div className="pt-4 border-t border-gray-100">
                  {user ? (
                    <div className="space-y-2">
                      <Link 
                        to="/admin" 
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors",
                          location.pathname === '/admin' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-gray-50"
                        )}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        <span>Dashboard</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to="/login" 
                      className="block w-full premium-button-primary py-3 px-5 text-center"
                    >
                      Teacher Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">EduDiary</span>
          </div>
          <p className="text-text-muted">© 2026 EduDiary System. Designed for premium school management.</p>
        </div>
      </footer>
    </div>
  );
}
