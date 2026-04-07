import React from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp, getDoc, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, startOfToday, addDays } from 'date-fns';
import { Plus, Trash2, Edit2, Save, X, LayoutDashboard, Calendar, BookOpen, CheckCircle2, Eye, LogOut, Calculator, BarChart3, Users, FileText, Settings, Clock, Search, Menu, GraduationCap, Sigma, PenTool, Filter, Feather } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toBanglaNumber } from '../lib/banglaUtils';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface DiaryEntry {
  id: string;
  date: string;
  class: number;
  subject: string;
  task: string;
  authorId: string;
}

interface QuizEntry {
  id: string;
  type: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  authorId: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [seedConfirm, setSeedConfirm] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'diaries' | 'math' | 'bangla' | 'english' | 'students' | 'routine' | 'mcqs' | 'formulas' | 'writing' | 'settings' | 'rhymes'>('overview');
  const [banglaTab, setBanglaTab] = React.useState<'poems' | 'conjuncts'>('poems');
  const [mathFilter, setMathFilter] = React.useState<'all' | 'general' | 'word_problem'>('all');
  const [selectedClass, setSelectedClass] = React.useState<number>(1);
  const [diaries, setDiaries] = React.useState<DiaryEntry[]>([]);
  const [quizzes, setQuizzes] = React.useState<QuizEntry[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [poems, setPoems] = React.useState<any[]>([]);
  const [conjuncts, setConjuncts] = React.useState<any[]>([]);
  const [rhymes, setRhymes] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [routines, setRoutines] = React.useState<any[]>([]);
  const [mcqs, setMcqs] = React.useState<any[]>([]);
  const [formulas, setFormulas] = React.useState<any[]>([]);
  const [writingContent, setWritingContent] = React.useState<any[]>([]);
  const [classSettings, setClassSettings] = React.useState<any[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ collection: string, id: string } | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  // Settings State
  const [newSectionName, setNewSectionName] = React.useState('');
  const [selectedSubject, setSelectedSubject] = React.useState('english');

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Diary Form State
  const [diaryFormData, setDiaryFormData] = React.useState({
    date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
    studentId: '',
    subject: '',
    task: ''
  });

  // Math Quiz Form State
  const [quizFormData, setQuizFormData] = React.useState({
    type: 'general',
    category: 'addition',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  // Bangla Form States
  const [poemFormData, setPoemFormData] = React.useState({
    title: '',
    content: '',
    author: ''
  });

  const [conjunctFormData, setConjunctFormData] = React.useState({
    combined: '',
    broken: '',
    word: ''
  });

  const [rhymeFormData, setRhymeFormData] = React.useState({
    title: '',
    content: '',
    videoUrl: ''
  });

  // Student Form State
  const [studentFormData, setStudentFormData] = React.useState({
    name: '',
    class: 1,
    uniqueId: ''
  });

  // Routine Form State
  const [routineFormData, setRoutineFormData] = React.useState({
    class: 1,
    day: 'Sunday',
    subjects: ''
  });

  // MCQ Form State
  const [mcqFormData, setMcqFormData] = React.useState({
    class: 3,
    subject: 'society',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  // Formula Form State
  const [formulaFormData, setFormulaFormData] = React.useState({
    title: '',
    content: '',
    class: 6,
    studentId: 'all' // 'all' or specific student ID
  });

  // Writing Form State
  const [writingFormData, setWritingFormData] = React.useState({
    title: '',
    content: '',
    type: 'paragraph' as 'paragraph' | 'story' | 'dialogue' | 'composition' | 'letter' | 'email',
    class: 6,
    studentId: 'all' // 'all' or specific student ID
  });

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user || user.isAnonymous) {
        navigate('/login');
        return;
      }
      
      // Check if user is in users collection (teacher/admin)
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          // Not a teacher/admin, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        navigate('/');
      }
    });

    let unsubscribeDiaries = () => {};
    let unsubscribeQuizzes = () => {};
    let unsubscribePoems = () => {};
    let unsubscribeConjuncts = () => {};
    let unsubscribeStudents = () => {};
    let unsubscribeRoutines = () => {};
    let unsubscribeMcqs = () => {};
    let unsubscribeFormulas = () => {};
    let unsubscribeWriting = () => {};
    let unsubscribeSettings = () => {};
    let unsubscribeRhymes = () => {};

    const settingsQ = query(collection(db, 'class_settings'));
    unsubscribeSettings = onSnapshot(settingsQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassSettings(data);
    });

    // Fetch all counts for overview
    const fetchOverviewData = async () => {
      if (activeTab !== 'overview') return;
      setLoading(true);
      try {
        const collections = ['diaries', 'math_quizzes', 'students', 'routines', 'mcqs', 'formulas', 'writing_content'];
        const counts: Record<string, number> = {};
        
        for (const col of collections) {
          const snapshot = await getDocs(collection(db, col));
          counts[col] = snapshot.size;
        }
        
        setStats([
          { name: 'Diaries', value: counts['diaries'] || 0, icon: BookOpen, color: 'bg-emerald-500' },
          { name: 'Quizzes', value: counts['math_quizzes'] || 0, icon: Calculator, color: 'bg-blue-500' },
          { name: 'Students', value: counts['students'] || 0, icon: GraduationCap, color: 'bg-purple-500' },
          { name: 'Routines', value: counts['routines'] || 0, icon: Calendar, color: 'bg-orange-500' },
          { name: 'MCQs', value: counts['mcqs'] || 0, icon: CheckCircle2, color: 'bg-indigo-500' },
          { name: 'Formulas', value: counts['formulas'] || 0, icon: Sigma, color: 'bg-pink-500' },
          { name: 'Writing', value: counts['writing_content'] || 0, icon: PenTool, color: 'bg-teal-500' },
        ]);

        setChartData([
          { name: 'Diaries', value: counts['diaries'] || 0 },
          { name: 'Quizzes', value: counts['math_quizzes'] || 0 },
          { name: 'Students', value: counts['students'] || 0 },
          { name: 'MCQs', value: counts['mcqs'] || 0 },
          { name: 'Writing', value: counts['writing_content'] || 0 },
        ]);
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'overview') {
      fetchOverviewData();
    } else if (activeTab === 'rhymes') {
      const q = query(collection(db, 'english_rhymes'));
      unsubscribeRhymes = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedData = data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setRhymes(sortedData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'english_rhymes');
        setLoading(false);
      });
    } else if (activeTab === 'diaries') {
      const q = query(
        collection(db, 'diaries'),
        where('class', '==', selectedClass)
      );
      unsubscribeDiaries = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DiaryEntry[];
        // Sort in memory to avoid index requirement
        const sortedData = data.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setDiaries(sortedData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'diaries');
        setLoading(false);
      });
      
      const studentsQ = query(
        collection(db, 'students'),
        where('class', '==', selectedClass)
      );
      unsubscribeStudents = onSnapshot(studentsQ, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'students');
      });
    } else if (activeTab === 'math') {
      const q = query(
        collection(db, 'math_quizzes')
      );
      unsubscribeQuizzes = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort in memory to avoid index requirement
        const sortedData = data.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setQuizzes(sortedData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'math_quizzes');
        setLoading(false);
      });
    } else if (activeTab === 'bangla') {
      if (banglaTab === 'poems') {
        const q = query(collection(db, 'bangla_poems'));
        unsubscribePoems = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sortedData = data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setPoems(sortedData);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'bangla_poems');
          setLoading(false);
        });
      } else {
        const q = query(collection(db, 'bangla_conjuncts'));
        unsubscribeConjuncts = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sortedData = data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setConjuncts(sortedData);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'bangla_conjuncts');
          setLoading(false);
        });
      }
    } else if (activeTab === 'students') {
      const q = query(collection(db, 'students'), where('class', '==', selectedClass));
      unsubscribeStudents = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'students');
        setLoading(false);
      });
    } else if (activeTab === 'routine') {
      const q = query(collection(db, 'routines'), where('class', '==', selectedClass));
      unsubscribeRoutines = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRoutines(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'routines');
        setLoading(false);
      });
    } else if (activeTab === 'mcqs') {
      const q = query(collection(db, 'mcqs'), where('class', '==', selectedClass));
      unsubscribeMcqs = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMcqs(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'mcqs');
        setLoading(false);
      });
    } else if (activeTab === 'formulas') {
      const q = query(collection(db, 'formulas'), where('class', '==', selectedClass));
      unsubscribeFormulas = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFormulas(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'formulas');
        setLoading(false);
      });
    } else if (activeTab === 'writing') {
      const q = query(collection(db, 'writing_content'), where('class', '==', selectedClass));
      unsubscribeWriting = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWritingContent(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'writing_content');
        setLoading(false);
      });
    }

    return () => {
      unsubscribeAuth();
      unsubscribeDiaries();
      unsubscribeQuizzes();
      unsubscribePoems();
      unsubscribeConjuncts();
      unsubscribeStudents();
      unsubscribeRoutines();
      unsubscribeMcqs();
      unsubscribeFormulas();
      unsubscribeWriting();
      unsubscribeSettings();
      unsubscribeRhymes();
    };
  }, [selectedClass, activeTab, banglaTab, navigate]);

  const handleToggleSection = async (cls: number, subject: string, section: string) => {
    const setting = classSettings.find(s => s.class === cls && s.subject === subject);
    try {
      if (setting) {
        const enabled = setting.enabledSections || [];
        const newEnabled = enabled.includes(section)
          ? enabled.filter((s: string) => s !== section)
          : [...enabled, section];
        
        await updateDoc(doc(db, 'class_settings', setting.id), {
          enabledSections: newEnabled,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'class_settings'), {
          class: cls,
          subject,
          enabledSections: [section],
          updatedAt: new Date().toISOString()
        });
      }
      setSuccessMessage("সেকশন আপডেট করা হয়েছে!");
    } catch (err) {
      console.error("Error toggling section:", err);
      setSuccessMessage("সেকশন আপডেট করতে সমস্যা হয়েছে।");
    }
  };

  const handleAddCustomSection = async (cls: number, subject: string) => {
    if (!newSectionName.trim()) return;
    await handleToggleSection(cls, subject, newSectionName.trim().toLowerCase());
    setNewSectionName('');
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const [seeding, setSeeding] = React.useState(false);
  const [class1SeedConfirm, setClass1SeedConfirm] = React.useState(false);

  const seedClass1MathData = async () => {
    if (!auth.currentUser) {
      console.error("No user logged in for seeding");
      setSuccessMessage("দয়া করে আগে লগইন করুন।");
      return;
    }
    
    setClass1SeedConfirm(false);
    setSeeding(true);
    console.log("Starting Class 1 math data seeding for user:", auth.currentUser.uid);
    
    const class1Data = [
      { type: 'word_problem', category: 'general', question: 'নিশির ৮টি খেলনা ছিল। সে তার ভাইকে ৫টি খেলনা দিল। এখন তার কাছে কয়টি খেলনা রইল?', options: ['২টি', '৩টি', '৪টি', '৫টি'], correctAnswer: '৩টি' },
      { type: 'word_problem', category: 'general', question: 'একটি গাছের ডালে ৭টি পাখি বসেছিল। পরে ৪টি পাখি উড়ে গেল। গাছে কয়টি পাখি থাকল?', options: ['২টি', '৩টি', '৪টি', '৫টি'], correctAnswer: '৩টি' },
      { type: 'word_problem', category: 'general', question: 'রুমার ৮টি কাগজের পাতা ছিল। সে ৩টি পাতায় লিখে ফেলল। তার কয়টি কাগজের পাতা লেখা বাকি রইল?', options: ['৩টি', '৪টি', '৫টি', '৬টি'], correctAnswer: '৫টি' },
      { type: 'word_problem', category: 'general', question: 'একটি শ্রেণিকক্ষে ৯ জন ছাত্র-ছাত্রী বসে আছে। তাদের মধ্যে ৫ জন ছাত্রী। শ্রেণিকক্ষে কয়জন ছাত্র আছে?', options: ['৩ জন', '৪ জন', '৫ জন', '৬ জন'], correctAnswer: '৪ জন' },
      { type: 'word_problem', category: 'general', question: 'মেহজাবিন বাগান থেকে ১০টি ফুল তুলল। সে তার ভাইকে ৫টি ফুল দিল। তার কাছে কয়টি ফুল রইল?', options: ['৪টি', '৫টি', '৬টি', '৭টি'], correctAnswer: '৫টি' },
      { type: 'word_problem', category: 'general', question: 'রাহাত ৯টি মাছ ধরেছে এবং আবিদ ৫টি মাছ ধরেছে। আবিদ কয়টি মাছ কম ধরেছে?', options: ['৩টি', '৪টি', '৫টি', '৬টি'], correctAnswer: '৪টি' },
      { type: 'word_problem', category: 'general', question: 'সাহিলার জন্মদিনে তাদের বাড়িতে ১৩ জন বন্ধু এবং ৫ জন আত্মীয় এসেছিল। জন্মদিনে তাদের বাড়িতে মোট কতজন অতিথি এসেছিল?', options: ['১৫ জন', '১৬ জন', '১৭ জন', '১৮ জন'], correctAnswer: '১৮ জন' },
      { type: 'word_problem', category: 'general', question: 'ঝড়ে অপুর বাড়িতে আম গাছ থেকে আম পড়ল। অপু ৬টি আম এবং তার বোন ১১টি আম কুড়িয়ে পেল। তারা একত্রে কতগুলো আম পেল?', options: ['১৫টি', '১৬টি', '১৭টি', '১৮টি'], correctAnswer: '১৭টি' },
      { type: 'word_problem', category: 'general', question: 'ছবি আঁকার জন্য রাকিবের ১০টি রং পেন্সিল ছিল। সে দোকান থেকে আরও ৯টি রং পেন্সিল কিনল। তার কতগুলো রং পেন্সিল হলো?', options: ['১৭টি', '১৮টি', '১৯টি', '২০টি'], correctAnswer: '১৯টি' },
      { type: 'word_problem', category: 'general', question: 'বিদ্যালয়ের মাঠে এক পাশে ৭ জন শিশু খেলা করছিল। অপর পাশে ৬ জন শিশু খেলা করছিল। মাঠে মোট কতজন শিশু খেলা করছে?', options: ['১১ জন', '১২ জন', '১৩ জন', '১৪ জন'], correctAnswer: '১৩ জন' },
      { type: 'word_problem', category: 'general', question: 'একটি ঝুড়িতে ৮টি আম এবং একটি ঝুড়িতে ৯টি আম আছে। দুটি ঝুড়িতে মোট কতটি আম আছে?', options: ['১৫টি', '১৬টি', '১৭টি', '১৮টি'], correctAnswer: '১৭টি' },
      { type: 'word_problem', category: 'general', question: 'রিমির ৭টি পেন্সিল ছিল। তার বাবা তাকে আরও ৮টি রং পেন্সিল কিনে দিলেন। তার মোট কতটি রং পেন্সিল হলো?', options: ['১৩টি', '১৪টি', '১৫টি', '১৬টি'], correctAnswer: '১৫টি' },
      { type: 'word_problem', category: 'general', question: 'শিমুর কাছে আগে ৭টি চকোলেট ছিল। তাকে আরও ৯টি চকোলেট দেওয়া হলো। এখন তার কাছে মোট কতটি চকোলেট হলো?', options: ['১৪টি', '১৫টি', '১৬টি', '১৭টি'], correctAnswer: '১৬টি' },
      { type: 'word_problem', category: 'general', question: 'রাহুল দোকান থেকে ১৫টি চকোলেট কিনল। এর থেকে ৫টি চকোলেট তার বোনকে দিল। তার কাছে কয়টি চকোলেট রইল?', options: ['৮টি', '৯টি', '১০টি', '১১টি'], correctAnswer: '১০টি' },
      { type: 'word_problem', category: 'general', question: 'দীপু ১৫টি রং পেন্সিল ছিল। সে ৫টি রং পেন্সিল তার ছোট ভাইকে দিল। তার কাছে কয়টি রং পেন্সিল রইল?', options: ['৮টি', '৯টি', '১০টি', '১১টি'], correctAnswer: '১০টি' },
      { type: 'word_problem', category: 'general', question: 'একটি শ্রেণিতে ১৮ জন ছাত্র-ছাত্রী আছে। এদের মধ্যে ১০ জন ছাত্রী। শ্রেণিতে কতজন ছাত্র আছে?', options: ['৬ জন', '৭ জন', '৮ জন', '৯ জন'], correctAnswer: '৮ জন' },
      { type: 'word_problem', category: 'general', question: 'রিয়ার মা ১৭টি পেয়ারা থেকে ৪টি রিয়াকে দিল। মায়ের কাছে কয়টি পেয়ারা রইল?', options: ['১১টি', '১২টি', '১৩টি', '১৪টি'], correctAnswer: '১৩টি' },
      { type: 'word_problem', category: 'general', question: 'মিলির ১৮টি চকোলেট আছে। এর থেকে ৮টি তার ছোট ভাইকে দিল। তার কাছে কয়টি চকোলেট রইল?', options: ['৮টি', '৯টি', '১০টি', '১১টি'], correctAnswer: '১০টি' },
      { type: 'word_problem', category: 'general', question: 'রাফি ১৫টি ডিম ও ৯টি কলা কিনল। কলা থেকে ডিম সে কয়টি বেশি কিনল?', options: ['৪টি', '৫টি', '৬টি', '৭টি'], correctAnswer: '৬টি' },
      { type: 'word_problem', category: 'general', question: 'বিজয়ের কাছে ১১টি ও অনির কাছে ৮টি রং পেন্সিল আছে। বিজয়ের কাছে কয়টি বেশি আছে?', options: ['২টি', '৩টি', '৪টি', '৫টি'], correctAnswer: '৩টি' },
      { type: 'word_problem', category: 'general', question: 'বিদ্যালয়ের একটি শ্রেণিতে ২৩ জন ছাত্র এবং ২৫ জন ছাত্রী আছে। ঐ শ্রেণিতে মোট কতজন ছাত্র-ছাত্রী আছে?', options: ['৪৬ জন', '৪৭ জন', '৪৮ জন', '৪৯ জন'], correctAnswer: '৪৮ জন' },
      { type: 'word_problem', category: 'general', question: 'তিথির ২৭টি রঙিন কাগজ আছে। বাবা তাকে আরও ৮টি রঙিন কাগজ দিলেন। তার কাছে এখন কয়টি রঙিন কাগজ হলো?', options: ['৩৩টি', '৩৪টি', '৩৫টি', '৩৬টি'], correctAnswer: '৩৫টি' },
      { type: 'word_problem', category: 'general', question: 'তানিয়ার ৩৭টি সাদা কাগজ ছিল। সে ছবি আঁকতে ১৫টি ব্যবহার করল। তার কাছে কয়টি সাদা কাগজ রইল?', options: ['২০টি', '২১টি', '২২টি', '২৩টি'], correctAnswer: '২২টি' },
      { type: 'word_problem', category: 'general', question: 'সামির নিকট ২৭ টাকা আছে। কিন্তু সে ৪৭ টাকা দামের একটি খেলনা কিনতে চায়। খেলনাটি কিনতে তার আরও কত টাকা লাগবে?', options: ['১৫ টাকা', '২০ টাকা', '২৫ টাকা', '৩০ টাকা'], correctAnswer: '২০ টাকা' },
      { type: 'word_problem', category: 'general', question: 'একটি বিদ্যালয়ের ২য় শ্রেণিতে ৩২ জন এবং ১ম শ্রেণিতে ৪৪ জন শিক্ষার্থী আছে। কোন শ্রেণিতে শিক্ষার্থীর সংখ্যা বেশি? কত বেশি?', options: ['১০ জন বেশি', '১১ জন বেশি', '১২ জন বেশি', '১৩ জন বেশি'], correctAnswer: '১২ জন বেশি' },
      { type: 'word_problem', category: 'general', question: 'সামি ৭৫ টাকা নিয়ে দোকানে গেল। সে ১টি খাতা ও ১টি কলম কিনল। দোকানদারকে ৫৩ টাকা দিল। তার কাছে কত টাকা রইল?', options: ['২০ টাকা', '২১ টাকা', '২২ টাকা', '২৩ টাকা'], correctAnswer: '২২ টাকা' },
      { type: 'word_problem', category: 'general', question: 'রিয়ার বাগানে ৫৭টি আম গাছ ও ৩৩টি কাঁঠাল গাছ আছে। তাদের বাগানে কোন গাছ বেশি আছে? কতটি বেশি আছে?', options: ['২২টি বেশি', '২৩টি বেশি', '২৪টি বেশি', '২৫টি বেশি'], correctAnswer: '২৪টি বেশি' },
      { type: 'word_problem', category: 'general', question: 'ফাহাদের কাছে ৩০ টাকা ছিল। তার বাবা তাকে কিছু টাকা দিলেন। এখন তার কাছে ৫৫ টাকা হলো। তার বাবা তাকে কত টাকা দিলেন?', options: ['২০ টাকা', '২৫ টাকা', '৩০ টাকা', '৩৫ টাকা'], correctAnswer: '২৫ টাকা' },
      { type: 'word_problem', category: 'general', question: 'বিদ্যালয়ের মাঠে ১ম শ্রেণিতে ৪৪ জন শিক্ষার্থী খেলছিল। এদের সাথে ৫ম শ্রেণির কিছু শিক্ষার্থী মাঠে খেলতে গেল। ফলে মাঠে ৯১ জন শিক্ষার্থী হলো। ৫ম শ্রেণির কতজন শিক্ষার্থী মাঠে খেলতে গেল?', options: ['৪৫ জন', '৪৬ জন', '৪৭ জন', '৪৮ জন'], correctAnswer: '৪৭ জন' },
      { type: 'word_problem', category: 'general', question: 'একটি ক্রিকেট ম্যাচে রাশিদ ৩৭ রান এবং অনিক ২২ রান করেছে। রাশিদ অনিকের চেয়ে কত রান বেশি করেছে?', options: ['১৩ রান', '১৪ রান', '১৫ রান', '১৬ রান'], correctAnswer: '১৫ রান' },
    ];

    try {
      let count = 0;
      for (const item of class1Data) {
        try {
          await addDoc(collection(db, 'math_quizzes'), {
            ...item,
            authorId: auth.currentUser?.uid,
            createdAt: new Date().toISOString()
          });
          count++;
        } catch (itemErr) {
          console.error(`Error seeding class 1 item ${count + 1}:`, itemErr);
        }
      }
      console.log("Class 1 Seeding complete! Total items added:", count);
      setSuccessMessage(`ক্লাস ১ এর ${toBanglaNumber(count)} টি প্রশ্ন সফলভাবে যোগ করা হয়েছে!`);
    } catch (err) {
      console.error("Class 1 Seeding error:", err);
      setSuccessMessage("ডাটা যোগ করতে সমস্যা হয়েছে।");
    } finally {
      setSeeding(false);
    }
  };

  const seedMathData = async () => {
    if (!auth.currentUser) {
      console.error("No user logged in for seeding");
      setSuccessMessage("দয়া করে আগে লগইন করুন।");
      return;
    }
    
    setSeedConfirm(false);
    setSeeding(true);
    console.log("Starting math data seeding for user:", auth.currentUser.uid);
    
    const sampleData = [
      // Addition (10)
      { type: 'general', category: 'addition', question: '12 + 15', options: ['25', '27', '30', '22'], correctAnswer: '27' },
      { type: 'general', category: 'addition', question: '45 + 32', options: ['70', '77', '80', '75'], correctAnswer: '77' },
      { type: 'general', category: 'addition', question: '88 + 11', options: ['90', '99', '100', '89'], correctAnswer: '99' },
      { type: 'general', category: 'addition', question: '67 + 23', options: ['80', '90', '100', '85'], correctAnswer: '90' },
      { type: 'general', category: 'addition', question: '150 + 250', options: ['300', '400', '500', '350'], correctAnswer: '400' },
      { type: 'general', category: 'addition', question: '99 + 1', options: ['90', '100', '110', '101'], correctAnswer: '100' },
      { type: 'general', category: 'addition', question: '54 + 46', options: ['90', '100', '110', '95'], correctAnswer: '100' },
      { type: 'general', category: 'addition', question: '25 + 75', options: ['90', '100', '110', '80'], correctAnswer: '100' },
      { type: 'general', category: 'addition', question: '123 + 456', options: ['500', '579', '600', '550'], correctAnswer: '579' },
      { type: 'general', category: 'addition', question: '10 + 20', options: ['20', '30', '40', '25'], correctAnswer: '30' },
      // Subtraction (10)
      { type: 'general', category: 'subtraction', question: '50 - 25', options: ['20', '25', '30', '15'], correctAnswer: '25' },
      { type: 'general', category: 'subtraction', question: '100 - 45', options: ['50', '55', '60', '45'], correctAnswer: '55' },
      { type: 'general', category: 'subtraction', question: '88 - 33', options: ['50', '55', '60', '45'], correctAnswer: '55' },
      { type: 'general', category: 'subtraction', question: '200 - 150', options: ['40', '50', '60', '30'], correctAnswer: '50' },
      { type: 'general', category: 'subtraction', question: '75 - 25', options: ['40', '50', '60', '30'], correctAnswer: '50' },
      { type: 'general', category: 'subtraction', question: '99 - 9', options: ['80', '90', '100', '85'], correctAnswer: '90' },
      { type: 'general', category: 'subtraction', question: '45 - 12', options: ['30', '33', '35', '25'], correctAnswer: '33' },
      { type: 'general', category: 'subtraction', question: '1000 - 500', options: ['400', '500', '600', '450'], correctAnswer: '500' },
      { type: 'general', category: 'subtraction', question: '67 - 23', options: ['40', '44', '50', '35'], correctAnswer: '44' },
      { type: 'general', category: 'subtraction', question: '30 - 15', options: ['10', '15', '20', '5'], correctAnswer: '15' },
      // Multiplication (10)
      { type: 'general', category: 'multiplication', question: '5 * 5', options: ['20', '25', '30', '15'], correctAnswer: '25' },
      { type: 'general', category: 'multiplication', question: '12 * 3', options: ['30', '36', '40', '32'], correctAnswer: '36' },
      { type: 'general', category: 'multiplication', question: '10 * 10', options: ['90', '100', '110', '101'], correctAnswer: '100' },
      { type: 'general', category: 'multiplication', question: '8 * 7', options: ['50', '56', '60', '45'], correctAnswer: '56' },
      { type: 'general', category: 'multiplication', question: '9 * 6', options: ['50', '54', '60', '45'], correctAnswer: '54' },
      { type: 'general', category: 'multiplication', question: '15 * 2', options: ['25', '30', '35', '20'], correctAnswer: '30' },
      { type: 'general', category: 'multiplication', question: '25 * 4', options: ['90', '100', '110', '80'], correctAnswer: '100' },
      { type: 'general', category: 'multiplication', question: '11 * 11', options: ['110', '121', '130', '111'], correctAnswer: '121' },
      { type: 'general', category: 'multiplication', question: '13 * 3', options: ['30', '39', '40', '33'], correctAnswer: '39' },
      { type: 'general', category: 'multiplication', question: '20 * 5', options: ['90', '100', '110', '80'], correctAnswer: '100' },
      // Division (10)
      { type: 'general', category: 'division', question: '100 / 4', options: ['20', '25', '30', '15'], correctAnswer: '25' },
      { type: 'general', category: 'division', question: '50 / 2', options: ['20', '25', '30', '15'], correctAnswer: '25' },
      { type: 'general', category: 'division', question: '81 / 9', options: ['7', '9', '10', '8'], correctAnswer: '9' },
      { type: 'general', category: 'division', question: '60 / 5', options: ['10', '12', '15', '11'], correctAnswer: '12' },
      { type: 'general', category: 'division', question: '144 / 12', options: ['10', '12', '15', '11'], correctAnswer: '12' },
      { type: 'general', category: 'division', question: '30 / 3', options: ['8', '10', '12', '9'], correctAnswer: '10' },
      { type: 'general', category: 'division', question: '45 / 5', options: ['7', '9', '10', '8'], correctAnswer: '9' },
      { type: 'general', category: 'division', question: '100 / 10', options: ['8', '10', '12', '9'], correctAnswer: '10' },
      { type: 'general', category: 'division', question: '25 / 5', options: ['4', '5', '6', '3'], correctAnswer: '5' },
      { type: 'general', category: 'division', question: '10 / 2', options: ['4', '5', '6', '3'], correctAnswer: '5' },
      // Word Problems (10)
      { type: 'word_problem', category: 'general', question: 'তোমার কাছে ৫টি আম আছে, তোমার বন্ধু আরও ৩টি দিল। এখন কয়টি আম আছে?', options: ['৭', '৮', '৯', '৬'], correctAnswer: '৮' },
      { type: 'word_problem', category: 'general', question: 'একটি গাছে ১০টি পাখি ছিল, ৪টি উড়ে গেল। কয়টি রইল?', options: ['৫', '৬', '৭', '৪'], correctAnswer: '৬' },
      { type: 'word_problem', category: 'general', question: 'তোমার কাছে ২০ টাকা আছে, তুমি ৫ টাকার চকলেট কিনলে। কত টাকা রইল?', options: ['১০', '১৫', '২৫', '১২'], correctAnswer: '১৫' },
      { type: 'word_problem', category: 'general', question: 'এক ডজন কলায় ১২টি থাকে। ৩ ডজনে কয়টি?', options: ['২৪', '৩৬', '৪৮', '৩০'], correctAnswer: '৩৬' },
      { type: 'word_problem', category: 'general', question: 'তোমার কাছে ৭টি কলম আছে। বাবা আরও ১০টি দিল। এখন কতটি আছে?', options: ['১৫', '১৭', '২০', '১৩'], correctAnswer: '১৭' },
      { type: 'word_problem', category: 'general', question: '৫টি ঝুড়িতে ৫টি করে আপেল আছে। মোট কয়টি?', options: ['২০', '২৫', '৩০', '১৫'], correctAnswer: '২৫' },
      { type: 'word_problem', category: 'general', question: '১০টি বিস্কুট ৫ জন বন্ধুর মধ্যে সমানভাবে ভাগ করলে প্রত্যেকে কয়টি পাবে?', options: ['১', '২', '৩', '৫'], correctAnswer: '২' },
      { type: 'word_problem', category: 'general', question: 'তোমার কাছে ১৫টি মার্বেল আছে, তুমি ৫টি হারিয়ে ফেললে। কয়টি রইল?', options: ['৫', '১০', '১৫', '৮'], correctAnswer: '১০' },
      { type: 'word_problem', category: 'general', question: 'একটি বইয়ের দাম ৫০ টাকা। ২টি বইয়ের দাম কত?', options: ['৮০', '১০০', '১২০', '৭৫'], correctAnswer: '১০০' },
      { type: 'word_problem', category: 'general', question: 'তোমার কাছে ৮টি লজেন্স আছে, মা আরও ৪টি দিল। কয়টি হলো?', options: ['১০', '১২', '১৪', '১১'], correctAnswer: '১২' },
    ];

    try {
      let count = 0;
      console.log("Starting math data seeding for user:", auth.currentUser?.uid);
      for (const item of sampleData) {
        try {
          await addDoc(collection(db, 'math_quizzes'), {
            ...item,
            authorId: auth.currentUser?.uid,
            createdAt: new Date().toISOString()
          });
          count++;
        } catch (itemErr) {
          console.error(`Error seeding item ${count + 1}:`, itemErr);
        }
        if (count % 10 === 0) console.log(`Seeded ${count} items...`);
      }
      console.log("Seeding complete! Total items added:", count);
      setSuccessMessage(`${toBanglaNumber(count)} টি স্যাম্পল ডাটা সফলভাবে যোগ করা হয়েছে!`);
    } catch (err) {
      console.error("Seeding error:", err);
      setSuccessMessage("ডাটা যোগ করতে সমস্যা হয়েছে।");
    } finally {
      setSeeding(false);
    }
  };

  const handleStudentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'students', editingId), {
          ...studentFormData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addDoc(collection(db, 'students'), {
          ...studentFormData,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setStudentFormData({ name: '', class: 1, uniqueId: '' });
      setSuccessMessage("Student saved successfully!");
    } catch (err) {
      console.error("Error saving student:", err);
      setSuccessMessage("Error saving student.");
    }
  };

  const handleRoutineSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'routines', editingId), {
          ...routineFormData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addDoc(collection(db, 'routines'), {
          ...routineFormData,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setRoutineFormData({ class: 1, day: 'Sunday', subjects: '' });
      setSuccessMessage("Routine saved successfully!");
    } catch (err) {
      console.error("Error saving routine:", err);
      setSuccessMessage("Error saving routine.");
    }
  };

  const handleMcqSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'mcqs', editingId), {
          ...mcqFormData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addDoc(collection(db, 'mcqs'), {
          ...mcqFormData,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setMcqFormData({ class: 3, subject: 'society', question: '', options: ['', '', '', ''], correctAnswer: '' });
      setSuccessMessage("MCQ saved successfully!");
    } catch (err) {
      console.error("Error saving MCQ:", err);
      setSuccessMessage("Error saving MCQ.");
    }
  };

  const handleFormulaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'formulas', editingId), {
          ...formulaFormData,
          class: selectedClass,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addDoc(collection(db, 'formulas'), {
          ...formulaFormData,
          class: selectedClass,
          authorId: auth.currentUser.uid,
          authorName: 'Admin',
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setFormulaFormData({ title: '', content: '', class: selectedClass, studentId: 'all' });
      setSuccessMessage("Formula saved successfully!");
    } catch (err) {
      console.error("Error saving formula:", err);
      setSuccessMessage("Error saving formula.");
    }
  };

  const handleWritingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'writing_content', editingId), {
          ...writingFormData,
          class: selectedClass,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addDoc(collection(db, 'writing_content'), {
          ...writingFormData,
          class: selectedClass,
          authorId: auth.currentUser.uid,
          authorName: 'Admin',
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setWritingFormData({ title: '', content: '', type: 'paragraph', class: selectedClass, studentId: 'all' });
      setSuccessMessage("Writing content saved successfully!");
    } catch (err) {
      console.error("Error saving writing content:", err);
      setSuccessMessage("Error saving writing content.");
    }
  };

  const handleRhymeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'english_rhymes', editingId), {
          ...rhymeFormData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addDoc(collection(db, 'english_rhymes'), {
          ...rhymeFormData,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setRhymeFormData({ title: '', content: '', videoUrl: '' });
      setSuccessMessage("Rhyme saved successfully!");
    } catch (err) {
      console.error("Error saving rhyme:", err);
      setSuccessMessage("Error saving rhyme.");
    }
  };

  const handleDiarySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'diaries', editingId), {
          ...diaryFormData,
          class: selectedClass,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addDoc(collection(db, 'diaries'), {
          ...diaryFormData,
          class: selectedClass,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setDiaryFormData({
        date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
        studentId: '',
        subject: '',
        task: ''
      });
      setSuccessMessage("সফলভাবে সেভ করা হয়েছে!");
    } catch (err) {
      console.error("Error saving diary:", err);
      setSuccessMessage("সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handleQuizSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'math_quizzes', editingId), {
          ...quizFormData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'math_quizzes'), {
          ...quizFormData,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setQuizFormData({
        type: 'general',
        category: 'addition',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: ''
      });
      setSuccessMessage("সফলভাবে সেভ করা হয়েছে!");
    } catch (err) {
      console.error("Error saving quiz:", err);
      setSuccessMessage("সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handlePoemSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'bangla_poems', editingId), {
          ...poemFormData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'bangla_poems'), {
          ...poemFormData,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setPoemFormData({ title: '', content: '', author: '' });
      setSuccessMessage("সফলভাবে সেভ করা হয়েছে!");
    } catch (err) {
      console.error("Error saving poem:", err);
      setSuccessMessage("সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handleConjunctSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'bangla_conjuncts', editingId), {
          ...conjunctFormData,
          updatedAt: new Date().toISOString()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'bangla_conjuncts'), {
          ...conjunctFormData,
          authorId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setConjunctFormData({ combined: '', broken: '', word: '' });
      setSuccessMessage("সফলভাবে সেভ করা হয়েছে!");
    } catch (err) {
      console.error("Error saving conjunct:", err);
      setSuccessMessage("সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    setDeleteConfirm({ collection: collectionName, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { collection: collectionName, id } = deleteConfirm;
    
    console.log(`Attempting to delete ${id} from ${collectionName}`);
    try {
      await deleteDoc(doc(db, collectionName, id));
      console.log(`Successfully deleted ${id}`);
      setDeleteConfirm(null);
      setSuccessMessage("সফলভাবে ডিলিট করা হয়েছে!");
    } catch (err) {
      console.error("Error deleting document:", err);
      setSuccessMessage("ডিলিট করতে সমস্যা হয়েছে।");
      setDeleteConfirm(null);
    }
  };

  const startDiaryEdit = (diary: DiaryEntry) => {
    console.log("Starting edit for diary:", diary.id);
    setEditingId(diary.id);
    setDiaryFormData({
      date: diary.date ? diary.date.split('T')[0] : format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
      subject: diary.subject,
      task: diary.task
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startQuizEdit = (quiz: any) => {
    setEditingId(quiz.id);
    setQuizFormData({
      type: quiz.type,
      category: quiz.category,
      question: quiz.question,
      options: [...quiz.options],
      correctAnswer: quiz.correctAnswer
    });
    setIsAdding(true);
  };

  const startPoemEdit = (poem: any) => {
    setEditingId(poem.id);
    setPoemFormData({
      title: poem.title,
      content: poem.content,
      author: poem.author || ''
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startConjunctEdit = (conjunct: any) => {
    setEditingId(conjunct.id);
    setConjunctFormData({
      combined: conjunct.combined,
      broken: conjunct.broken,
      word: conjunct.word
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startStudentEdit = (student: any) => {
    setEditingId(student.id);
    setStudentFormData({
      name: student.name,
      class: student.class,
      uniqueId: student.uniqueId
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startRoutineEdit = (routine: any) => {
    setEditingId(routine.id);
    setRoutineFormData({
      class: routine.class,
      day: routine.day,
      subjects: routine.subjects
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startMcqEdit = (mcq: any) => {
    setEditingId(mcq.id);
    setMcqFormData({
      class: mcq.class,
      subject: mcq.subject,
      question: mcq.question,
      options: [...mcq.options],
      correctAnswer: mcq.correctAnswer
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startFormulaEdit = (formula: any) => {
    setEditingId(formula.id);
    setFormulaFormData({
      title: formula.title,
      content: formula.content,
      class: formula.class,
      studentId: formula.studentId || 'all'
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startWritingEdit = (writing: any) => {
    setEditingId(writing.id);
    setWritingFormData({
      title: writing.title,
      content: writing.content,
      type: writing.type,
      class: writing.class,
      studentId: writing.studentId || 'all'
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startRhymeEdit = (rhyme: any) => {
    setEditingId(rhyme.id);
    setRhymeFormData({
      title: rhyme.title,
      content: rhyme.content,
      videoUrl: rhyme.videoUrl || ''
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'diaries', label: 'Daily Diaries', icon: BookOpen },
    { id: 'math', label: 'Math Quizzes', icon: Calculator },
    { id: 'bangla', label: 'Bangla Section', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'routine', label: 'Routine', icon: Calendar },
    { id: 'mcqs', label: 'MCQs', icon: CheckCircle2 },
    { id: 'formulas', label: 'Formulas', icon: Calculator },
    { id: 'writing', label: 'English Writing', icon: FileText },
    { id: 'rhymes', label: 'English Rhymes', icon: Feather },
    { id: 'settings', label: 'Class Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className="space-y-6 lg:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 flex items-center space-x-4"
          >
            <div className={cn("p-4 rounded-2xl text-white shadow-lg", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900">{toBanglaNumber(stat.value)}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="premium-card p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>সাপ্তাহিক অ্যাক্টিভিটি</span>
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-primary" />
            <span>সেকশন ভিত্তিক ডাটা</span>
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRhymes = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rhymes.map((rhyme) => (
          <motion.div
            key={rhyme.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card p-6 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Feather className="h-6 w-6 text-primary" />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startRhymeEdit(rhyme)}
                  className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete('english_rhymes', rhyme.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{rhyme.title}</h3>
            <p className="text-text-muted text-sm line-clamp-3 mb-4 whitespace-pre-line">
              {rhyme.content}
            </p>
            {rhyme.videoUrl && (
              <div className="text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full inline-block">
                Video Attached
              </div>
            )}
          </motion.div>
        ))}
      </div>
      {rhymes.length === 0 && <EmptyState message="No rhymes found" />}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="premium-card p-4 lg:p-8">
        <h2 className="text-xl lg:text-2xl font-bold mb-6 flex items-center space-x-2">
          <Settings className="h-6 w-6 text-primary" />
          <span>Class & Subject Settings</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setSelectedClass(i + 1)}
                  className={cn(
                    "py-2 rounded-xl font-medium transition-all",
                    selectedClass === i + 1 ? "bg-primary text-white" : "bg-gray-50 text-text-muted hover:bg-gray-100"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Subject</label>
            <div className="flex space-x-2">
              {['bangla', 'english', 'math'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-medium transition-all capitalize",
                    selectedSubject === sub ? "bg-primary text-white" : "bg-gray-50 text-text-muted hover:bg-gray-100"
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="premium-card p-4 lg:p-8">
          <h3 className="text-lg font-bold mb-6">Manage Sections for Class {selectedClass} - {selectedSubject}</h3>
          <div className="space-y-4">
            {/* Default Sections */}
            <div className="p-3 lg:p-4 bg-gray-50 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Default Sections</h4>
              {['quiz', 'test', 'paragraph', 'formula'].map((section) => {
                const setting = classSettings.find(s => s.class === selectedClass && s.subject === selectedSubject);
                const isEnabled = setting?.enabledSections?.includes(section) ?? false;
                return (
                  <div key={section} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                    <span className="font-medium capitalize">{section}</span>
                    <button
                      onClick={() => handleToggleSection(selectedClass, selectedSubject, section)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                        isEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom Sections */}
            <div className="p-3 lg:p-4 bg-primary/5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Custom Sections</h4>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="New section name..."
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="premium-input text-sm py-2 px-3"
                />
                <button
                  onClick={() => handleAddCustomSection(selectedClass, selectedSubject)}
                  className="premium-button-primary py-2 px-3 lg:px-4 text-xs lg:text-sm whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              {classSettings.find(s => s.class === selectedClass && s.subject === selectedSubject)?.enabledSections && 
                classSettings.find(s => s.class === selectedClass && s.subject === selectedSubject).enabledSections
                  .filter((name: string) => !['quiz', 'test', 'paragraph', 'formula'].includes(name))
                  .map((name: string) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/10">
                      <span className="font-medium capitalize">{name}</span>
                      <button
                        onClick={() => handleToggleSection(selectedClass, selectedSubject, name)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-primary/10 text-primary"
                      >
                        Enabled
                      </button>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        <div className="premium-card p-8 bg-primary/5 border-primary/10">
          <h3 className="text-lg font-bold mb-4">How it works?</h3>
          <p className="text-sm text-primary/80 leading-relaxed space-y-4">
            এখানে আপনি প্রতিটি ক্লাসের প্রতিটি বিষয়ের জন্য আলাদা আলাদা সেকশন সেট করতে পারবেন। 
            <br /><br />
            ১. ডিফল্ট সেকশনগুলো (Quiz, Test, Paragraph, Formula) আপনি চাইলে অন বা অফ করতে পারেন। 
            <br /><br />
            ২. আপনার যদি নতুন কোনো সেকশন প্রয়োজন হয় (যেমন: "রচনা সমূহ", "দরখাস্ত সমূহ"), তবে আপনি তা "Custom Sections" এ এড করতে পারেন। 
            <br /><br />
            ৩. স্টুডেন্টরা তাদের ড্যাশবোর্ডে শুধুমাত্র আপনার এনাবল করা সেকশনগুলোই দেখতে পাবে।
          </p>
        </div>
      </div>
    </div>
  );

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 80,
          x: typeof window !== 'undefined' && window.innerWidth < 1024 
            ? (isMobileMenuOpen ? 0 : -280) 
            : 0
        }}
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 overflow-hidden transition-all duration-300",
          !isSidebarOpen && "lg:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-3"
                >
                  <div className="bg-primary p-2 rounded-xl">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-display font-bold text-xl">Admin</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(false);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="lg:hidden h-6 w-6 text-gray-500" />
              <Menu className="hidden lg:block h-5 w-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsAdding(false);
                  setEditingId(null);
                  if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all group",
                  activeTab === item.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-text-muted hover:bg-gray-50 hover:text-primary"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0",
                  activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-primary"
                )} />
                <AnimatePresence mode="wait">
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-w-0",
        isSidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]",
        "ml-0"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 capitalize truncate max-w-[150px] lg:max-w-none">
                {sidebarItems.find(i => i.id === activeTab)?.label}
              </h2>
              <p className="text-xs lg:text-sm text-text-muted hidden sm:block">Welcome back, Administrator</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <Link 
              to="/"
              className="p-2 lg:px-4 lg:py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center space-x-2"
              title="View Site"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View Site</span>
            </Link>
            
            {activeTab !== 'overview' && activeTab !== 'settings' && (
              <button 
                onClick={() => {
                  setIsAdding(!isAdding);
                  setEditingId(null);
                  if (activeTab === 'rhymes') setRhymeFormData({ title: '', content: '', videoUrl: '' });
                }}
                className="premium-button-primary py-2 px-3 lg:px-4 flex items-center space-x-2 text-xs lg:text-sm"
              >
                {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span>{isAdding ? "Cancel" : "Add New"}</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Modals & Toasts */}
          <AnimatePresence>
            {seedConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                >
                  <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Calculator className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">স্যাম্পল ডাটা যোগ করবেন?</h3>
                  <p className="text-text-muted text-center mb-8">আপনি কি প্রতিটি সেকশনে ১০টি করে স্যাম্পল ম্যাথ এড করতে চান?</p>
                  <div className="flex space-x-4">
                    <button onClick={() => setSeedConfirm(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">না</button>
                    <button onClick={seedMathData} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">হ্যাঁ, যোগ করুন</button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-8 right-8 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3"
              >
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="font-medium">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content Logic */}
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' ? (
              renderOverview()
            ) : activeTab === 'settings' ? (
              renderSettings()
            ) : (
              <div className="space-y-8">
                {/* Filters for specific tabs */}
                {['diaries', 'students', 'routine', 'mcqs', 'formulas', 'writing'].includes(activeTab) && (
                  <div className="premium-card p-4 lg:p-6 flex flex-col space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Filter className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class Filter</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[...Array(10)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setSelectedClass(i + 1)}
                          className={cn(
                            "w-10 h-10 lg:w-12 lg:h-12 rounded-xl font-bold transition-all flex items-center justify-center",
                            selectedClass === i + 1
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Forms Section */}
                <AnimatePresence>
                  {isAdding && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="premium-card p-8 border-2 border-primary/20"
                    >
                {activeTab === 'diaries' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <BookOpen className="text-primary h-6 w-6" />
                      <span>{editingId ? "Edit Diary Entry" : "Create New Diary Entry"}</span>
                    </h2>
                    <form onSubmit={handleDiarySave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                          <input 
                            type="date"
                            required
                            value={diaryFormData.date}
                            onChange={(e) => setDiaryFormData({...diaryFormData, date: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Student</label>
                          <select
                            required
                            value={diaryFormData.studentId}
                            onChange={(e) => setDiaryFormData({...diaryFormData, studentId: e.target.value})}
                            className="premium-input"
                          >
                            <option value="">Select Student</option>
                            {students.map(student => (
                              <option key={student.id} value={student.id}>{student.name} (ID: {student.uniqueId})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Mathematics"
                            value={diaryFormData.subject}
                            onChange={(e) => setDiaryFormData({...diaryFormData, subject: e.target.value})}
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
                          value={diaryFormData.task}
                          onChange={(e) => setDiaryFormData({...diaryFormData, task: e.target.value})}
                          className="premium-input resize-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update Diary" : "Publish Diary"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : activeTab === 'math' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <Calculator className="text-primary h-6 w-6" />
                      <span>{editingId ? "Edit Math Quiz" : "Create New Math Quiz"}</span>
                    </h2>
                    <form onSubmit={handleQuizSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Type</label>
                          <select 
                            value={quizFormData.type}
                            onChange={(e) => setQuizFormData({...quizFormData, type: e.target.value, category: e.target.value === 'word_problem' ? 'word' : 'addition'})}
                            className="premium-input"
                          >
                            <option value="general">General Math (MCQ)</option>
                            <option value="word_problem">Word Problem (গাণিতিক অঙ্ক)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                          <select 
                            value={quizFormData.category}
                            onChange={(e) => setQuizFormData({...quizFormData, category: e.target.value})}
                            className="premium-input"
                          >
                            {quizFormData.type === 'general' ? (
                              <>
                                <option value="addition">Addition (যোগ)</option>
                                <option value="subtraction">Subtraction (বিয়োগ)</option>
                                <option value="multiplication">Multiplication (গুণ)</option>
                                <option value="division">Division (ভাগ)</option>
                              </>
                            ) : (
                              <option value="word">Word Problem (গল্পের অঙ্ক)</option>
                            )}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
                        <textarea 
                          required
                          rows={2}
                          placeholder={quizFormData.type === 'general' ? "e.g. 15 + 25" : "e.g. তোমার ৭ টি কলম আছে । বাবা আরো ১০ টি কলম দিলো এখন কতটি কলম আছে।"}
                          value={quizFormData.question}
                          onChange={(e) => setQuizFormData({...quizFormData, question: e.target.value})}
                          className="premium-input resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quizFormData.options.map((opt, idx) => (
                          <div key={idx}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Option {idx + 1}</label>
                            <input 
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...quizFormData.options];
                                newOpts[idx] = e.target.value;
                                setQuizFormData({...quizFormData, options: newOpts});
                              }}
                              className="premium-input text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer (Must match one of the options)</label>
                        <input 
                          type="text"
                          required
                          value={quizFormData.correctAnswer}
                          onChange={(e) => setQuizFormData({...quizFormData, correctAnswer: e.target.value})}
                          className="premium-input"
                          placeholder="Copy the correct option here"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update Quiz" : "Save Quiz"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : activeTab === 'bangla' ? (
                  banglaTab === 'poems' ? (
                    <>
                      <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                        <BookOpen className="text-purple-500 h-6 w-6" />
                        <span>{editingId ? "Edit Poem" : "Add New Poem"}</span>
                      </h2>
                      <form onSubmit={handlePoemSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. আমাদের ছোট নদী"
                              value={poemFormData.title}
                              onChange={(e) => setPoemFormData({...poemFormData, title: e.target.value})}
                              className="premium-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Author (Optional)</label>
                            <input 
                              type="text"
                              placeholder="e.g. রবীন্দ্রনাথ ঠাকুর"
                              value={poemFormData.author}
                              onChange={(e) => setPoemFormData({...poemFormData, author: e.target.value})}
                              className="premium-input"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                          <textarea 
                            required
                            rows={6}
                            placeholder="Enter poem content here..."
                            value={poemFormData.content}
                            onChange={(e) => setPoemFormData({...poemFormData, content: e.target.value})}
                            className="premium-input resize-none"
                          />
                        </div>
                        <div className="flex justify-end space-x-4">
                          <button type="submit" className="premium-button-primary bg-purple-500 hover:bg-purple-600 shadow-purple-200 flex items-center space-x-2">
                            <Save className="h-5 w-5" />
                            <span>{editingId ? "Update Poem" : "Save Poem"}</span>
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                        <BookOpen className="text-green-500 h-6 w-6" />
                        <span>{editingId ? "Edit Conjunct" : "Add New Conjunct"}</span>
                      </h2>
                      <form onSubmit={handleConjunctSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Combined Form</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. ক্ক"
                              value={conjunctFormData.combined}
                              onChange={(e) => setConjunctFormData({...conjunctFormData, combined: e.target.value})}
                              className="premium-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Broken Form</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. ক + ক"
                              value={conjunctFormData.broken}
                              onChange={(e) => setConjunctFormData({...conjunctFormData, broken: e.target.value})}
                              className="premium-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Example Word</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. চক্কর"
                              value={conjunctFormData.word}
                              onChange={(e) => setConjunctFormData({...conjunctFormData, word: e.target.value})}
                              className="premium-input"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-4">
                          <button type="submit" className="premium-button-primary bg-green-500 hover:bg-green-600 shadow-green-200 flex items-center space-x-2">
                            <Save className="h-5 w-5" />
                            <span>{editingId ? "Update Conjunct" : "Save Conjunct"}</span>
                          </button>
                        </div>
                      </form>
                    </>
                  )
                ) : activeTab === 'students' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <BookOpen className="text-blue-500 h-6 w-6" />
                      <span>{editingId ? "Edit Student" : "Add New Student"}</span>
                    </h2>
                    <form onSubmit={handleStudentSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={studentFormData.name}
                            onChange={(e) => setStudentFormData({...studentFormData, name: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                          <select
                            required
                            value={studentFormData.class}
                            onChange={(e) => setStudentFormData({...studentFormData, class: parseInt(e.target.value)})}
                            className="premium-input"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Unique ID</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. STU-001"
                            value={studentFormData.uniqueId}
                            onChange={(e) => setStudentFormData({...studentFormData, uniqueId: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary bg-blue-500 hover:bg-blue-600 shadow-blue-200 flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update Student" : "Save Student"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : activeTab === 'routine' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <Calendar className="text-orange-500 h-6 w-6" />
                      <span>{editingId ? "Edit Routine" : "Add New Routine"}</span>
                    </h2>
                    <form onSubmit={handleRoutineSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                          <select
                            required
                            value={routineFormData.class}
                            onChange={(e) => setRoutineFormData({...routineFormData, class: parseInt(e.target.value)})}
                            className="premium-input"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Day</label>
                          <select
                            required
                            value={routineFormData.day}
                            onChange={(e) => setRoutineFormData({...routineFormData, day: e.target.value})}
                            className="premium-input"
                          >
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Subjects (comma separated)</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Math, English, Science"
                            value={routineFormData.subjects}
                            onChange={(e) => setRoutineFormData({...routineFormData, subjects: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary bg-orange-500 hover:bg-orange-600 shadow-orange-200 flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update Routine" : "Save Routine"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : activeTab === 'formulas' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <Calculator className="text-primary h-6 w-6" />
                      <span>{editingId ? "Edit Formula" : "Add New Formula"}</span>
                    </h2>
                    <form onSubmit={handleFormulaSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Pythagorean Theorem"
                            value={formulaFormData.title}
                            onChange={(e) => setFormulaFormData({...formulaFormData, title: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Student (Optional)</label>
                          <select
                            value={formulaFormData.studentId}
                            onChange={(e) => setFormulaFormData({...formulaFormData, studentId: e.target.value})}
                            className="premium-input"
                          >
                            <option value="all">All Students in Class {selectedClass}</option>
                            {students.map(student => (
                              <option key={student.id} value={student.id}>{student.name} (ID: {student.uniqueId})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Formula Content</label>
                        <textarea 
                          required
                          rows={4}
                          placeholder="Enter the formula here..."
                          value={formulaFormData.content}
                          onChange={(e) => setFormulaFormData({...formulaFormData, content: e.target.value})}
                          className="premium-input resize-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update Formula" : "Save Formula"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : activeTab === 'writing' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <BookOpen className="text-primary h-6 w-6" />
                      <span>{editingId ? "Edit Writing Content" : "Add New Writing Content"}</span>
                    </h2>
                    <form onSubmit={handleWritingSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                          <select
                            required
                            value={writingFormData.type}
                            onChange={(e) => setWritingFormData({...writingFormData, type: e.target.value as any})}
                            className="premium-input"
                          >
                            <option value="paragraph">Paragraph</option>
                            <option value="story">Story</option>
                            <option value="dialogue">Dialogue</option>
                            <option value="composition">Composition</option>
                            <option value="letter">Letter</option>
                            <option value="email">Email</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. My School"
                            value={writingFormData.title}
                            onChange={(e) => setWritingFormData({...writingFormData, title: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Student (Optional)</label>
                          <select
                            value={writingFormData.studentId}
                            onChange={(e) => setWritingFormData({...writingFormData, studentId: e.target.value})}
                            className="premium-input"
                          >
                            <option value="all">All Students in Class {selectedClass}</option>
                            {students.map(student => (
                              <option key={student.id} value={student.id}>{student.name} (ID: {student.uniqueId})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                        <textarea 
                          required
                          rows={8}
                          placeholder="Enter the content here..."
                          value={writingFormData.content}
                          onChange={(e) => setWritingFormData({...writingFormData, content: e.target.value})}
                          className="premium-input resize-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update Content" : "Save Content"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : activeTab === 'rhymes' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <Feather className="text-primary h-6 w-6" />
                      <span>{editingId ? "Edit English Rhyme" : "Add New English Rhyme"}</span>
                    </h2>
                    <form onSubmit={handleRhymeSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Rhyme Title</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Twinkle Twinkle Little Star"
                            value={rhymeFormData.title}
                            onChange={(e) => setRhymeFormData({...rhymeFormData, title: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Video URL (Optional)</label>
                          <input 
                            type="url"
                            placeholder="e.g. https://www.youtube.com/watch?v=..."
                            value={rhymeFormData.videoUrl}
                            onChange={(e) => setRhymeFormData({...rhymeFormData, videoUrl: e.target.value})}
                            className="premium-input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rhyme Content</label>
                        <textarea 
                          required
                          rows={10}
                          placeholder="Enter the rhyme lyrics here..."
                          value={rhymeFormData.content}
                          onChange={(e) => setRhymeFormData({...rhymeFormData, content: e.target.value})}
                          className="premium-input resize-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update Rhyme" : "Save Rhyme"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <CheckCircle2 className="text-indigo-500 h-6 w-6" />
                      <span>{editingId ? "Edit MCQ" : "Add New MCQ"}</span>
                    </h2>
                    <form onSubmit={handleMcqSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                          <select
                            required
                            value={mcqFormData.class}
                            onChange={(e) => setMcqFormData({...mcqFormData, class: parseInt(e.target.value)})}
                            className="premium-input"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                          <select
                            required
                            value={mcqFormData.subject}
                            onChange={(e) => setMcqFormData({...mcqFormData, subject: e.target.value})}
                            className="premium-input"
                          >
                            <option value="society">Social Studies</option>
                            <option value="science">Science</option>
                            <option value="religion">Religion</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
                        <textarea 
                          required
                          rows={2}
                          placeholder="Enter question here..."
                          value={mcqFormData.question}
                          onChange={(e) => setMcqFormData({...mcqFormData, question: e.target.value})}
                          className="premium-input resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {mcqFormData.options.map((opt, idx) => (
                          <div key={idx}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Option {idx + 1}</label>
                            <input 
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...mcqFormData.options];
                                newOpts[idx] = e.target.value;
                                setMcqFormData({...mcqFormData, options: newOpts});
                              }}
                              className="premium-input text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer (Must match one of the options)</label>
                        <input 
                          type="text"
                          required
                          value={mcqFormData.correctAnswer}
                          onChange={(e) => setMcqFormData({...mcqFormData, correctAnswer: e.target.value})}
                          className="premium-input"
                          placeholder="Copy the correct option here"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button type="submit" className="premium-button-primary bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200 flex items-center space-x-2">
                          <Save className="h-5 w-5" />
                          <span>{editingId ? "Update MCQ" : "Save MCQ"}</span>
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg lg:text-2xl font-display font-bold">
                {activeTab === 'diaries' ? `Recent Diaries for Class ${selectedClass}` : activeTab === 'math' ? "Recent Math Quizzes" : activeTab === 'bangla' ? (banglaTab === 'poems' ? "Recent Poems" : "Recent Conjuncts") : activeTab === 'students' ? `Students in Class ${selectedClass}` : activeTab === 'routine' ? `Routine for Class ${selectedClass}` : activeTab === 'rhymes' ? "Recent Rhymes" : `MCQs for Class ${selectedClass}`}
              </h2>
              <span className="text-xs lg:text-sm text-text-muted font-medium">
                {activeTab === 'diaries' ? diaries.length : activeTab === 'math' ? quizzes.length : activeTab === 'bangla' ? (banglaTab === 'poems' ? poems.length : conjuncts.length) : activeTab === 'students' ? students.length : activeTab === 'routine' ? routines.length : activeTab === 'rhymes' ? rhymes.length : mcqs.length} entries found
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === 'diaries' ? (
              diaries.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {diaries.map((diary) => (
                    <motion.div key={diary.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-primary/5 transition-colors">
                          <Calendar className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-display font-bold text-lg">
                              {(() => {
                                try {
                                  return format(new Date(diary.date), 'MMM d, yyyy');
                                } catch (e) {
                                  return diary.date;
                                }
                              })()}
                            </span>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">{diary.subject}</span>
                          </div>
                          <p className="text-text-muted line-clamp-2">{diary.task}</p>
                          {diary.studentId && (
                            <p className="text-xs text-gray-500 mt-1">
                              Assigned to: {students.find(s => s.id === diary.studentId)?.name || 'Unknown Student'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startDiaryEdit(diary)} className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete('diaries', diary.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No diaries found for this class" />
              )
            ) : activeTab === 'math' ? (
              quizzes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {quizzes
                    .filter(q => mathFilter === 'all' || q.type === mathFilter)
                    .map((quiz) => (
                    <motion.div layout key={quiz.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-primary/5 transition-colors">
                          <Calculator className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-display font-bold text-lg">{quiz.question}</span>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">{quiz.category}</span>
                          </div>
                          <p className="text-sm text-text-muted">Correct: {quiz.correctAnswer} | Type: {quiz.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startQuizEdit(quiz)} className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete('math_quizzes', quiz.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No math quizzes found" />
              )
            ) : activeTab === 'bangla' ? (
              banglaTab === 'poems' ? (
                poems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {poems.map((poem) => (
                      <motion.div layout key={poem.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                        <div className="flex items-start space-x-4">
                          <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-purple-50 transition-colors">
                            <BookOpen className="h-6 w-6 text-text-muted group-hover:text-purple-500 transition-colors" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <span className="font-display font-bold text-lg">{poem.title}</span>
                            </div>
                            <p className="text-sm text-text-muted line-clamp-2">{poem.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => startPoemEdit(poem)} className="p-3 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                          <button onClick={() => handleDelete('bangla_poems', poem.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No poems found" />
                )
              ) : (
                conjuncts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {conjuncts.map((conjunct) => (
                      <motion.div layout key={conjunct.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                        <div className="flex items-start space-x-4">
                          <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-green-50 transition-colors">
                            <BookOpen className="h-6 w-6 text-text-muted group-hover:text-green-500 transition-colors" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <span className="font-display font-bold text-lg">{conjunct.combined}</span>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">{conjunct.broken}</span>
                            </div>
                            <p className="text-sm text-text-muted">Word: {conjunct.word}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => startConjunctEdit(conjunct)} className="p-3 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                          <button onClick={() => handleDelete('bangla_conjuncts', conjunct.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No conjuncts found" />
                )
              )
            ) : activeTab === 'students' ? (
              students.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {students.map((student) => (
                    <motion.div layout key={student.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-blue-50 transition-colors">
                          <BookOpen className="h-6 w-6 text-text-muted group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-display font-bold text-lg">{student.name}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">ID: {student.uniqueId}</span>
                          </div>
                          <p className="text-sm text-text-muted">Class: {student.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startStudentEdit(student)} className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete('students', student.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No students found" />
              )
            ) : activeTab === 'routine' ? (
              routines.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {routines.map((routine) => (
                    <motion.div layout key={routine.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-orange-50 transition-colors">
                          <Calendar className="h-6 w-6 text-text-muted group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-display font-bold text-lg">{routine.day}</span>
                          </div>
                          <p className="text-sm text-text-muted">Subjects: {routine.subjects}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startRoutineEdit(routine)} className="p-3 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete('routines', routine.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No routines found" />
              )
            ) : activeTab === 'formulas' ? (
              formulas.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {formulas.map((formula) => (
                    <motion.div key={formula.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-primary/5 transition-colors">
                          <Calculator className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-display font-bold text-lg">{formula.title}</span>
                            {formula.studentId && formula.studentId !== 'all' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">Specific Student</span>
                            )}
                          </div>
                          <p className="text-text-muted line-clamp-2">{formula.content}</p>
                          <p className="text-xs text-gray-500 mt-1">Author: {formula.authorName || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startFormulaEdit(formula)} className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete('formulas', formula.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No formulas found for this class" />
              )
            ) : activeTab === 'writing' ? (
              writingContent.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {writingContent.map((writing) => (
                    <motion.div key={writing.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-primary/5 transition-colors">
                          <BookOpen className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-display font-bold text-lg">{writing.title}</span>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">{writing.type}</span>
                            {writing.studentId && writing.studentId !== 'all' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">Specific Student</span>
                            )}
                          </div>
                          <p className="text-text-muted line-clamp-2">{writing.content}</p>
                          <p className="text-xs text-gray-500 mt-1">Author: {writing.authorName || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startWritingEdit(writing)} className="p-3 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete('writing_content', writing.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No writing content found for this class" />
              )
            ) : activeTab === 'rhymes' ? (
              renderRhymes()
            ) : activeTab === 'mcqs' ? (
                <div className="grid grid-cols-1 gap-4">
                  {mcqs.map((mcq) => (
                    <motion.div layout key={mcq.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
                          <CheckCircle2 className="h-6 w-6 text-text-muted group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-display font-bold text-lg">{mcq.question}</span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">{mcq.subject}</span>
                          </div>
                          <p className="text-sm text-text-muted">Correct: {mcq.correctAnswer}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startMcqEdit(mcq)} className="p-3 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete('mcqs', mcq.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No MCQs found" />
              )
            }
          </div>
        </div>
      )}
    </div>
  </div>
</main>
</div>
);
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="premium-card p-20 text-center border-dashed border-2">
      <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-400">{message}</h3>
      <p className="text-text-muted">Start by adding a new entry.</p>
    </div>
  );
}
