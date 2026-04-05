import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Type, SpellCheck, Feather, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'vowels',
    title: 'স্বরবর্ণ',
    description: 'অ, আ, ই, ঈ... শিখুন',
    icon: Type,
    color: 'bg-red-500',
    path: '/bangla/vowels'
  },
  {
    id: 'consonants',
    title: 'ব্যঞ্জনবর্ণ',
    description: 'ক, খ, গ, ঘ... শিখুন',
    icon: SpellCheck,
    color: 'bg-blue-500',
    path: '/bangla/consonants'
  },
  {
    id: 'conjuncts',
    title: 'যুক্তবর্ণ',
    description: 'যুক্তবর্ণ ভেঙে শব্দ শিখুন',
    icon: BookOpen,
    color: 'bg-green-500',
    path: '/bangla/conjuncts'
  },
  {
    id: 'poems',
    title: 'কবিতা',
    description: 'মজার মজার বাংলা কবিতা পড়ুন',
    icon: Feather,
    color: 'bg-purple-500',
    path: '/bangla/poems'
  }
];

export default function BanglaHome() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-bold mb-4"
        >
          বাংলা <span className="text-primary">বিভাগ</span>
        </motion.h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          বর্ণমালা, যুক্তবর্ণ এবং মজার কবিতার মাধ্যমে বাংলা শিখুন।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={category.path}
              className="premium-card p-8 block group hover:border-primary transition-all h-full"
            >
              <div className={`${category.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                <category.icon className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3">{category.title}</h2>
              <p className="text-text-muted mb-6">{category.description}</p>
              <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform mt-auto">
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
