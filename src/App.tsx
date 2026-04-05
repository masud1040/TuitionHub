import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StudentView from './pages/StudentView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import SubjectPage from './pages/SubjectPage';
import MathHome from './pages/MathHome';
import GeneralMathQuiz from './pages/GeneralMathQuiz';
import MultiplicationTableQuiz from './pages/MultiplicationTableQuiz';
import WordProblemQuiz from './pages/WordProblemQuiz';
import NumberGame from './pages/NumberGame';
import { auth } from './lib/firebase';
import React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
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

  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<StudentView />} />
          <Route path="/math" element={<MathHome />} />
          <Route path="/math/general" element={<GeneralMathQuiz />} />
          <Route path="/math/tables" element={<MultiplicationTableQuiz />} />
          <Route path="/math/problems" element={<WordProblemQuiz />} />
          <Route path="/math/number-game" element={<NumberGame />} />
          <Route path="/bangla" element={<SubjectPage name="Bangla" />} />
          <Route path="/english" element={<SubjectPage name="English" />} />
          <Route path="/login" element={<AdminLogin />} />
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
