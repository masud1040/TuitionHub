import React from 'react';
import { motion } from 'motion/react';
import { Calculator, Table, BookOpen, ArrowRight, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'general',
    title: 'সাধারণ গণিত',
    description: 'যোগ, বিয়োগ, গুণ ও ভাগ প্র্যাকটিস করুন',
    icon: Calculator,
    color: 'bg-blue-500',
    path: '/math/general'
  },
  {
    id: 'tables',
    title: 'নামাতা',
    description: '১ থেকে ২০ পর্যন্ত নামাতা শিখুন ও পরীক্ষা দিন',
    icon: Table,
    color: 'bg-green-500',
    path: '/math/tables'
  },
  {
    id: 'word-problems',
    title: 'গাণিতিক অঙ্ক',
    description: 'গল্পের মাধ্যমে অংক সমাধান করুন',
    icon: BookOpen,
    color: 'bg-purple-500',
    path: '/math/problems'
  },
  {
    id: 'number-game',
    title: 'সংখ্যার খেলা',
    description: 'সংখ্যা ও কথার মাধ্যমে মজার খেলা',
    icon: Gamepad2,
    color: 'bg-orange-500',
    path: '/math/number-game'
  }
];

export default function MathHome() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-bold mb-4"
        >
          গণিত <span className="text-primary">বিভাগ</span>
        </motion.h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          মজার মাধ্যমে গণিত শিখুন। আপনার পছন্দের বিভাগটি নির্বাচন করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={category.path}
              className="premium-card p-8 block group hover:border-primary transition-all"
            >
              <div className={`${category.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                <category.icon className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3">{category.title}</h2>
              <p className="text-text-muted mb-6">{category.description}</p>
              <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform">
                <span>শুরু করুন</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
