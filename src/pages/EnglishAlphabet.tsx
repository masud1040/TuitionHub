import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Type, Volume2, Shuffle, ArrowDownAz, ArrowUpAz, CaseSensitive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function EnglishAlphabet() {
  const [isUppercase, setIsUppercase] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'random'>('asc');
  const [displayLetters, setDisplayLetters] = useState(alphabet);

  const handleSort = (order: 'asc' | 'desc' | 'random') => {
    setSortOrder(order);
    let newLetters = [...alphabet];
    if (order === 'desc') {
      newLetters.reverse();
    } else if (order === 'random') {
      newLetters.sort(() => Math.random() - 0.5);
    }
    setDisplayLetters(newLetters);
  };

  const speak = (letter: string) => {
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <Link 
          to="/english"
          className="inline-flex items-center text-primary font-medium hover:translate-x-[-4px] transition-transform mb-8"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          <span>Back to English</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className="bg-blue-500 p-4 rounded-3xl text-white shadow-lg shadow-blue-500/20">
              <Type className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold">English Alphabet</h1>
              <p className="text-text-muted text-lg">Learn A to Z with fun interactive tools</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => setIsUppercase(!isUppercase)}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center space-x-2 font-bold",
                isUppercase ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
              title="Toggle Case"
            >
              <CaseSensitive className="h-5 w-5" />
              <span className="text-sm">{isUppercase ? "ABC" : "abc"}</span>
            </button>
            
            <div className="w-px h-8 bg-gray-100 mx-1" />

            <button
              onClick={() => handleSort('asc')}
              className={cn(
                "p-3 rounded-xl transition-all",
                sortOrder === 'asc' ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
              title="Sort A-Z"
            >
              <ArrowDownAz className="h-5 w-5" />
            </button>

            <button
              onClick={() => handleSort('desc')}
              className={cn(
                "p-3 rounded-xl transition-all",
                sortOrder === 'desc' ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
              title="Sort Z-A"
            >
              <ArrowUpAz className="h-5 w-5" />
            </button>

            <button
              onClick={() => handleSort('random')}
              className={cn(
                "p-3 rounded-xl transition-all",
                sortOrder === 'random' ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
              title="Shuffle"
            >
              <Shuffle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {displayLetters.map((letter) => (
            <motion.button
              layout
              key={letter}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => speak(letter)}
              className="premium-card aspect-square flex flex-col items-center justify-center group relative overflow-hidden border-2 border-transparent hover:border-blue-500/30 transition-all"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Volume2 className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-5xl lg:text-6xl font-display font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                {isUppercase ? letter : letter.toLowerCase()}
              </span>
              <div className="mt-2 text-[10px] uppercase font-bold tracking-widest text-gray-400 group-hover:text-blue-400 transition-colors">
                {letter === 'A' || letter === 'E' || letter === 'I' || letter === 'O' || letter === 'U' ? "Vowel" : "Consonant"}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
