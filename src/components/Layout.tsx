import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, LayoutDashboard, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

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

            {/* Mobile Menu Button (Simplified) */}
            <div className="md:hidden flex items-center space-x-2">
              {user ? (
                <>
                  <Link to="/admin" className="p-2 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-red-500">
                    <LogOut className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <Link to="/login" className="p-2 text-gray-500">
                  <LayoutDashboard className="h-6 w-6" />
                </Link>
              )}
            </div>
          </div>
        </div>
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
