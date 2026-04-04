import React from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { Calendar, Search, ChevronRight, BookOpen, Filter, ArrowRight, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Link } from 'react-router-dom';

interface DiaryEntry {
  id: string;
  date: string;
  class: number;
  subject: string;
  task: string;
}

export default function StudentView() {
  const [selectedClass, setSelectedClass] = React.useState<number>(1);
  const [diaries, setDiaries] = React.useState<DiaryEntry[]>([]);
  const [viewMode, setViewMode] = React.useState<'next' | 'all'>('next');
  const [searchDate, setSearchDate] = React.useState<string>('');
  const [selectedDateDiaries, setSelectedDateDiaries] = React.useState<DiaryEntry[]>([]);
  const [activeDate, setActiveDate] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const q = query(
      collection(db, 'diaries'),
      where('class', '==', selectedClass),
      orderBy('date', 'desc')
    );

    const unsubscribeDiaries = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiaryEntry[];
      setDiaries(data);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDiaries();
    };
  }, [selectedClass]);

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
      {user && (
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

      {/* Class Selector & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <label className="font-semibold text-gray-700 whitespace-nowrap">Select Class:</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="premium-input py-2 w-full md:w-48"
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

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'next' ? (
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
        )}
      </AnimatePresence>
    </div>
  );
}
