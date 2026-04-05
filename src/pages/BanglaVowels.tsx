import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const vowelsData = [
  { letter: 'অ', word: 'অজগর' },
  { letter: 'আ', word: 'আম' },
  { letter: 'ই', word: 'ইঁদুর' },
  { letter: 'ঈ', word: 'ঈগল' },
  { letter: 'উ', word: 'উট' },
  { letter: 'ঊ', word: 'ঊষা' },
  { letter: 'ঋ', word: 'ঋষি' },
  { letter: 'এ', word: 'একতারা' },
  { letter: 'ঐ', word: 'ঐরাবত' },
  { letter: 'ও', word: 'ওজন' },
  { letter: 'ঔ', word: 'ঔষধ' }
];

export default function BanglaVowels() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/bangla" className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" />
          ফিরে যান
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">স্বরবর্ণ</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          বর্ণের উপর মাউস রাখলে বা ক্লিক করলে শব্দটি দেখতে পাবেন।
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {vowelsData.map((item, index) => (
          <motion.div
            key={item.letter}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative h-32 w-full [perspective:1000px]"
          >
            <div className="w-full h-full premium-card flex items-center justify-center cursor-pointer transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              {/* Front side (Letter) */}
              <div className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] bg-white rounded-2xl">
                <span className="text-6xl font-bold text-red-500">{item.letter}</span>
              </div>
              
              {/* Back side (Word) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center [backface-visibility:hidden] bg-red-500 text-white rounded-2xl [transform:rotateY(180deg)] p-4 text-center">
                <span className="text-2xl font-bold mb-2">{item.word}</span>
                <span className="text-sm opacity-90">{item.letter} তে {item.word}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
