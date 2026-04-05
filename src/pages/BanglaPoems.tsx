import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Poem {
  id: string;
  title: string;
  content: string;
  author?: string;
}

export default function BanglaPoems() {
  const [poems, setPoems] = React.useState<Poem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPoem, setSelectedPoem] = React.useState<Poem | null>(null);

  React.useEffect(() => {
    const fetchPoems = async () => {
      try {
        const q = query(collection(db, 'bangla_poems'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const fetchedPoems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Poem[];
        setPoems(fetchedPoems);
      } catch (error) {
        console.error("Error fetching poems:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoems();
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
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">মজার কবিতা</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          শিক্ষকদের দেওয়া মজার মজার বাংলা কবিতা পড়ুন।
        </p>
      </div>

      {selectedPoem ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <button 
            onClick={() => setSelectedPoem(null)}
            className="mb-6 text-primary hover:underline font-medium"
          >
            ← অন্য কবিতা দেখুন
          </button>
          <div className="premium-card p-8 md:p-12 bg-purple-50/30 border-purple-100">
            <h2 className="text-3xl font-bold text-purple-900 mb-2 text-center">{selectedPoem.title}</h2>
            {selectedPoem.author && (
              <p className="text-center text-purple-600 font-medium mb-8">{selectedPoem.author}</p>
            )}
            <div className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800 text-center font-medium">
              {selectedPoem.content}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {poems.length > 0 ? (
            poems.map((poem, index) => (
              <motion.div
                key={poem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  onClick={() => setSelectedPoem(poem)}
                  className="premium-card p-6 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all h-full flex flex-col"
                >
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-purple-600">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{poem.title}</h3>
                  <p className="text-text-muted line-clamp-3 mb-4">
                    {poem.content}
                  </p>
                  <div className="mt-auto text-purple-600 font-medium">
                    পুরো কবিতা পড়ুন →
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-text-muted">
              এখনো কোনো কবিতা যোগ করা হয়নি।
            </div>
          )}
        </div>
      )}
    </div>
  );
}
