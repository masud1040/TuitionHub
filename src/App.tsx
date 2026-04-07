import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StudentView from './pages/StudentView';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SubjectPage from './pages/SubjectPage';
import MathHome from './pages/MathHome';
import GeneralMathQuiz from './pages/GeneralMathQuiz';
import MultiplicationTableQuiz from './pages/MultiplicationTableQuiz';
import WordProblemQuiz from './pages/WordProblemQuiz';
import NumberGame from './pages/NumberGame';
import BanglaHome from './pages/BanglaHome';
import BanglaVowels from './pages/BanglaVowels';
import BanglaConsonants from './pages/BanglaConsonants';
import BanglaPoems from './pages/BanglaPoems';
import BanglaConjuncts from './pages/BanglaConjuncts';
import EnglishHome from './pages/EnglishHome';
import EnglishWords from './pages/EnglishWords';
import EnglishAlphabet from './pages/EnglishAlphabet';
import EnglishRhymes from './pages/EnglishRhymes';
import BubblePopGame from './pages/BubblePopGame';
import SimpleQuiz from './pages/SimpleQuiz';
import { auth } from './lib/firebase';
import React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isStudent, setIsStudent] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      const session = localStorage.getItem('studentSession');
      setIsStudent(!!session);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Students cannot access admin dashboard
  if (isStudent) {
    return <Navigate to="/" />;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function SubjectRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [studentSession, setStudentSession] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      const session = localStorage.getItem('studentSession');
      if (session) {
        try {
          setStudentSession(JSON.parse(session));
        } catch (e) {
          console.error("Error parsing student session:", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  // Admins can always access
  if (user) return <>{children}</>;

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<StudentView />} />
          
          {/* Subject Routes with Class Restriction */}
          <Route path="/math" element={<SubjectRoute><MathHome /></SubjectRoute>} />
          <Route path="/math/general" element={<SubjectRoute><GeneralMathQuiz /></SubjectRoute>} />
          <Route path="/math/tables" element={<SubjectRoute><MultiplicationTableQuiz /></SubjectRoute>} />
          <Route path="/math/problems" element={<SubjectRoute><WordProblemQuiz /></SubjectRoute>} />
          <Route path="/math/number-game" element={<SubjectRoute><NumberGame /></SubjectRoute>} />
          
          <Route path="/bangla" element={<SubjectRoute><BanglaHome /></SubjectRoute>} />
          <Route path="/bangla/vowels" element={<SubjectRoute><BanglaVowels /></SubjectRoute>} />
          <Route path="/bangla/consonants" element={<SubjectRoute><BanglaConsonants /></SubjectRoute>} />
          <Route path="/bangla/poems" element={<SubjectRoute><BanglaPoems /></SubjectRoute>} />
          <Route path="/bangla/conjuncts" element={<SubjectRoute><BanglaConjuncts /></SubjectRoute>} />
          
          <Route path="/english" element={<SubjectRoute><EnglishHome /></SubjectRoute>} />
          <Route path="/english/alphabet" element={<SubjectRoute><EnglishAlphabet /></SubjectRoute>} />
          <Route path="/english/words" element={<SubjectRoute><EnglishWords /></SubjectRoute>} />
          <Route path="/english/rhymes" element={<SubjectRoute><EnglishRhymes /></SubjectRoute>} />
          <Route path="/game" element={<BubblePopGame />} />
          <Route path="/simple-quiz" element={<SimpleQuiz />} />
          
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
