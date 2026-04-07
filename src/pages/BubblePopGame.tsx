import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, Trophy, Timer, Heart, Settings2, Volume2, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Bubble {
  id: number;
  text: string;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  isCorrect: boolean;
}

const COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 
  'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400'
];

const GAME_DATA = {
  en: [
    { target: 'A', related: ['Apple', 'Ant', 'A'] },
    { target: 'B', related: ['Ball', 'Bat', 'B'] },
    { target: 'C', related: ['Cat', 'Cup', 'C'] },
    { target: 'D', related: ['Dog', 'Duck', 'D'] },
    { target: 'E', related: ['Egg', 'Eagle', 'E'] },
    { target: 'F', related: ['Fish', 'Frog', 'F'] },
    { target: 'G', related: ['Goat', 'Girl', 'G'] },
    { target: 'H', related: ['Hen', 'Home', 'H'] },
  ],
  bn: [
    { target: 'অ', related: ['অজগর', 'অ'] },
    { target: 'আ', related: ['আম', 'আ'] },
    { target: 'ই', related: ['ইলিশ', 'ই'] },
    { target: 'ঈ', related: ['ঈগল', 'ঈ'] },
    { target: 'উ', related: ['উট', 'উ'] },
    { target: 'ঊ', related: ['ঊর্মি', 'ঊ'] },
    { target: 'ঋ', related: ['ঋষি', 'ঋ'] },
    { target: 'এ', related: ['একতারা', 'এ'] },
  ]
};

const ALL_WORDS = {
  en: ['Bat', 'Cat', 'Dog', 'Egg', 'Fish', 'Goat', 'Hen', 'Ice', 'Jug', 'Kite', 'Lion', 'Moon', 'Net', 'Owl', 'Pen', 'Queen', 'Rat', 'Sun', 'Top', 'Van', 'Web', 'Box', 'Yak', 'Zoo'],
  bn: ['কলা', 'খাতা', 'গাড়ি', 'ঘড়ি', 'ব্যাঙ', 'চশমা', 'ছাতা', 'জাহাজ', 'ঝুড়ি', 'টমেটো', 'ঠোঁট', 'ডাব', 'ঢোল', 'তবলা', 'থালা', 'দই', 'ধান', 'নদী', 'পাখি', 'ফল', 'বই', 'ভাল্লুক', 'মাছ', 'যাতা']
};

export default function BubblePopGame() {
  const [mode, setMode] = useState<'en' | 'bn'>('en');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [level, setLevel] = useState(1);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

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
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = mode === 'en' ? 'en-US' : 'bn-BD';
    utterance.rate = 1.0; // Slightly faster for better response
    utterance.pitch = 1.1; // Slightly higher for kid-friendly tone
    
    // Important: Some browsers need a voice to be explicitly set
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Try to find a good voice for the language
      const preferredVoice = voices.find(v => v.lang.startsWith(mode === 'en' ? 'en' : 'bn'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [mode]);

  const generateTarget = useCallback(() => {
    const data = GAME_DATA[mode];
    const randomTarget = data[Math.floor(Math.random() * data.length)];
    setCurrentTarget(randomTarget);
    speak(mode === 'en' ? `Find ${randomTarget.target}` : `${randomTarget.target} খুঁজে বের করো`);
  }, [mode, speak]);

  const createBubble = useCallback((isCorrect: boolean) => {
    if (!gameContainerRef.current || !currentTarget) return null;
    const rect = gameContainerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 768;
    const baseSize = isMobile ? 50 : 60;
    const sizeVar = isMobile ? 30 : 40;
    const size = Math.random() * sizeVar + baseSize;
    
    let text = '';
    if (isCorrect) {
      text = currentTarget.related[Math.floor(Math.random() * currentTarget.related.length)];
    } else {
      const wrongWords = ALL_WORDS[mode].filter(w => !currentTarget.related.includes(w));
      text = wrongWords[Math.floor(Math.random() * wrongWords.length)];
    }

    return {
      id: Date.now() + Math.random(),
      text,
      x: Math.random() * (rect.width - size),
      y: rect.height + size,
      size,
      speedX: (Math.random() - 0.5) * 1.2,
      speedY: -(Math.random() * 0.4 + 0.4 + level * 0.05),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      isCorrect
    };
  }, [currentTarget, mode, level]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    setBubbles([]);
    generateTarget();
  };

  const popBubble = (bubble: Bubble) => {
    if (bubble.isCorrect) {
      setScore(prev => prev + 1);
      speak(mode === 'en' ? `${currentTarget.target} for ${bubble.text}` : `${currentTarget.target} তে ${bubble.text}`);
      
      if (score > 0 && (score + 1) % 5 === 0) {
        generateTarget();
        setLevel(prev => prev + 1);
      }
    } else {
      setLives(prev => {
        if (prev <= 1) {
          setGameState('gameOver');
          return 0;
        }
        return prev - 1;
      });
      speak(mode === 'en' ? "Oops! Try again" : "ভুল হয়েছে, আবার চেষ্টা করো");
    }
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));
  };

  // Game Loop
  const updateBubbles = useCallback(() => {
    if (gameState !== 'playing') return;

    setBubbles(prev => {
      const next = prev.map(b => ({
        ...b,
        x: b.x + b.speedX,
        y: b.y + b.speedY
      })).filter(b => b.y + b.size > -50); // Remove if off screen top

      // Add new bubbles if count is low
      if (next.length < 6 + level) {
        const isCorrect = Math.random() > 0.6;
        const newBubble = createBubble(isCorrect);
        if (newBubble) next.push(newBubble);
      }

      return next;
    });

    requestRef.current = requestAnimationFrame(updateBubbles);
  }, [gameState, level, createBubble]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updateBubbles);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameOver');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        clearInterval(timer);
      };
    }
  }, [gameState, updateBubbles]);

  return (
    <div className="h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden relative">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200 rounded-full blur-[120px]" />
      </div>

      {/* Floating Header / Stats Bar */}
      <div className="relative z-20 px-4 pt-4 pb-2">
        <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-md border border-white/50 rounded-[2rem] shadow-xl shadow-primary/5 p-2 flex items-center justify-between">
          {/* Left: Back & Score */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/" className="p-2.5 hover:bg-white rounded-2xl transition-all hover:shadow-sm active:scale-90">
              <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-2 bg-white/80 px-3 md:px-5 py-2 rounded-2xl shadow-sm border border-white/50">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              <span className="font-bold text-base md:text-xl text-gray-800">{score}</span>
            </div>
          </div>

          {/* Center: Target (The Star of the Show) */}
          {gameState === 'playing' && currentTarget && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
            >
              <div className="relative group">
                <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-md group-hover:blur-lg transition-all" />
                <div className="relative bg-primary text-white w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-2xl md:text-4xl font-bold shadow-lg shadow-primary/30 border-4 border-white/20">
                  {currentTarget.target}
                </div>
              </div>
              <span className="hidden md:block text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1.5">Target</span>
            </motion.div>
          )}

          {/* Right: Lives & Timer */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden sm:flex items-center space-x-1 bg-white/40 px-3 py-2 rounded-2xl border border-white/50">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={i < lives ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ repeat: i < lives ? Infinity : 0, duration: 2, delay: i * 0.2 }}
                >
                  <Heart 
                    className={cn(
                      "h-5 w-5 md:h-6 md:w-6 transition-all duration-500",
                      i < lives ? "text-red-500 fill-red-500 drop-shadow-sm" : "text-gray-200"
                    )} 
                  />
                </motion.div>
              ))}
            </div>
            {/* Mobile Lives */}
            <div className="sm:hidden flex items-center space-x-1 bg-red-50 px-3 py-2 rounded-2xl border border-red-100">
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <span className="font-bold text-red-600">{lives}</span>
            </div>
            
            <div className={cn(
              "flex items-center space-x-2 px-3 md:px-5 py-2 rounded-2xl shadow-sm border transition-colors",
              timeLeft < 10 ? "bg-red-50 border-red-100 text-red-600" : "bg-white/80 border-white/50 text-gray-800"
            )}>
              <Timer className={cn("h-4 w-4 md:h-5 md:w-5", timeLeft < 10 ? "animate-pulse" : "text-blue-500")} />
              <span className="font-bold text-base md:text-xl tabular-nums">{timeLeft}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area - Maximized */}
      <div 
        ref={gameContainerRef}
        className="flex-grow relative overflow-hidden cursor-crosshair z-10"
      >
        <AnimatePresence>
          {gameState === 'menu' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center z-20 p-4"
            >
              <div className="premium-card p-8 lg:p-12 max-w-md w-full text-center space-y-8">
                <div className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Gamepad2 className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold mb-2">Bubble Pop!</h1>
                  <p className="text-text-muted">Pop the bubbles that match the target letter or word.</p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-2xl">
                  <button 
                    onClick={() => setMode('en')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all",
                      mode === 'en' ? "bg-white shadow-sm text-primary" : "text-gray-500"
                    )}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setMode('bn')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all",
                      mode === 'bn' ? "bg-white shadow-sm text-primary" : "text-gray-500"
                    )}
                  >
                    বাংলা
                  </button>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full premium-button-primary py-4 flex items-center justify-center space-x-3 text-lg"
                >
                  <Play className="h-6 w-6 fill-current" />
                  <span>Start Learning</span>
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'gameOver' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center z-30 p-4 bg-white/40 backdrop-blur-sm"
            >
              <div className="premium-card p-8 lg:p-12 max-w-md w-full text-center space-y-8 shadow-2xl">
                <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="h-12 w-12 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold mb-2">Game Over!</h2>
                  <p className="text-text-muted">You did a great job learning today.</p>
                </div>
                
                <div className="bg-gray-50 rounded-3xl p-6">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Final Score</span>
                  <div className="text-5xl font-display font-bold text-primary mt-2">{score}</div>
                </div>

                <div className="flex space-x-4">
                  <button 
                    onClick={() => setGameState('menu')}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
                  >
                    <Settings2 className="h-5 w-5" />
                    <span>Menu</span>
                  </button>
                  <button 
                    onClick={startGame}
                    className="flex-[2] premium-button-primary py-4 flex items-center justify-center space-x-3 text-lg"
                  >
                    <RotateCcw className="h-6 w-6" />
                    <span>Play Again</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubbles Rendering */}
        {gameState === 'playing' && (
          <AnimatePresence>
            {bubbles.map((bubble) => (
              <motion.button
                key={bubble.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.2 } }}
                onClick={() => popBubble(bubble)}
                style={{ 
                  left: bubble.x, 
                  top: bubble.y, 
                  width: bubble.size, 
                  height: bubble.size 
                }}
                className={cn(
                  "absolute rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white/30 backdrop-blur-[2px] transition-transform active:scale-110 z-30 touch-none",
                  bubble.color
                )}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  popBubble(bubble);
                }}
              >
                <span className={cn(
                  "drop-shadow-md",
                  bubble.text.length > 5 ? "text-xs" : bubble.text.length > 2 ? "text-sm" : "text-xl"
                )}>
                  {bubble.text}
                </span>
                <div className="absolute top-2 left-4 w-1/4 h-1/4 bg-white/40 rounded-full blur-[2px]" />
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Floating Hint */}
      {gameState === 'playing' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-6 py-3 bg-white/40 backdrop-blur-md border border-white/50 rounded-full shadow-lg pointer-events-none"
        >
          <p className="text-xs md:text-sm font-bold text-gray-600 flex items-center whitespace-nowrap">
            <Volume2 className="h-4 w-4 mr-2 text-primary" />
            Pop the bubbles for <span className="text-primary mx-1.5 text-lg">{currentTarget?.target}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
