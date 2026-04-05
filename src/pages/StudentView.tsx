import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { Calendar, Search, ChevronRight, BookOpen, Filter, ArrowRight, LayoutDashboard, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState<'diary' | 'routine' | 'mcqs'>('diary');
  const [viewMode, setViewMode] = useState<'next' | 'all'>('next');
  const [searchDate, setSearchDate] = useState<string>('');
  const [selectedDateDiaries, setSelectedDateDiaries] = useState<DiaryEntry[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [studentSession, setStudentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    return () => {
      unsubscribeDiaries();
      unsubscribeRoutines();
      unsubscribeMcqs();
    };
  }, [selectedClass, studentSession, user]);

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    navigate('/login');
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
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-blue-500/20"
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
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
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
        {activeTab === 'diary' ? (
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
        ) : (
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
        )}
      </AnimatePresence>
    </div>
  );
}
