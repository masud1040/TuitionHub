import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '../lib/utils';

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
  const [flippedIndex, setFlippedIndex] = React.useState<number | null>(null);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    window.speechSynthesis.speak(utterance);
  };

  const handleCardClick = (index: number, item: any) => {
    setFlippedIndex(flippedIndex === index ? null : index);
    speak(`${item.letter}, ${item.letter} তে ${item.word}`);
  };

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
          বর্ণের উপর ক্লিক করলে শব্দ শুনতে পাবেন এবং শব্দটি দেখতে পাবেন।
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
        {vowelsData.map((item, index) => (
          <motion.div
            key={item.letter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative h-40 md:h-56 w-full [perspective:1000px]"
            onClick={() => handleCardClick(index, item)}
          >
            <div className={cn(
              "w-full h-full cursor-pointer transition-all duration-500 [transform-style:preserve-3d]",
              flippedIndex === index ? "[transform:rotateY(180deg)]" : ""
            )}>
              {/* Front side (Letter) */}
              <div className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] bg-white rounded-3xl shadow-xl border-2 border-red-100 hover:border-red-500 transition-colors">
                <span className="text-6xl md:text-8xl font-bold text-red-500">{item.letter}</span>
              </div>
              
              {/* Back side (Word) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center [backface-visibility:hidden] bg-red-500 text-white rounded-3xl shadow-xl [transform:rotateY(180deg)] p-4 text-center">
                <span className="text-2xl md:text-4xl font-bold mb-2">{item.word}</span>
                <span className="text-lg md:text-2xl opacity-90 font-bold">{item.letter} তে {item.word}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
