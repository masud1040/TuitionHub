import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, Volume2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

const QUIZ_DATA = {
  English: [
    { question: 'A for...?', options: ['Apple', 'Ball', 'Cat'], answer: 'Apple' },
    { question: 'B for...?', options: ['Dog', 'Bat', 'Egg'], answer: 'Bat' },
    { question: 'C for...?', options: ['Cup', 'Fish', 'Goat'], answer: 'Cup' },
    { question: 'D for...?', options: ['Hen', 'Ice', 'Dog'], answer: 'Dog' },
    { question: 'E for...?', options: ['Egg', 'Jug', 'Kite'], answer: 'Egg' },
    { question: 'F for...?', options: ['Lion', 'Fish', 'Moon'], answer: 'Fish' },
    { question: 'G for...?', options: ['Goat', 'Net', 'Owl'], answer: 'Goat' },
    { question: 'H for...?', options: ['Pen', 'Hen', 'Queen'], answer: 'Hen' },
  ],
  Bangla: [
    { question: 'অ তে...?', options: ['আম', 'অজগর', 'ইলিশ'], answer: 'অজগর' },
    { question: 'আ তে...?', options: ['উট', 'আম', 'ঋষি'], answer: 'আম' },
    { question: 'ই তে...?', options: ['ইলিশ', 'একতারা', 'ওজন'], answer: 'ইলিশ' },
    { question: 'ঈ তে...?', options: ['ঈগল', 'ঐরাবত', 'ঔষধ'], answer: 'ঈগল' },
    { question: 'উ তে...?', options: ['কলা', 'উট', 'খাতা'], answer: 'উট' },
    { question: 'ঊ তে...?', options: ['গাড়ি', 'ঊর্মি', 'ঘড়ি'], answer: 'ঊর্মি' },
    { question: 'ঋ তে...?', options: ['ব্যাঙ', 'ঋষি', 'চশমা'], answer: 'ঋষি' },
    { question: 'এ তে...?', options: ['একতারা', 'ছাতা', 'জাহাজ'], answer: 'একতারা' },
  ]
};

export default function SimpleQuiz() {
  const [searchParams] = useSearchParams();
  const subject = (searchParams.get('subject') as 'English' | 'Bangla') || 'English';
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    // Shuffle questions
    const shuffled = [...QUIZ_DATA[subject]].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  }, [subject]);

  useEffect(() => {
    // Prime the voices
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = subject === 'English' ? 'en-US' : 'bn-BD';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => v.lang.startsWith(subject === 'English' ? 'en' : 'bn'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }, [subject]);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === questions[currentQuestion].answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
      speak(subject === 'English' ? "Correct! Well done." : "সঠিক হয়েছে! চমৎকার।");
    } else {
      speak(subject === 'English' ? "Oops! Try again." : "ভুল হয়েছে! আবার চেষ্টা করো।");
    }
  };

  const handleNext = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(null);
    const shuffled = [...QUIZ_DATA[subject]].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  };

  if (questions.length === 0) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to={subject === 'English' ? '/english' : '/bangla'} className="p-2 hover:bg-white rounded-xl transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-white/50 flex items-center space-x-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-lg">Score: {score}/{questions.length}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="quiz-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="premium-card p-8 md:p-12 text-center"
            >
              <div className="mb-8">
                <span className="text-sm font-bold text-primary uppercase tracking-widest mb-2 block">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
                  {questions[currentQuestion].question}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8">
                {questions[currentQuestion].options.map((option: string) => (
                  <button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    disabled={!!selectedOption}
                    className={cn(
                      "p-6 rounded-2xl text-xl font-bold transition-all border-2",
                      !selectedOption 
                        ? "bg-white border-gray-100 hover:border-primary hover:bg-primary/5 text-gray-700"
                        : option === questions[currentQuestion].answer
                          ? "bg-green-50 border-green-500 text-green-700"
                          : option === selectedOption
                            ? "bg-red-50 border-red-500 text-red-700"
                            : "bg-white border-gray-100 text-gray-400"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {selectedOption && option === questions[currentQuestion].answer && (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      )}
                      {selectedOption && option === selectedOption && option !== questions[currentQuestion].answer && (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedOption && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleNext}
                  className="w-full premium-button-primary py-4 flex items-center justify-center space-x-2 text-lg"
                >
                  <span>{currentQuestion + 1 === questions.length ? 'Show Results' : 'Next Question'}</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="premium-card p-12 text-center"
            >
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Trophy className="h-12 w-12 text-yellow-600" />
              </div>
              <h2 className="text-4xl font-display font-bold mb-4">Great Job!</h2>
              <p className="text-text-muted text-lg mb-8">
                You completed the {subject} quiz with a score of {score} out of {questions.length}.
              </p>
              
              <div className="bg-gray-50 rounded-3xl p-8 mb-8">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Accuracy</div>
                <div className="text-5xl font-display font-bold text-primary">
                  {Math.round((score / questions.length) * 100)}%
                </div>
              </div>

              <div className="flex space-x-4">
                <Link 
                  to={subject === 'English' ? '/english' : '/bangla'}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Back Home
                </Link>
                <button
                  onClick={restartQuiz}
                  className="flex-[2] premium-button-primary py-4 flex items-center justify-center space-x-3 text-lg"
                >
                  <RotateCcw className="h-6 w-6" />
                  <span>Try Again</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
