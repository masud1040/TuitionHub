import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, ArrowLeft, Timer, CheckCircle2, XCircle, Play, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toBanglaNumber } from '../lib/banglaUtils';
import { cn } from '../lib/utils';

type QuizState = 'setup' | 'playing' | 'result';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function GeneralMathQuiz() {
  const [state, setState] = React.useState<QuizState>('setup');
  const [type, setType] = React.useState<'addition' | 'subtraction' | 'multiplication' | 'division'>('addition');
  const [quizCount, setQuizCount] = React.useState(5);
  const [timePerQuestion, setTimePerQuestion] = React.useState(30);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [seedConfirm, setSeedConfirm] = React.useState(false);

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const startQuiz = async () => {
    try {
      const q = query(
        collection(db, 'math_quizzes'),
        where('type', '==', 'general'),
        where('category', '==', type)
      );
      
      const snapshot = await getDocs(q);
      let allQuestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];

      if (allQuestions.length === 0) {
        setSuccessMessage("দুঃখিত, এই বিভাগে কোনো প্রশ্ন পাওয়া যায়নি।");
        return;
      }

      // Shuffling and Filtering Logic
      const storageKey = `seen_questions_general_${type}`;
      const seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      let availableQuestions = allQuestions.filter(q => !seenIds.includes(q.id));
      
      if (availableQuestions.length < quizCount) {
        // Reset if we don't have enough unseen questions
        availableQuestions = allQuestions;
        localStorage.setItem(storageKey, JSON.stringify([]));
      }

      // Shuffle available questions
      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, quizCount);

      // Update seen IDs
      const newSeenIds = [...seenIds, ...selected.map(q => q.id)];
      localStorage.setItem(storageKey, JSON.stringify(newSeenIds));

      setQuestions(selected);
      setState('playing');
      setCurrentIndex(0);
      setScore(0);
      setTimeLeft(timePerQuestion);
    } catch (error) {
      console.error("Error starting quiz:", error);
      setSuccessMessage("কুইজ শুরু করতে সমস্যা হয়েছে।");
    }
  };

  const [seeding, setSeeding] = React.useState(false);

  // Seeding function for demo data
  const seedData = async () => {
    if (!auth.currentUser) {
      setSuccessMessage("দয়া করে আগে লগইন করুন।");
      return;
    }
    
    setSeedConfirm(false);
    setSeeding(true);
    const sampleData = [
      // Addition
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
      // Subtraction
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
      // Multiplication
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
      // Division
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
      // Word Problems
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
      }
      console.log("Seeding complete! Total items added:", count);
      setSuccessMessage(`${toBanglaNumber(count)} টি স্যাম্পল ডাটা সফলভাবে যোগ করা হয়েছে!`);
      setSeeding(false);
    } catch (err) {
      console.error("Seeding error:", err);
      setSuccessMessage("ডাটা যোগ করতে সমস্যা হয়েছে।");
      setSeeding(false);
    }
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state === 'playing' && timeLeft > 0 && !selectedAnswer) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && state === 'playing' && !selectedAnswer) {
      handleAnswer(''); // Time out
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, selectedAnswer]);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    const correct = answer === questions[currentIndex].correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(timePerQuestion);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setState('result');
      }
    }, 1500);
  };

  if (state === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
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
                    onClick={seedData}
                    className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    হ্যাঁ, যোগ করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Link to="/math" className="inline-flex items-center text-primary mb-8 hover:underline">
          <ArrowLeft className="mr-2 h-5 w-5" />
          <span>গণিত হোম</span>
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6 md:p-10"
        >
          <div className="bg-primary/10 w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center mb-6 md:mb-8">
            <Calculator className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-6 md:mb-8">সাধারণ গণিত কুইজ সেটআপ</h1>
          
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-4">টাইপ নির্বাচন করুন</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'addition', label: 'যোগ' },
                  { id: 'subtraction', label: 'বিয়োগ' },
                  { id: 'multiplication', label: 'গুণ' },
                  { id: 'division', label: 'ভাগ' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setType(item.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all font-medium ${type === item.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-primary/30'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-4">প্রশ্নের সংখ্যা</label>
                <select 
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value))}
                  className="premium-input w-full"
                >
                  <option value={5}>৫ টি প্রশ্ন</option>
                  <option value={10}>১০ টি প্রশ্ন</option>
                  <option value={20}>২০ টি প্রশ্ন</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-4">প্রতি প্রশ্নের সময়</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { value: 15, label: '১৫ সেকেন্ড' },
                    { value: 30, label: '৩০ সেকেন্ড' },
                    { value: 60, label: '১ মিনিট' },
                    { value: 120, label: '২ মিনিট' },
                    { value: 180, label: '৩ মিনিট' },
                    { value: 300, label: '৫ মিনিট' }
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTimePerQuestion(t.value)}
                      className={cn(
                        "py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all",
                        timePerQuestion === t.value 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-gray-100 hover:border-primary/30"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={startQuiz}
                className="premium-button-primary flex-1 py-5 text-xl flex items-center justify-center space-x-3"
              >
                <Play className="h-6 w-6" />
                <span>শুরু করুন</span>
              </button>
              
              <button 
                onClick={() => setSeedConfirm(true)}
                disabled={seeding}
                className="premium-button-secondary py-5 px-8 text-lg flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {seeding ? (
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
                <span>{seeding ? "যোগ হচ্ছে..." : "স্যাম্পল ডাটা"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (state === 'playing') {
    const question = questions[currentIndex];
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 px-4 py-2 rounded-lg font-bold text-primary">
              প্রশ্ন: {toBanglaNumber(currentIndex + 1)} / {toBanglaNumber(questions.length)}
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg font-bold text-green-600">
              স্কোর: {toBanglaNumber(score)}
            </div>
          </div>
          <div className={`flex items-center space-x-2 font-bold text-xl ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-text'}`}>
            <Timer className="h-6 w-6" />
            <span>{toBanglaNumber(timeLeft)}</span>
          </div>
        </div>

        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-12 text-center"
        >
          <h2 className="text-5xl font-display font-bold mb-12">{toBanglaNumber(question.question)} = ?</h2>
          
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                disabled={!!selectedAnswer}
                onClick={() => handleAnswer(option)}
                className={`p-6 rounded-2xl border-2 text-2xl font-bold transition-all ${
                  selectedAnswer === option 
                    ? (isCorrect ? 'border-green-500 bg-green-50 text-green-600' : 'border-red-500 bg-red-50 text-red-600')
                    : (selectedAnswer && option === question.correctAnswer ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-100 hover:border-primary/30')
                }`}
              >
                {toBanglaNumber(option)}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {isCorrect !== null && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 flex items-center justify-center space-x-3"
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">সঠিক উত্তর!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-10 w-10 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">ভুল উত্তর!</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card p-16"
      >
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">কুইজ সম্পন্ন হয়েছে!</h1>
        <p className="text-text-muted text-xl mb-8">আপনার মোট স্কোর: {toBanglaNumber(score)} / {toBanglaNumber(questions.length)}</p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setState('setup')}
            className="premium-button-primary px-10 py-4 text-lg w-full md:w-auto"
          >
            আবার খেলুন
          </button>
          <Link 
            to="/math"
            className="premium-button-secondary px-10 py-4 text-lg w-full md:w-auto"
          >
            হোমে ফিরে যান
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
