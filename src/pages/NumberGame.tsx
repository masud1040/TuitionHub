import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, ArrowLeft, CheckCircle2, XCircle, Play, Timer, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toBanglaNumber } from '../lib/banglaUtils';
import { getBanglaNumberWord } from '../lib/banglaNumberWords';
import { cn } from '../lib/utils';

type GameState = 'setup' | 'playing' | 'result';
type QuestionMode = 'wordToDigit' | 'digitToWord';

interface Question {
  number: number;
  mode: QuestionMode;
  options: (string | number)[];
  correctAnswer: string | number;
}

const ranges = [
  { label: '১-১০', min: 1, max: 10 },
  { label: '১১-২০', min: 11, max: 20 },
  { label: '২১-৩০', min: 21, max: 30 },
  { label: '৩১-৪০', min: 31, max: 40 },
  { label: '৪১-৫০', min: 41, max: 50 },
  { label: '৫১-১০০', min: 51, max: 100 },
  { label: '১-১০০', min: 1, max: 100 },
];

export default function NumberGame() {
  const [state, setState] = React.useState<GameState>('setup');
  const [selectedRange, setSelectedRange] = React.useState(ranges[0]);
  const [questionCount, setQuestionCount] = React.useState(10);
  const [timePerQuestion, setTimePerQuestion] = React.useState(30);
  
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | number | null>(null);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);

  const generateOptions = (correctNum: number, min: number, max: number): number[] => {
    const options = new Set<number>();
    options.add(correctNum);
    
    while (options.size < 4) {
      // Generate a number close to the correct number
      const offset = Math.floor(Math.random() * 10) - 5; // -5 to +4
      let wrongNum = correctNum + offset;
      
      // Ensure it's within bounds and not the correct number
      if (wrongNum >= 1 && wrongNum <= 100 && wrongNum !== correctNum) {
        options.add(wrongNum);
      } else {
        // Fallback random
        wrongNum = Math.floor(Math.random() * (max - min + 1)) + min;
        if (wrongNum !== correctNum) {
          options.add(wrongNum);
        }
      }
    }
    
    return Array.from(options).sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    const newQuestions: Question[] = [];
    for (let i = 0; i < questionCount; i++) {
      const num = Math.floor(Math.random() * (selectedRange.max - selectedRange.min + 1)) + selectedRange.min;
      const mode: QuestionMode = Math.random() > 0.5 ? 'wordToDigit' : 'digitToWord';
      const numOptions = generateOptions(num, selectedRange.min, selectedRange.max);
      
      let options: (string | number)[];
      let correctAnswer: string | number;

      if (mode === 'wordToDigit') {
        // Show word, options are digits
        options = numOptions.map(n => toBanglaNumber(n));
        correctAnswer = toBanglaNumber(num);
      } else {
        // Show digit, options are words
        options = numOptions.map(n => getBanglaNumberWord(n));
        correctAnswer = getBanglaNumberWord(num);
      }

      newQuestions.push({
        number: num,
        mode,
        options,
        correctAnswer
      });
    }

    setQuestions(newQuestions);
    setState('playing');
    setCurrentIndex(0);
    setScore(0);
    setTimeLeft(timePerQuestion);
  };

  React.useEffect(() => {
    if (state === 'playing' && timeLeft > 0 && selectedAnswer === null) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (state === 'playing' && timeLeft === 0 && selectedAnswer === null) {
      handleAnswer('timeout');
    }
  }, [timeLeft, state, selectedAnswer]);

  const handleAnswer = (answer: string | number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === questions[currentIndex].correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setTimeLeft(timePerQuestion);
      } else {
        setState('result');
      }
    }, 1500);
  };

  if (state === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/math" className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            ফিরে যান
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="h-10 w-10 text-orange-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">সংখ্যার খেলা</h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            সংখ্যা এবং কথার মাধ্যমে মজার খেলা খেলুন।
          </p>
        </div>

        <div className="premium-card p-8 max-w-2xl mx-auto">
          <div className="space-y-8">
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-4">কত থেকে কত রেঞ্জ এর খেলবেন?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ranges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setSelectedRange(range)}
                    className={cn(
                      "py-3 px-4 rounded-xl font-bold transition-all border-2",
                      selectedRange.label === range.label
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-100 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/50"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-4">কয়টি প্রশ্ন চান?</label>
              <div className="flex space-x-4">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all border-2",
                      questionCount === num
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-100 bg-white text-gray-600 hover:border-primary/30"
                    )}
                  >
                    {toBanglaNumber(num)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-800 mb-4">প্রতি প্রশ্নের জন্য সময়</label>
              <div className="flex space-x-4">
                {[10, 20, 30, 60].map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimePerQuestion(time)}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all border-2",
                      timePerQuestion === time
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-100 bg-white text-gray-600 hover:border-primary/30"
                    )}
                  >
                    {toBanglaNumber(time)} সে.
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full premium-button-primary py-4 text-lg flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
            >
              <Play className="h-6 w-6" />
              <span>খেলা শুরু করুন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'playing') {
    const currentQ = questions[currentIndex];

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold text-gray-500">
              প্রশ্ন {toBanglaNumber(currentIndex + 1)}/{toBanglaNumber(questions.length)}
            </span>
            <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-full font-bold",
            timeLeft <= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"
          )}>
            <Timer className="h-5 w-5" />
            <span>{toBanglaNumber(timeLeft)} সেকেন্ড</span>
          </div>
        </div>

        <div className="premium-card p-8 md:p-12 mb-8 text-center min-h-[250px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="text-5xl md:text-7xl font-display font-bold text-gray-800"
            >
              {currentQ.mode === 'wordToDigit' 
                ? getBanglaNumberWord(currentQ.number) 
                : toBanglaNumber(currentQ.number)}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === currentQ.correctAnswer;
            
            let buttonClass = "premium-card p-6 text-2xl md:text-3xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]";
            
            if (selectedAnswer !== null) {
              if (isCorrectAnswer) {
                buttonClass += " bg-green-500 text-white border-green-600";
              } else if (isSelected) {
                buttonClass += " bg-red-500 text-white border-red-600";
              } else {
                buttonClass += " opacity-50";
              }
            } else {
              buttonClass += " hover:border-orange-400 hover:text-orange-600";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                className={buttonClass}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card p-12 max-w-2xl mx-auto"
      >
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gamepad2 className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="text-4xl font-display font-bold mb-4">খেলা শেষ!</h2>
        <p className="text-xl text-text-muted mb-8">
          আপনি {toBanglaNumber(questions.length)} টি প্রশ্নের মধ্যে {toBanglaNumber(score)} টির সঠিক উত্তর দিয়েছেন।
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link
            to="/math"
            className="px-8 py-4 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            ফিরে যান
          </Link>
          <button
            onClick={() => setState('setup')}
            className="px-8 py-4 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2"
          >
            <RotateCcw className="h-5 w-5" />
            <span>আবার খেলুন</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
