import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Feather, Play, X, Music, Video } from 'lucide-react';

interface Rhyme {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  createdAt: any;
}

export default function EnglishRhymes() {
  const [rhymes, setRhymes] = useState<Rhyme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRhyme, setSelectedRhyme] = useState<Rhyme | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'english_rhymes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rhyme[];
      setRhymes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-3 bg-purple-100 text-purple-700 px-6 py-2 rounded-full mb-6"
        >
          <Feather className="h-5 w-5" />
          <span className="font-bold tracking-wider uppercase text-sm">English Rhymes</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Fun <span className="text-primary">English Rhymes</span>
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          Sing along and learn with these beautiful English rhymes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rhymes.map((rhyme, index) => (
          <motion.div
            key={rhyme.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="premium-card group cursor-pointer overflow-hidden"
            onClick={() => setSelectedRhyme(rhyme)}
          >
            <div className="p-8">
              <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                {rhyme.videoUrl ? <Video className="h-8 w-8" /> : <Music className="h-8 w-8" />}
              </div>
              <h2 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors">
                {rhyme.title}
              </h2>
              <p className="text-text-muted line-clamp-3 mb-6 whitespace-pre-line">
                {rhyme.content}
              </p>
              <div className="flex items-center text-primary font-bold group-hover:translate-x-2 transition-transform">
                <span>Read & Watch</span>
                <Play className="ml-2 h-4 w-4 fill-current" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {rhymes.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Feather className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No rhymes added yet. Check back later!</p>
        </div>
      )}

      {/* Rhyme Modal */}
      <AnimatePresence>
        {selectedRhyme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedRhyme(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedRhyme(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-gray-800"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Video Section */}
              {selectedRhyme.videoUrl && getYoutubeEmbedUrl(selectedRhyme.videoUrl) ? (
                <div className="w-full lg:w-1/2 bg-black aspect-video lg:aspect-auto flex items-center justify-center">
                  <iframe
                    className="w-full h-full"
                    src={getYoutubeEmbedUrl(selectedRhyme.videoUrl)!}
                    title={selectedRhyme.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="w-full lg:w-1/2 bg-purple-50 flex items-center justify-center p-12 aspect-video lg:aspect-auto">
                  <div className="text-center">
                    <div className="bg-purple-100 w-24 h-24 rounded-full flex items-center justify-center mb-6 mx-auto text-purple-600">
                      <Music className="h-12 w-12" />
                    </div>
                    <p className="text-purple-700 font-bold text-xl">Enjoy the Rhyme!</p>
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className="w-full lg:w-1/2 p-8 lg:p-12 overflow-y-auto">
                <h2 className="text-3xl lg:text-4xl font-display font-bold mb-8 text-gray-900 border-b-4 border-primary/20 pb-4 inline-block">
                  {selectedRhyme.title}
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-xl leading-relaxed text-gray-700 whitespace-pre-line font-medium italic">
                    {selectedRhyme.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
