import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Table, ArrowLeft, CheckCircle2, XCircle, Play, Timer, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toBanglaNumber } from '../lib/banglaUtils';
import { cn } from '../lib/utils';

type QuizState = 'selection' | 'setup' | 'playing' | 'result';

export default function MultiplicationTableQuiz() {
  const [state, setState] = React.useState<QuizState>('selection');
  const [selectedTable, setSelectedTable] = React.useState<number>(1);
  const [order, setOrder] = React.useState<'sequential' | 'shuffled'>('sequential');
  const [timePerQuestion, setTimePerQuestion] = React.useState(30);
  const [questions, setQuestions] = React.useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [userInput, setUserInput] = React.useState('');
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);

  const startQuiz = () => {
    setState('playing');
    
    // Generate 1-10
    let nums = Array.from({ length: 10 }, (_, i) => i + 1);
    if (order === 'shuffled') {
      nums = [...nums].sort(() => Math.random() - 0.5);
    }
    
    setQuestions(nums);
    setCurrentIndex(0);
    setScore(0);
    setUserInput('');
    setIsCorrect(null);
    setTimeLeft(timePerQuestion);
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state === 'playing' && timeLeft > 0 && isCorrect === null) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && state === 'playing' && isCorrect === null) {
      checkAnswer(true); // Time out
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, isCorrect]);

  const handleInput = (digit: string) => {
    if (isCorrect !== null) return;
    setUserInput(prev => prev + digit);
  };

  const clearInput = () => {
    if (isCorrect !== null) return;
    setUserInput('');
  };

  const checkAnswer = (isTimeout = false) => {
    if (isCorrect !== null || (!isTimeout && userInput === '')) return;
    
    const multiplier = questions[currentIndex];
    const correct = !isTimeout && Number(userInput) === selectedTable * multiplier;
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentIndex < 9) {
        setCurrentIndex(prev => prev + 1);
        setUserInput('');
        setIsCorrect(null);
        setTimeLeft(timePerQuestion);
      } else {
        setState('result');
      }
    }, 1500);
  };

  if (state === 'selection') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link to="/math" className="inline-flex items-center text-primary mb-8 hover:underline">
          <ArrowLeft className="mr-2 h-5 w-5" />
          <span>গণিত হোম</span>
        </Link>
        
        <div className="text-center mb-12">
          <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <Table className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">নামাতা শিখুন</h1>
          <p className="text-text-muted text-lg">১ থেকে ২০ পর্যন্ত নামাতা নির্বাচন করুন</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedTable(num);
                setState('setup');
              }}
              className="premium-card p-6 text-3xl font-bold hover:border-primary transition-all text-center"
            >
              {toBanglaNumber(num)}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (state === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => setState('selection')} className="inline-flex items-center text-primary mb-8 hover:underline">
          <ArrowLeft className="mr-2 h-5 w-5" />
          <span>নামাতা নির্বাচন</span>
        </button>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6 md:p-10"
        >
          <div className="bg-primary/10 w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center mb-6 md:mb-8">
            <Table className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-6 md:mb-8">{toBanglaNumber(selectedTable)} এর নামাতা কুইজ সেটআপ</h1>
          
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-4">ক্রম নির্বাচন করুন</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setOrder('sequential')}
                  className={`p-4 rounded-xl border-2 transition-all font-medium ${order === 'sequential' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-primary/30'}`}
                >
                  ধারাবাহিক (১-১০)
                </button>
                <button
                  onClick={() => setOrder('shuffled')}
                  className={`p-4 rounded-xl border-2 transition-all font-medium ${order === 'shuffled' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-primary/30'}`}
                >
                  এলোমেলো
                </button>
              </div>
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

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold mb-4 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>নামাতাটি এক নজর দেখে নাও:</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <div key={num} className="bg-white p-2 rounded-lg text-center border border-gray-100 shadow-sm">
                    <span className="text-sm font-bold">
                      {toBanglaNumber(selectedTable)} × {toBanglaNumber(num)} = {toBanglaNumber(selectedTable * num)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={startQuiz}
              className="premium-button-primary w-full py-5 text-xl flex items-center justify-center space-x-3"
            >
              <Play className="h-6 w-6" />
              <span>শুরু করুন</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (state === 'playing') {
    const multiplier = questions[currentIndex];
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 px-4 py-2 rounded-lg font-bold text-primary">
              নামাতা: {toBanglaNumber(selectedTable)}
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg font-bold text-green-600">
              স্কোর: {toBanglaNumber(score)} / {toBanglaNumber(currentIndex + 1)}
            </div>
          </div>
          <div className={`flex items-center space-x-2 font-bold text-xl ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-text'}`}>
            <Timer className="h-6 w-6" />
            <span>{toBanglaNumber(timeLeft)}</span>
          </div>
        </div>

        <motion.div 
          key={multiplier}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8 md:p-12 text-center"
        >
          <div className="flex flex-wrap items-center justify-center text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-8 md:mb-12 gap-3 md:gap-6">
            <span>{toBanglaNumber(selectedTable)}</span>
            <span className="text-primary">×</span>
            <span>{toBanglaNumber(multiplier)}</span>
            <span className="text-primary">=</span>
            <div className={`w-24 sm:w-28 md:w-32 h-14 sm:h-16 md:h-20 border-4 rounded-2xl flex items-center justify-center transition-all ${
              isCorrect === true ? 'border-green-500 bg-green-50 text-green-600' : 
              isCorrect === false ? 'border-red-500 bg-red-50 text-red-600' : 
              'border-primary bg-primary/5 text-primary'
            }`}>
              {toBanglaNumber(userInput)}
            </div>
          </div>

          {/* Number Pad */}
          <div className="max-w-xs mx-auto mb-8">
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleInput(String(num))}
                  className="p-4 md:p-6 text-2xl md:text-3xl font-bold bg-gray-50 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                >
                  {toBanglaNumber(num)}
                </button>
              ))}
              <button
                onClick={clearInput}
                className="p-4 md:p-6 text-lg md:text-xl font-bold bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all active:scale-95"
              >
                মুছুন
              </button>
              <button
                onClick={() => handleInput('0')}
                className="p-4 md:p-6 text-2xl md:text-3xl font-bold bg-gray-50 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
              >
                {toBanglaNumber(0)}
              </button>
              <button
                onClick={() => checkAnswer()}
                className="p-4 md:p-6 text-lg md:text-xl font-bold bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-all active:scale-95"
              >
                ঠিক
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isCorrect !== null && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center space-x-3"
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">সঠিক!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-10 w-10 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">ভুল! সঠিক উত্তর: {toBanglaNumber(selectedTable * multiplier)}</span>
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
        <h1 className="text-4xl font-display font-bold mb-4">নামাতা কুইজ সম্পন্ন!</h1>
        <p className="text-text-muted text-xl mb-8">আপনার স্কোর: {toBanglaNumber(score)} / ১০</p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setState('selection')}
            className="premium-button-primary px-10 py-4 text-lg w-full md:w-auto"
          >
            অন্য নামাতা খেলুন
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
