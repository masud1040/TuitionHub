import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SubjectPage({ name }: { name: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card p-16 max-w-2xl mx-auto"
      >
        <div className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">{name} Resources</h1>
        <p className="text-text-muted text-lg mb-10 leading-relaxed">
          Welcome to the {name} section. We are currently curating the best study materials, 
          practice sheets, and video lessons for you. Check back soon!
        </p>
        <Link 
          to="/" 
          className="premium-button-primary inline-flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Diary</span>
        </Link>
      </motion.div>
    </div>
  );
}
