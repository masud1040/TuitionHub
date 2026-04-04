import React from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { format, startOfToday, addDays } from 'date-fns';
import { Plus, Trash2, Edit2, Save, X, LayoutDashboard, Calendar, BookOpen, CheckCircle2, Eye, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';

interface DiaryEntry {
  id: string;
  date: string;
  class: number;
  subject: string;
  task: string;
  authorId: string;
}

export default function AdminDashboard() {
  const [selectedClass, setSelectedClass] = React.useState<number>(1);
  const [diaries, setDiaries] = React.useState<DiaryEntry[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = React.useState({
    date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
    subject: '',
    task: ''
  });

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
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
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDiaries();
    };
  }, [selectedClass, navigate]);

  const handleLogout = async () => {
    console.log("Logging out...");
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'diaries', editingId), {
          ...formData,
          class: selectedClass,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'diaries'), {
          ...formData,
          class: selectedClass,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setFormData({
        date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
        subject: '',
        task: ''
      });
    } catch (err) {
      console.error("Error saving diary:", err);
      alert("Failed to save diary. Check permissions.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await deleteDoc(doc(db, 'diaries', id));
    }
  };

  const startEdit = (diary: DiaryEntry) => {
    setEditingId(diary.id);
    setFormData({
      date: diary.date.split('T')[0],
      subject: diary.subject,
      task: diary.task
    });
    setIsAdding(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center space-x-3">
            <LayoutDashboard className="text-primary h-8 w-8" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-text-muted mt-1">Manage homework and daily routines for students.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link 
            to="/"
            className="premium-button-secondary flex items-center justify-center space-x-2"
          >
            <Eye className="h-5 w-5" />
            <span>View Student Page</span>
          </Link>
          
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setFormData({
                date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
                subject: '',
                task: ''
              });
            }}
            className="premium-button-primary flex items-center justify-center space-x-2"
          >
            {isAdding ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span>{isAdding ? "Cancel" : "Add New Diary"}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100"
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Class to Manage</label>
            <div className="grid grid-cols-2 gap-2">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setSelectedClass(i + 1)}
                  className={cn(
                    "py-3 rounded-xl font-medium transition-all",
                    selectedClass === i + 1 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-gray-50 text-text-muted hover:bg-gray-100"
                  )}
                >
                  Class {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="premium-card p-6 bg-primary/5 border-primary/10">
            <h3 className="font-semibold text-primary mb-2 flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Quick Tip</span>
            </h3>
            <p className="text-sm text-primary/80 leading-relaxed">
              Always set the date to tomorrow for the "Next Day" diary view to work correctly for students.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="premium-card p-8 border-2 border-primary/20"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                  <BookOpen className="text-primary h-6 w-6" />
                  <span>{editingId ? "Edit Diary Entry" : "Create New Diary Entry"}</span>
                </h2>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                      <input 
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="premium-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Mathematics"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="premium-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Homework / Task Details</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Enter the homework details here..."
                      value={formData.task}
                      onChange={(e) => setFormData({...formData, task: e.target.value})}
                      className="premium-input resize-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="premium-button-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="premium-button-primary flex items-center space-x-2"
                    >
                      <Save className="h-5 w-5" />
                      <span>{editingId ? "Update Diary" : "Publish Diary"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Recent Diaries for Class {selectedClass}</h2>
              <span className="text-sm text-text-muted font-medium">{diaries.length} entries found</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : diaries.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {diaries.map((diary) => (
                  <motion.div 
                    layout
                    key={diary.id}
                    className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-primary/5 transition-colors">
                        <Calendar className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-display font-bold text-lg">{format(new Date(diary.date), 'MMM d, yyyy')}</span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                            {diary.subject}
                          </span>
                        </div>
                        <p className="text-text-muted line-clamp-2">{diary.task}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => startEdit(diary)}
                        className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(diary.id)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="premium-card p-20 text-center border-dashed border-2">
                <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400">No diaries found for this class</h3>
                <p className="text-text-muted">Start by adding a new homework entry.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
