import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowLeft, CheckCircle2, FileText, PenTool, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SubjectPage({ name }: { name: string }) {
  const [studentSession, setStudentSession] = useState<any>(null);
  const [enabledSections, setEnabledSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('studentSession');
    let currentClass = 1;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setStudentSession(parsed);
        currentClass = Number(parsed.class);
      } catch (e) {
        console.error("Error parsing student session:", e);
      }
    }

    const fetchSettings = async () => {
      try {
        const q = query(
          collection(db, 'class_settings'),
          where('class', '==', currentClass),
          where('subject', '==', name)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setEnabledSections(data.enabledSections || []);
        } else {
          // Default sections
          if (currentClass >= 3) {
            setEnabledSections(['quiz', 'paragraph']);
          }
        }
      } catch (error) {
        console.error("Error fetching class settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [name]);

  const getCategories = () => {
    const categories = [];

    if (enabledSections.includes('quiz')) {
      categories.push({
        id: 'quiz',
        title: 'Quiz Test',
        description: 'Test your knowledge',
        icon: CheckCircle2,
        color: 'bg-orange-500',
        path: '/?tab=quiz'
      });
    }

    if (enabledSections.includes('paragraph')) {
      categories.push({
        id: 'paragraph',
        title: 'Paragraphs',
        description: 'Important paragraphs for exams',
        icon: FileText,
        color: 'bg-indigo-500',
        path: '/?tab=writing&type=paragraph'
      });
    }

    // Add custom sections
    const defaultSections = ['quiz', 'test', 'paragraph', 'formula'];
    enabledSections.forEach(section => {
      if (!defaultSections.includes(section)) {
        categories.push({
          id: section,
          title: section.charAt(0).toUpperCase() + section.slice(1),
          description: `${section} related materials`,
          icon: BookOpen,
          color: 'bg-teal-500',
          path: `/?tab=writing&type=${section}`
        });
      }
    });

    return categories;
  };

  const categories = getCategories();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-bold mb-4"
        >
          {name} <span className="text-primary">Section</span>
        </motion.h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          Access your class-specific {name.toLowerCase()} content here.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <span>Start Now</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-16 max-w-2xl mx-auto text-center"
        >
          <div className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-4">No Content Available</h2>
          <p className="text-text-muted mb-8">
            There are no sections enabled for your class in this subject yet.
          </p>
          <Link to="/" className="premium-button-primary inline-flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
