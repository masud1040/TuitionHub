import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Conjunct {
  id: string;
  combined: string;
  broken: string;
  word: string;
}

export default function BanglaConjuncts() {
  const [conjuncts, setConjuncts] = React.useState<Conjunct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchConjuncts = async () => {
      try {
        const q = query(collection(db, 'bangla_conjuncts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const fetchedConjuncts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Conjunct[];
        setConjuncts(fetchedConjuncts);
      } catch (error) {
        console.error("Error fetching conjuncts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConjuncts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/bangla" className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" />
          ফিরে যান
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">যুক্তবর্ণ</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          যুক্তবর্ণ ভেঙে শব্দ তৈরি করা শিখুন।
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {conjuncts.length > 0 ? (
          conjuncts.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="premium-card p-6 border-l-4 border-green-500 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-4xl font-bold text-gray-800">
                  {item.combined}
                </div>
                <div className="text-xl font-medium text-green-600 bg-green-50 px-4 py-2 rounded-full">
                  {item.broken}
                </div>
                <div className="text-2xl font-bold text-gray-700">
                  {item.word}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-text-muted">
            এখনো কোনো যুক্তবর্ণ যোগ করা হয়নি।
          </div>
        )}
      </div>
    </div>
  );
}
