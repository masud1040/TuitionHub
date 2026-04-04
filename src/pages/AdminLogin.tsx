import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLogin() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create as teacher
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Default role is teacher for new logins (can be manually upgraded to admin in DB)
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'teacher',
          createdAt: new Date().toISOString()
        });
      }

      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full premium-card p-10 text-center"
      >
        <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-display font-bold mb-3">Teacher Portal</h1>
        <p className="text-text-muted mb-10">
          Sign in to manage daily diaries and homework assignments for your classes.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 premium-button-secondary py-4 hover:border-primary/50 group"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
              <span className="font-semibold group-hover:text-primary transition-colors">Continue with Google</span>
            </>
          )}
        </button>

        <p className="mt-8 text-xs text-text-muted leading-relaxed">
          Access is restricted to authorized school staff only. 
          By signing in, you agree to follow the school's data privacy guidelines.
        </p>
      </motion.div>
    </div>
  );
}
