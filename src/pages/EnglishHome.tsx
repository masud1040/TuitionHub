import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Type, SpellCheck, Feather, ArrowRight, FileText, PenTool, CheckCircle2, Mail, Sigma, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function EnglishHome() {
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
          where('subject', '==', 'English')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setEnabledSections(data.enabledSections || []);
        } else {
          // Default sections if no settings found
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
  }, []);

  const studentClass = studentSession ? Number(studentSession.class) : 1;

  const getCategories = () => {
    if (studentClass <= 2) {
      return [
        {
          id: 'alphabet',
          title: 'Alphabet',
          description: 'Learn A, B, C, D...',
          icon: Type,
          color: 'bg-blue-500',
          path: '/english/alphabet'
        },
        {
          id: 'words',
          title: 'Word Making',
          description: 'Learn simple words',
          icon: SpellCheck,
          color: 'bg-green-500',
          path: '/english/words'
        },
        {
          id: 'rhymes',
          title: 'Rhymes',
          description: 'Fun English rhymes',
          icon: Feather,
          color: 'bg-purple-500',
          path: '/english/rhymes'
        },
        {
          id: 'game',
          title: 'Bubble Pop Game',
          description: 'Fun interactive learning game',
          icon: Gamepad2,
          color: 'bg-orange-500',
          path: '/game'
        },
        {
          id: 'simple-test',
          title: 'Simple Test',
          description: 'Test your knowledge (A for...?)',
          icon: CheckCircle2,
          color: 'bg-red-500',
          path: '/simple-quiz?subject=English'
        }
      ];
    }

    // For Class 3-10, use settings
    const categories = [];

    // Add Word Making for class 3
    if (studentClass === 3) {
      categories.push({
        id: 'words',
        title: 'Word Making',
        description: 'Learn simple words',
        icon: SpellCheck,
        color: 'bg-green-500',
        path: '/english/words'
      });
    }

    if (enabledSections.includes('quiz')) {
      categories.push({
        id: 'quiz',
        title: 'Quiz Test',
        description: 'Test your English skills',
        icon: CheckCircle2,
        color: 'bg-orange-500',
        path: '/?tab=quiz'
      });
    }

    if (enabledSections.includes('paragraph')) {
      categories.push({
        id: 'paragraphs',
        title: 'Paragraphs',
        description: 'Important English paragraphs',
        icon: FileText,
        color: 'bg-teal-500',
        path: '/?tab=writing&type=paragraph'
      });
    }

    if (enabledSections.includes('test')) {
      categories.push({
        id: 'test',
        title: 'Model Test',
        description: 'Prepare for exams',
        icon: FileText,
        color: 'bg-red-500',
        path: '/?tab=mcqs'
      });
    }

    if (enabledSections.includes('formula')) {
      categories.push({
        id: 'grammar',
        title: 'Grammar Rules',
        description: 'Important English grammar rules',
        icon: Sigma,
        color: 'bg-indigo-500',
        path: '/?tab=formulas'
      });
    }

    // Add custom sections
    const defaultSections = ['quiz', 'test', 'paragraph', 'formula'];
    enabledSections.forEach(section => {
      if (!defaultSections.includes(section)) {
        let icon = BookOpen;
        let color = 'bg-teal-500';

        if (section.toLowerCase().includes('email')) {
          icon = Mail;
          color = 'bg-blue-600';
        } else if (section.toLowerCase().includes('application')) {
          icon = FileText;
          color = 'bg-pink-500';
        } else if (section.toLowerCase().includes('composition')) {
          icon = PenTool;
          color = 'bg-indigo-500';
        }

        categories.push({
          id: section,
          title: section.charAt(0).toUpperCase() + section.slice(1),
          description: `${section} related materials`,
          icon: icon,
          color: color,
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
          English <span className="text-primary">Section</span>
        </motion.h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          {studentClass <= 3 
            ? "Learn English through alphabets, words, and rhymes." 
            : "Access English study materials suitable for your class."}
        </p>
      </div>

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
                <span>Start Learning</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
