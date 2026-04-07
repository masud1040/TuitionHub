import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Type, SpellCheck, Feather, ArrowRight, FileText, PenTool, CheckCircle2, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function BanglaHome() {
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
          where('subject', '==', 'Bangla')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setEnabledSections(data.enabledSections || []);
        } else {
          // Default sections if no settings found
          if (currentClass >= 3) {
            setEnabledSections(['quiz', 'test']);
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
        },
        {
          id: 'game',
          title: 'বাবল পপ গেম',
          description: 'মজার বাবল পপ গেম খেলুন',
          icon: Gamepad2,
          color: 'bg-orange-500',
          path: '/game'
        },
        {
          id: 'simple-test',
          title: 'সহজ কুইজ',
          description: 'আপনার মেধা যাচাই করুন (অ তে কি...?)',
          icon: CheckCircle2,
          color: 'bg-red-500',
          path: '/simple-quiz?subject=Bangla'
        }
      ];
    }

    // For Class 3-10, use settings
    const categories = [];

    if (enabledSections.includes('quiz')) {
      categories.push({
        id: 'quiz',
        title: 'কুইজ টেস্ট',
        description: 'আপনার মেধা যাচাই করুন',
        icon: CheckCircle2,
        color: 'bg-orange-500',
        path: '/?tab=quiz'
      });
    }

    if (enabledSections.includes('test')) {
      categories.push({
        id: 'test',
        title: 'মডেল টেস্ট',
        description: 'পরীক্ষার প্রস্তুতি নিন',
        icon: FileText,
        color: 'bg-red-500',
        path: '/?tab=mcqs'
      });
    }

    // Add custom sections
    const defaultSections = ['quiz', 'test', 'paragraph', 'formula'];
    enabledSections.forEach(section => {
      if (!defaultSections.includes(section)) {
        let title = section.charAt(0).toUpperCase() + section.slice(1);
        let icon = BookOpen;
        let color = 'bg-teal-500';

        if (section.includes('রচনা')) {
          title = 'রচনা সমূহ';
          icon = PenTool;
          color = 'bg-indigo-500';
        } else if (section.includes('দরখাস্ত')) {
          title = 'দরখাস্ত সমূহ';
          icon = FileText;
          color = 'bg-pink-500';
        }

        categories.push({
          id: section,
          title: title,
          description: `${title} সংক্রান্ত সকল তথ্য`,
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
          বাংলা <span className="text-primary">বিভাগ</span>
        </motion.h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          {studentClass <= 2 
            ? "বর্ণমালা, যুক্তবর্ণ এবং মজার কবিতার মাধ্যমে বাংলা শিখুন।" 
            : "আপনার ক্লাসের উপযোগী বাংলা কন্টেন্ট এখান থেকে পড়ুন।"}
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
