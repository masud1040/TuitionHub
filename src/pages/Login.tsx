import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, ShieldCheck, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'student' | 'teacher'>('student');
  
  // Student login state
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('1');
  const [studentId, setStudentId] = useState('');

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

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef, 
        where('name', '==', studentName),
        where('class', '==', parseInt(studentClass)),
        where('uniqueId', '==', studentId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Invalid credentials. Please check your Name, Class, and Unique ID.');
        setLoading(false);
        return;
      }

      const studentData = querySnapshot.docs[0].data();
      studentData.id = querySnapshot.docs[0].id;
      
      // Store student session in localStorage
      localStorage.setItem('studentSession', JSON.stringify(studentData));
      
      navigate('/');
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
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setLoginType('student')}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              loginType === 'student' 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setLoginType('teacher')}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              loginType === 'teacher' 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Teacher
          </button>
        </div>

        {loginType === 'teacher' ? (
          <>
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
          </>
        ) : (
          <>
            <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <UserIcon className="h-10 w-10 text-blue-500" />
            </div>
            
            <h1 className="text-3xl font-display font-bold mb-3">Student Login</h1>
            <p className="text-text-muted mb-8">
              Enter your details to access your dashboard.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="premium-input"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                <select 
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="premium-input"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>Class {i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unique ID</label>
                <input 
                  type="text" 
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="premium-input"
                  placeholder="Enter your unique ID"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full premium-button-primary py-4 mt-4 flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="font-semibold">Login as Student</span>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
