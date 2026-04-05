import React from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { format, startOfToday, addDays } from 'date-fns';
import { Plus, Trash2, Edit2, Save, X, LayoutDashboard, Calendar, BookOpen, CheckCircle2, Eye, LogOut, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toBanglaNumber } from '../lib/banglaUtils';
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
  const [activeTab, setActiveTab] = React.useState<'diaries' | 'math' | 'bangla'>('diaries');
  const [banglaTab, setBanglaTab] = React.useState<'poems' | 'conjuncts'>('poems');
  const [mathFilter, setMathFilter] = React.useState<'all' | 'general' | 'word_problem'>('all');
  const [selectedClass, setSelectedClass] = React.useState<number>(1);
  const [diaries, setDiaries] = React.useState<DiaryEntry[]>([]);
  const [quizzes, setQuizzes] = React.useState<QuizEntry[]>([]);
  const [poems, setPoems] = React.useState<any[]>([]);
  const [conjuncts, setConjuncts] = React.useState<any[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ collection: string, id: string } | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Diary Form State
  const [diaryFormData, setDiaryFormData] = React.useState({
    date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
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

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    let unsubscribeDiaries = () => {};
    let unsubscribeQuizzes = () => {};
    let unsubscribePoems = () => {};
    let unsubscribeConjuncts = () => {};

    if (activeTab === 'diaries') {
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
        console.error("Error fetching diaries:", error);
        setLoading(false);
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
        console.error("Error fetching quizzes:", error);
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
        });
      } else {
        const q = query(collection(db, 'bangla_conjuncts'));
        unsubscribeConjuncts = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const sortedData = data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setConjuncts(sortedData);
          setLoading(false);
        });
      }
    }

    return () => {
      unsubscribeAuth();
      unsubscribeDiaries();
      unsubscribeQuizzes();
      unsubscribePoems();
      unsubscribeConjuncts();
    };
  }, [selectedClass, activeTab, banglaTab, navigate]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Seed Confirmation Modal */}
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
                <button
                  onClick={() => setSeedConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  না
                </button>
                <button
                  onClick={seedMathData}
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  হ্যাঁ, যোগ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Class 1 Seed Confirmation Modal */}
      <AnimatePresence>
        {class1SeedConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">ক্লাস ১ এর ডাটা যোগ করবেন?</h3>
              <p className="text-text-muted text-center mb-8">আপনি কি ক্লাস ১ এর জন্য ৩০টি গাণিতিক সমস্যা এড করতে চান?</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setClass1SeedConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  না
                </button>
                <button
                  onClick={seedClass1MathData}
                  className="flex-1 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all"
                >
                  হ্যাঁ, যোগ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Message Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3"
          >
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">আপনি কি নিশ্চিত?</h3>
              <p className="text-text-muted text-center mb-8">এটি ডিলিট করলে আর ফিরে পাওয়া যাবে না।</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  না
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center space-x-3">
            <LayoutDashboard className="text-primary h-8 w-8" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-text-muted mt-1">Manage homework and math quizzes for students.</p>
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
              if (activeTab === 'diaries') {
                setDiaryFormData({
                  date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
                  subject: '',
                  task: ''
                });
              } else if (activeTab === 'math') {
                setQuizFormData({
                  type: 'general',
                  category: 'addition',
                  question: '',
                  options: ['', '', '', ''],
                  correctAnswer: ''
                });
              } else if (activeTab === 'bangla') {
                if (banglaTab === 'poems') {
                  setPoemFormData({ title: '', content: '', author: '' });
                } else {
                  setConjunctFormData({ combined: '', broken: '', word: '' });
                }
              }
            }}
            className="premium-button-primary flex items-center justify-center space-x-2"
          >
            {isAdding ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span>{isAdding ? "Cancel" : (activeTab === 'diaries' ? "Add New Diary" : activeTab === 'math' ? "Add New Quiz" : banglaTab === 'poems' ? "Add New Poem" : "Add New Conjunct")}</span>
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

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => { setActiveTab('diaries'); setIsAdding(false); setEditingId(null); setLoading(true); }}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
            activeTab === 'diaries' ? "bg-primary text-white" : "bg-white text-text-muted hover:bg-gray-50"
          )}
        >
          Daily Diaries
        </button>
        <button
          onClick={() => { setActiveTab('math'); setIsAdding(false); setEditingId(null); setLoading(true); }}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
            activeTab === 'math' ? "bg-primary text-white" : "bg-white text-text-muted hover:bg-gray-50"
          )}
        >
          Math Quizzes
        </button>
        <button
          onClick={() => { setActiveTab('bangla'); setIsAdding(false); setEditingId(null); setLoading(true); }}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
            activeTab === 'bangla' ? "bg-primary text-white" : "bg-white text-text-muted hover:bg-gray-50"
          )}
        >
          Bangla Section
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          {activeTab === 'diaries' ? (
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
          ) : activeTab === 'math' ? (
            <div className="space-y-6">
              <div className="premium-card p-6 bg-primary/5 border-primary/10">
                <h3 className="font-semibold text-primary mb-2 flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Math Management</span>
                </h3>
                <p className="text-sm text-primary/80 leading-relaxed mb-6">
                  Add general math questions (Addition, Subtraction, etc.) or Word Problems for students to practice.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setSeedConfirm(true)}
                    disabled={seeding}
                    className="w-full premium-button-secondary py-3 px-4 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                  >
                    {seeding ? (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{seeding ? "যোগ হচ্ছে..." : "স্যাম্পল ডাটা যোগ করুন"}</span>
                  </button>
                  <button
                    onClick={() => setClass1SeedConfirm(true)}
                    disabled={seeding}
                    className="w-full premium-button-primary py-3 px-4 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700 shadow-green-600/20"
                  >
                    {seeding ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{seeding ? "যোগ হচ্ছে..." : "ক্লাস ১ এর প্রশ্ন যোগ করুন"}</span>
                  </button>
                </div>
              </div>

              <div className="premium-card p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Filter Quiz Type</label>
                <div className="space-y-2">
                  {(['all', 'general', 'word_problem'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMathFilter(type)}
                      className={cn(
                        "w-full py-2 px-4 rounded-xl text-left font-medium transition-all capitalize",
                        mathFilter === type 
                          ? "bg-primary text-white" 
                          : "bg-gray-50 text-text-muted hover:bg-gray-100"
                      )}
                    >
                      {type === 'all' ? 'All Quizzes' : type === 'general' ? 'General Math' : 'Word Problems'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="premium-card p-6 bg-purple-50 border-purple-100">
                <h3 className="font-semibold text-purple-700 mb-2 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Bangla Management</span>
                </h3>
                <p className="text-sm text-purple-700/80 leading-relaxed mb-6">
                  Manage poems and conjuncts for the Bangla section.
                </p>
              </div>

              <div className="premium-card p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Category</label>
                <div className="space-y-2">
                  <button
                    onClick={() => { setBanglaTab('poems'); setIsAdding(false); setEditingId(null); }}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl text-left font-medium transition-all",
                      banglaTab === 'poems' 
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" 
                        : "bg-gray-50 text-text-muted hover:bg-gray-100"
                    )}
                  >
                    Poems (কবিতা)
                  </button>
                  <button
                    onClick={() => { setBanglaTab('conjuncts'); setIsAdding(false); setEditingId(null); }}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl text-left font-medium transition-all",
                      banglaTab === 'conjuncts' 
                        ? "bg-green-500 text-white shadow-md shadow-green-500/20" 
                        : "bg-gray-50 text-text-muted hover:bg-gray-100"
                    )}
                  >
                    Conjuncts (যুক্তবর্ণ)
                  </button>
                </div>
              </div>
            </div>
          )}
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
                {activeTab === 'diaries' ? (
                  <>
                    <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                      <BookOpen className="text-primary h-6 w-6" />
                      <span>{editingId ? "Edit Diary Entry" : "Create New Diary Entry"}</span>
                    </h2>
                    <form onSubmit={handleDiarySave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                ) : banglaTab === 'poems' ? (
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
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">
                {activeTab === 'diaries' ? `Recent Diaries for Class ${selectedClass}` : activeTab === 'math' ? "Recent Math Quizzes" : banglaTab === 'poems' ? "Recent Poems" : "Recent Conjuncts"}
              </h2>
              <span className="text-sm text-text-muted font-medium">
                {activeTab === 'diaries' ? diaries.length : activeTab === 'math' ? quizzes.length : banglaTab === 'poems' ? poems.length : conjuncts.length} entries found
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
            ) : (
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
            )}
          </div>
        </div>
      </div>
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
