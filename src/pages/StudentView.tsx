import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { Calendar, Search, ChevronRight, BookOpen, Filter, ArrowRight, LayoutDashboard, LogOut, CheckCircle2, Calculator, PenTool, Plus, Trash2, Edit, Clock, FileText, X, ShieldCheck, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface DiaryEntry {
  id: string;
  date: string;
  class: number;
  subject: string;
  task: string;
  studentId?: string;
}

export default function StudentView() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [writingContent, setWritingContent] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'diary' | 'routine' | 'mcqs' | 'quiz' | 'formulas' | 'writing' | 'games'>('diary');
  const [viewMode, setViewMode] = useState<'next' | 'all'>('next');
  const [searchDate, setSearchDate] = useState<string>('');
  const [selectedDateDiaries, setSelectedDateDiaries] = useState<DiaryEntry[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [studentSession, setStudentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New states for forms
  const [isAddingFormula, setIsAddingFormula] = useState(false);
  const [formulaFormData, setFormulaFormData] = useState({ title: '', content: '' });
  const [isAddingWriting, setIsAddingWriting] = useState(false);
  const [writingFormData, setWritingFormData] = useState({ type: 'paragraph', title: '', content: '' });
  const [selectedWriting, setSelectedWriting] = useState<any>(null);

  // Quiz Test states
  const [quizSettings, setQuizSettings] = useState({
    subject: '',
    chapter: '',
    questionCount: 10,
    timePerQuestion: 30, // seconds
    timeUnit: 'seconds' as 'seconds' | 'minutes'
  });
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('studentSession');
    let isStudent = false;
    if (session) {
      const parsedSession = JSON.stringify(session) ? JSON.parse(session) : null;
      if (parsedSession) {
        setStudentSession(parsedSession);
        setSelectedClass(Number(parsedSession.class));
        isStudent = true;
      }
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u && !isStudent) {
        navigate('/login');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [navigate]);

  useEffect(() => {
    if (!studentSession && !user) return;

    const classToFetch = studentSession ? Number(studentSession.class) : selectedClass;

    let q = query(
      collection(db, 'diaries'),
      where('class', '==', classToFetch),
      orderBy('date', 'desc')
    );

    const unsubscribeDiaries = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiaryEntry[];
      
      // Filter diaries for the specific student if logged in as student
      if (studentSession) {
        data = data.filter(d => !d.studentId || d.studentId === studentSession.id);
      }
      
      setDiaries(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'diaries');
    });

    // Fetch Routines
    const routineQ = query(
      collection(db, 'routines'),
      where('class', '==', classToFetch)
    );
    const unsubscribeRoutines = onSnapshot(routineQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutines(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'routines');
    });

    // Fetch MCQs
    const mcqQ = query(
      collection(db, 'mcqs'),
      where('class', '==', classToFetch)
    );
    const unsubscribeMcqs = onSnapshot(mcqQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMcqs(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'mcqs');
    });

    // Fetch Formulas (Classes 6-10)
    let unsubscribeFormulas = () => {};
    if (classToFetch >= 6) {
      const formulaQ = query(
        collection(db, 'formulas'),
        where('class', '==', classToFetch)
      );
      unsubscribeFormulas = onSnapshot(formulaQ, (snapshot) => {
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter: Global OR specific student OR student's own
        if (studentSession) {
          data = data.filter((f: any) => 
            f.isGlobal || 
            f.studentId === studentSession.id || 
            f.authorId === studentSession.uid
          );
        }
        setFormulas(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'formulas');
      });
    }

    // Fetch Writing Content (Classes 6-10)
    let unsubscribeWriting = () => {};
    if (classToFetch >= 6) {
      const writingQ = query(
        collection(db, 'writing_content'),
        where('class', '==', classToFetch)
      );
      unsubscribeWriting = onSnapshot(writingQ, (snapshot) => {
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter: Global OR specific student OR student's own
        if (studentSession) {
          data = data.filter((w: any) => 
            w.isGlobal || 
            w.studentId === studentSession.id || 
            w.authorId === studentSession.uid
          );
        }
        setWritingContent(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'writing_content');
      });
    }

    return () => {
      unsubscribeDiaries();
      unsubscribeRoutines();
      unsubscribeMcqs();
      unsubscribeFormulas();
      unsubscribeWriting();
    };
  }, [selectedClass, studentSession, user]);

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    navigate('/login');
  };

  const handleFormulaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSession) return;
    try {
      await addDoc(collection(db, 'formulas'), {
        ...formulaFormData,
        class: Number(studentSession.class),
        authorId: studentSession.uid,
        authorType: 'student',
        authorName: studentSession.name,
        createdAt: new Date().toISOString()
      });
      setFormulaFormData({ title: '', content: '' });
      setIsAddingFormula(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'formulas');
    }
  };

  const handleWritingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSession) return;
    try {
      await addDoc(collection(db, 'writing_content'), {
        ...writingFormData,
        class: Number(studentSession.class),
        authorId: studentSession.uid,
        authorType: 'student',
        authorName: studentSession.name,
        createdAt: new Date().toISOString()
      });
      setWritingFormData({ type: 'paragraph', title: '', content: '' });
      setIsAddingWriting(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'writing_content');
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionName);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextDay = format(addDays(startOfToday(), 1), 'yyyy-MM-dd');
  const nextDayDiaries = diaries.filter(d => d.date.startsWith(nextDay));

  const groupedDiaries = diaries.reduce((acc, diary) => {
    const date = diary.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(diary);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const uniqueDates = Object.keys(groupedDiaries).sort().reverse();
  const filteredDates = searchDate 
    ? uniqueDates.filter(date => date.includes(searchDate))
    : uniqueDates;

  const handleDateClick = (date: string) => {
    setActiveDate(date);
    setSelectedDateDiaries(groupedDiaries[date] || []);
  };

  const currentClass = studentSession ? Number(studentSession.class) : selectedClass;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Teacher Shortcut Banner */}
      {user && !studentSession && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-primary">Teacher Mode Active</p>
              <p className="text-xs text-primary/70">You are currently viewing the site as a student.</p>
            </div>
          </div>
          <Link 
            to="/admin" 
            className="premium-button-primary py-2 px-4 text-sm flex items-center space-x-2"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}

      {/* Student Welcome Banner */}
      {studentSession && (
        <div className="space-y-4 mb-8">
          {studentSession.authWarning && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-700">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                <strong>Read-Only Mode:</strong> {studentSession.authWarning} 
                <span className="block mt-1 text-xs opacity-80">Enable "Anonymous" sign-in in Firebase Console to allow adding formulas and writing.</span>
              </p>
            </div>
          )}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-blue-500/20"
          >
          <div>
            <h1 className="text-2xl font-display font-bold mb-1">Welcome back, {studentSession.name}!</h1>
            <p className="text-blue-100 text-sm">Class {studentSession.class} • ID: {studentSession.uniqueId}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 transition-colors p-3 rounded-xl flex items-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-semibold text-sm hidden sm:inline">Logout</span>
          </button>
        </motion.div>
      </div>
    )}

      {/* Hero Section */}
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6"
        >
          Check Your Daily <span className="text-primary">Study Routine</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-text-muted max-w-2xl mx-auto"
        >
          Stay updated with your homework and class tasks. Select your class to get started.
        </motion.p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('diary')}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2",
            activeTab === 'diary' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-muted hover:bg-gray-50"
          )}
        >
          <BookOpen className="h-5 w-5" />
          <span>Daily Diary</span>
        </button>
        <button
          onClick={() => setActiveTab('routine')}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2",
            activeTab === 'routine' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-muted hover:bg-gray-50"
          )}
        >
          <Calendar className="h-5 w-5" />
          <span>Class Routine</span>
        </button>
        <button
          onClick={() => setActiveTab('mcqs')}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2",
            activeTab === 'mcqs' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-muted hover:bg-gray-50"
          )}
        >
          <CheckCircle2 className="h-5 w-5" />
          <span>MCQ Practice</span>
        </button>
        
        {currentClass >= 3 && (
          <button
            onClick={() => setActiveTab('quiz')}
            className={cn(
              "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2",
              activeTab === 'quiz' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-muted hover:bg-gray-50"
            )}
          >
            <Clock className="h-5 w-5" />
            <span>Quiz Test</span>
          </button>
        )}

        {currentClass >= 3 && (
          <button
            onClick={() => setActiveTab('writing')}
            className={cn(
              "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2",
              activeTab === 'writing' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-muted hover:bg-gray-50"
            )}
          >
            <PenTool className="h-5 w-5" />
            <span>{currentClass >= 6 ? 'Writing Section' : 'Paragraphs'}</span>
          </button>
        )}

        {currentClass >= 6 && (
          <button
            onClick={() => setActiveTab('formulas')}
            className={cn(
              "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2",
              activeTab === 'formulas' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-muted hover:bg-gray-50"
            )}
          >
            <Calculator className="h-5 w-5" />
            <span>Formulas</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('games')}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2",
            activeTab === 'games' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-muted hover:bg-gray-50"
          )}
        >
          <Gamepad2 className="h-5 w-5" />
          <span>Games</span>
        </button>
      </div>

      {/* Class Selector & Controls */}
      {activeTab === 'diary' && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <label className="font-semibold text-gray-700 whitespace-nowrap">Select Class:</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(Number(e.target.value))}
              className="premium-input py-2 w-full md:w-48"
              disabled={!!studentSession}
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Class {i + 1}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setViewMode('next')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all",
                viewMode === 'next' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text"
              )}
            >
              Next Day
            </button>
            <button 
              onClick={() => setViewMode('all')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all",
                viewMode === 'all' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text"
              )}
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'games' ? (
          <motion.div
            key="games-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display flex items-center space-x-3">
                <Gamepad2 className="text-primary h-6 w-6" />
                <span>Learning Games</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ y: -5 }}
                className="premium-card overflow-hidden group"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                          width: Math.random() * 40 + 20,
                          height: Math.random() * 40 + 20,
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                  <Gamepad2 className="h-20 w-20 text-white relative z-10 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Bubble Pop!</h3>
                  <p className="text-text-muted text-sm mb-6">Pop the bubbles to learn letters and words in English and Bangla.</p>
                  <Link 
                    to="/game"
                    className="w-full premium-button-primary py-3 flex items-center justify-center space-x-2"
                  >
                    <span>Play Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : activeTab === 'diary' ? (
          viewMode === 'next' ? (
            <motion.div 
              key="next-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display flex items-center space-x-3">
                  <Calendar className="text-primary h-6 w-6" />
                  <span>Next Day's Diary ({format(addDays(startOfToday(), 1), 'EEEE, MMM d')})</span>
                </h2>
              </div>

              {nextDayDiaries.length > 0 ? (
                <div className="premium-card overflow-hidden">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Homework / Task</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nextDayDiaries.map((diary) => (
                        <tr key={diary.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="font-semibold text-primary">{diary.subject}</td>
                          <td className="text-gray-700 leading-relaxed">{diary.task}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="premium-card p-12 text-center">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-10 w-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Diary Found</h3>
                  <p className="text-text-muted">Homework for tomorrow hasn't been published yet.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="all-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Date List */}
              <div className="lg:col-span-1 space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5" />
                  <input 
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="premium-input pl-12"
                    placeholder="Search by date..."
                  />
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left",
                        activeDate === date 
                          ? "bg-primary/5 border-primary shadow-sm" 
                          : "bg-white border-gray-100 hover:border-primary/30 hover:shadow-sm"
                      )}
                    >
                      <div>
                        <p className="text-sm text-text-muted font-medium">{format(parseISO(date), 'EEEE')}</p>
                        <p className="font-display font-bold text-lg">{format(parseISO(date), 'MMM d, yyyy')}</p>
                      </div>
                      <ChevronRight className={cn("h-5 w-5 transition-transform", activeDate === date ? "text-primary translate-x-1" : "text-gray-300")} />
                    </button>
                  ))}
                  {filteredDates.length === 0 && (
                    <p className="text-center py-8 text-text-muted">No records found for this date.</p>
                  )}
                </div>
              </div>

              {/* Details Table */}
              <div className="lg:col-span-2">
                {activeDate ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-display font-bold">
                        Diary for {format(parseISO(activeDate), 'MMMM d, yyyy')}
                      </h2>
                    </div>
                    <div className="premium-card overflow-hidden">
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Homework / Task</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDateDiaries.map((diary) => (
                            <tr key={diary.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="font-semibold text-primary">{diary.subject}</td>
                              <td className="text-gray-700 leading-relaxed">{diary.task}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center premium-card p-12 text-center border-dashed border-2">
                    <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                      <ArrowRight className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Select a Date</h3>
                    <p className="text-text-muted">Click on a date from the left to view the homework details.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )
        ) : activeTab === 'routine' ? (
          <motion.div
            key="routine-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display flex items-center space-x-3">
                <Calendar className="text-orange-500 h-6 w-6" />
                <span>Class Routine (Class {selectedClass})</span>
              </h2>
            </div>

            {routines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                  const dayRoutine = routines.find(r => r.day === day);
                  if (!dayRoutine) return null;
                  return (
                    <div key={day} className="premium-card p-6">
                      <h3 className="text-lg font-bold text-primary mb-4 border-b pb-2">{day}</h3>
                      <div className="space-y-2">
                        {dayRoutine.subjects.split(',').map((sub: string, idx: number) => (
                          <div key={idx} className="flex items-center space-x-2 text-gray-700">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span>{sub.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="premium-card p-12 text-center">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Routine Found</h3>
                <p className="text-text-muted">Routine for this class hasn't been uploaded yet.</p>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'mcqs' ? (
          <motion.div
            key="mcqs-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display flex items-center space-x-3">
                <CheckCircle2 className="text-indigo-500 h-6 w-6" />
                <span>MCQ Practice (Class {selectedClass})</span>
              </h2>
            </div>

            {mcqs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mcqs.map((mcq, idx) => (
                  <div key={mcq.id} className="premium-card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg uppercase tracking-wider">{mcq.subject}</span>
                      <span className="text-xs text-gray-400">Q{idx + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-6">{mcq.question}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {mcq.options.map((opt: string, oIdx: number) => (
                        <button
                          key={oIdx}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                          onClick={() => {
                            if (opt === mcq.correctAnswer) {
                              alert("সঠিক উত্তর! (Correct!)");
                            } else {
                              alert("ভুল উত্তর। আবার চেষ্টা করো। (Wrong! Try again.)");
                            }
                          }}
                        >
                          <span className="font-medium text-gray-700 group-hover:text-primary">{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="premium-card p-12 text-center">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No MCQs Found</h3>
                <p className="text-text-muted">MCQs for this class haven't been added yet.</p>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'quiz' ? (
          <motion.div
            key="quiz-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display flex items-center space-x-3">
                <Clock className="text-indigo-500 h-6 w-6" />
                <span>Quiz Test (Class {currentClass})</span>
              </h2>
            </div>

            {!isQuizStarted ? (
              <div className="max-w-2xl mx-auto premium-card p-8">
                <div className="text-center mb-8">
                  <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold">Configure Your Quiz</h3>
                  <p className="text-text-muted">Set your preferences and start the test</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                      <select 
                        className="premium-input"
                        value={quizSettings.subject}
                        onChange={e => setQuizSettings({...quizSettings, subject: e.target.value})}
                      >
                        <option value="">Select Subject</option>
                        <option value="Bangla">Bangla</option>
                        <option value="English">English</option>
                        <option value="Math">Math</option>
                        <option value="Science">Science</option>
                        <option value="Social Science">Social Science</option>
                        <option value="Religion">Religion</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Chapter</label>
                      <select 
                        className="premium-input"
                        value={quizSettings.chapter}
                        onChange={e => setQuizSettings({...quizSettings, chapter: e.target.value})}
                      >
                        <option value="">Select Chapter</option>
                        <option value="Chapter 1">Chapter 1</option>
                        <option value="Chapter 2">Chapter 2</option>
                        <option value="Chapter 3">Chapter 3</option>
                        <option value="Full Book">Full Book</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Questions</label>
                      <input 
                        type="number" 
                        min="1"
                        max="50"
                        className="premium-input"
                        value={quizSettings.questionCount}
                        onChange={e => setQuizSettings({...quizSettings, questionCount: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Time per Question</label>
                      <div className="flex space-x-2">
                        <input 
                          type="number" 
                          min="1"
                          className="premium-input flex-1"
                          value={quizSettings.timePerQuestion}
                          onChange={e => setQuizSettings({...quizSettings, timePerQuestion: parseInt(e.target.value)})}
                        />
                        <select 
                          className="premium-input w-32"
                          value={quizSettings.timeUnit}
                          onChange={e => setQuizSettings({...quizSettings, timeUnit: e.target.value as any})}
                        >
                          <option value="seconds">Seconds</option>
                          <option value="minutes">Minutes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsQuizStarted(true)}
                    className="premium-button-primary w-full py-4 text-lg font-bold shadow-indigo-200 bg-indigo-500 hover:bg-indigo-600"
                  >
                    Start Quiz Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto premium-card p-12 text-center">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Quiz Started!</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Subject</p>
                    <p className="font-bold">{quizSettings.subject || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Chapter</p>
                    <p className="font-bold">{quizSettings.chapter || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Questions</p>
                    <p className="font-bold">{quizSettings.questionCount}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Time Limit</p>
                    <p className="font-bold">{quizSettings.timePerQuestion} {quizSettings.timeUnit}</p>
                  </div>
                </div>
                <p className="text-text-muted mb-8 italic">
                  (Quiz engine integration would go here. For now, your settings are saved.)
                </p>
                <button 
                  onClick={() => setIsQuizStarted(false)}
                  className="text-primary font-bold hover:underline"
                >
                  Go Back to Settings
                </button>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'formulas' ? (
          <motion.div
            key="formulas-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display flex items-center space-x-3">
                <Calculator className="text-primary h-6 w-6" />
                <span>Math Formulas (Class {currentClass})</span>
              </h2>
              {studentSession && (
                <button 
                  onClick={() => setIsAddingFormula(true)}
                  className="premium-button-primary py-2 px-4 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Formula</span>
                </button>
              )}
            </div>

            {isAddingFormula && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="premium-card p-6 border-primary/30"
              >
                <form onSubmit={handleFormulaSave} className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Add New Formula</h3>
                    <button type="button" onClick={() => setIsAddingFormula(false)}><X className="h-5 w-5 text-gray-400" /></button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Formula Title (e.g., Algebra Identity)" 
                    className="premium-input"
                    required
                    value={formulaFormData.title}
                    onChange={e => setFormulaFormData({...formulaFormData, title: e.target.value})}
                  />
                  <textarea 
                    placeholder="Enter formula content..." 
                    className="premium-input min-h-[100px]"
                    required
                    value={formulaFormData.content}
                    onChange={e => setFormulaFormData({...formulaFormData, content: e.target.value})}
                  />
                  <button type="submit" className="premium-button-primary w-full py-3">Save Formula</button>
                </form>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formulas.map((formula) => (
                <div key={formula.id} className="premium-card p-6 group relative">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{formula.title}</h3>
                    {studentSession && formula.authorId === studentSession.uid && (
                      <button 
                        onClick={() => handleDelete('formulas', formula.id)}
                        className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl font-mono text-primary text-center text-lg">
                    {formula.content}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-text-muted uppercase tracking-wider font-bold">
                    <span>{formula.authorType === 'student' ? (formula.authorId === studentSession?.uid ? 'Added by Me' : `By ${formula.authorName}`) : 'Set by Teacher'}</span>
                    <span>{formula.createdAt ? format(parseISO(formula.createdAt), 'MMM d') : ''}</span>
                  </div>
                </div>
              ))}
              {formulas.length === 0 && !isAddingFormula && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-text-muted">No formulas added yet for this class.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="writing-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display flex items-center space-x-3">
                <PenTool className="text-pink-500 h-6 w-6" />
                <span>{currentClass >= 6 ? 'Writing Section' : 'Paragraphs'} (Class {currentClass})</span>
              </h2>
              {studentSession && (
                <button 
                  onClick={() => setIsAddingWriting(true)}
                  className="premium-button-primary py-2 px-4 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add {currentClass >= 6 ? 'Content' : 'Paragraph'}</span>
                </button>
              )}
            </div>

            {isAddingWriting && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="premium-card p-6 border-primary/30"
              >
                <form onSubmit={handleWritingSave} className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Add New {currentClass >= 6 ? 'Writing Content' : 'Paragraph'}</h3>
                    <button type="button" onClick={() => setIsAddingWriting(false)}><X className="h-5 w-5 text-gray-400" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                      className="premium-input"
                      value={writingFormData.type}
                      onChange={e => setWritingFormData({...writingFormData, type: e.target.value})}
                    >
                      <option value="paragraph">Paragraph</option>
                      {currentClass >= 6 && (
                        <>
                          <option value="story">Story</option>
                          <option value="dialogue">Dialogue</option>
                          <option value="composition">Composition</option>
                          <option value="letter">Letter</option>
                          <option value="email">Email</option>
                        </>
                      )}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Title" 
                      className="premium-input"
                      required
                      value={writingFormData.title}
                      onChange={e => setWritingFormData({...writingFormData, title: e.target.value})}
                    />
                  </div>
                  <textarea 
                    placeholder="Enter content..." 
                    className="premium-input min-h-[200px]"
                    required
                    value={writingFormData.content}
                    onChange={e => setWritingFormData({...writingFormData, content: e.target.value})}
                  />
                  <button type="submit" className="premium-button-primary w-full py-3">Save Content</button>
                </form>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {writingContent.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedWriting(item)}
                  className="premium-card p-6 group cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                      {item.type}
                    </span>
                    {studentSession && item.authorId === studentSession.uid && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete('writing_content', item.id);
                        }}
                        className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-1">{item.title}</h3>
                  <p className="text-text-muted text-sm line-clamp-3 mb-4">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-text-muted uppercase tracking-wider font-bold pt-4 border-t">
                    <span>{item.authorType === 'student' ? (item.authorId === studentSession?.uid ? 'Added by Me' : `By ${item.authorName}`) : 'Set by Teacher'}</span>
                    <div className="flex items-center space-x-1">
                      <span>Read More</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))}
              {writingContent.length === 0 && !isAddingWriting && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-text-muted">No writing content added yet for this class.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Writing Detail Modal */}
      <AnimatePresence>
        {selectedWriting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <div>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider mb-2 inline-block">
                    {selectedWriting.type}
                  </span>
                  <h2 className="text-2xl font-display font-bold">{selectedWriting.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedWriting(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                    {selectedWriting.content}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-text-muted">
                  <span className="font-bold">Author:</span> {selectedWriting.authorName} ({selectedWriting.authorType})
                </div>
                <div className="text-sm text-text-muted">
                  <span className="font-bold">Date:</span> {selectedWriting.createdAt ? format(parseISO(selectedWriting.createdAt), 'MMMM d, yyyy') : ''}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
