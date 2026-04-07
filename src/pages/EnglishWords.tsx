import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, SpellCheck, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const wordsData = [
  { letter: 'A', words: [{ en: 'Apple', bn: 'আপেল' }, { en: 'Ant', bn: 'পিঁপড়া' }] },
  { letter: 'B', words: [{ en: 'Ball', bn: 'বল' }, { en: 'Bat', bn: 'ব্যাট' }] },
  { letter: 'C', words: [{ en: 'Cat', bn: 'বিড়াল' }, { en: 'Cow', bn: 'গরু' }] },
  { letter: 'D', words: [{ en: 'Dog', bn: 'কুকুর' }, { en: 'Duck', bn: 'হাঁস' }] },
  { letter: 'E', words: [{ en: 'Egg', bn: 'ডিম' }, { en: 'Eagle', bn: 'ঈগল' }] },
  { letter: 'F', words: [{ en: 'Fish', bn: 'মাছ' }, { en: 'Frog', bn: 'ব্যাঙ' }] },
  { letter: 'G', words: [{ en: 'Goat', bn: 'ছাগল' }, { en: 'Girl', bn: 'বালিকা' }] },
  { letter: 'H', words: [{ en: 'Hen', bn: 'মুরগি' }, { en: 'Home', bn: 'বাড়ি' }] },
  { letter: 'I', words: [{ en: 'Insect', bn: 'পোকামাকড়' }, { en: 'Ice', bn: 'বরফ' }] },
  { letter: 'J', words: [{ en: 'Jug', bn: 'জগ' }, { en: 'Jeep', bn: 'জিপ' }] },
  { letter: 'K', words: [{ en: 'Kite', bn: 'ঘুড়ি' }, { en: 'Kingfisher', bn: 'মাছরাঙা' }] },
  { letter: 'L', words: [{ en: 'Lotus', bn: 'পদ্ম' }, { en: 'Leaf', bn: 'পাতা' }] },
  { letter: 'M', words: [{ en: 'Moon', bn: 'চাঁদ' }, { en: 'Mango', bn: 'আম' }] },
  { letter: 'N', words: [{ en: 'Net', bn: 'জাল' }, { en: 'Nest', bn: 'পাখির বাসা' }] },
  { letter: 'O', words: [{ en: 'Ox', bn: 'ষাঁড়' }, { en: 'Oil', bn: 'তেল' }] },
  { letter: 'P', words: [{ en: 'Pen', bn: 'কলম' }, { en: 'Pot', bn: 'পাত্র' }] },
  { letter: 'Q', words: [{ en: 'Quilt', bn: 'লেপ' }, { en: 'Queen', bn: 'রাণী' }] },
  { letter: 'R', words: [{ en: 'Ruler', bn: 'রুলার' }, { en: 'Rat', bn: 'ইঁদুর' }] },
  { letter: 'S', words: [{ en: 'Sun', bn: 'সূর্য' }, { en: 'Sky', bn: 'আকাশ' }] },
  { letter: 'T', words: [{ en: 'Tomato', bn: 'টমেটো' }, { en: 'Turtle', bn: 'কচ্ছপ' }] },
  { letter: 'U', words: [{ en: 'Umbrella', bn: 'ছাতা' }] },
  { letter: 'V', words: [{ en: 'Van', bn: 'ভ্যান' }] },
  { letter: 'W', words: [{ en: 'Water', bn: 'পানি' }] },
  { letter: 'X', words: [{ en: 'X-ray', bn: 'এক্সরে' }] },
  { letter: 'Y', words: [{ en: 'Yoke', bn: 'জোয়াল' }] },
  { letter: 'Z', words: [{ en: 'Zebra', bn: 'জেব্রা' }] },
];

const WikiImage = ({ word }: { word: string }) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchImage = async () => {
      try {
        // Use Wikipedia REST API to get page summary which includes a thumbnail
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`);
        const data = await response.json();
        if (data.thumbnail && data.thumbnail.source) {
          setImageUrl(data.thumbnail.source);
        } else {
          // Fallback to a search if direct summary fails or has no image
          const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=pageimages&format=json&pithumbsize=200&origin=*`);
          const searchData = await searchRes.json();
          const pages = searchData.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail) {
            setImageUrl(pages[pageId].thumbnail.source);
          }
        }
      } catch (error) {
        console.error("Error fetching wiki image:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImage();
  }, [word]);

  if (loading) return <div className="w-full h-full bg-gray-50 animate-pulse flex items-center justify-center text-[10px] text-gray-300">Loading...</div>;
  
  return (
    <img 
      src={imageUrl || `https://picsum.photos/seed/${word}/150/150`}
      alt={word}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      referrerPolicy="no-referrer"
    />
  );
};

export default function EnglishWords() {
  const speak = (text: string, letter: string) => {
    const utterance = new SpeechSynthesisUtterance(`${letter} for ${text}`);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower for kids
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <Link 
          to="/english"
          className="inline-flex items-center text-primary font-medium hover:translate-x-[-4px] transition-transform mb-8"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          <span>Back to English</span>
        </Link>
        
        <div className="flex items-center space-x-6 mb-8">
          <div className="bg-green-500 p-4 rounded-3xl text-white shadow-lg shadow-green-500/20">
            <SpellCheck className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Word Making</h1>
            <p className="text-text-muted text-lg">Learn words with real Wikipedia pictures and sound</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wordsData.map((item, index) => (
          <motion.div
            key={item.letter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="premium-card p-6 border-2 border-transparent hover:border-green-500/30 transition-all"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-500/20">
                {item.letter}
              </div>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            
            <div className="space-y-4">
              {item.words.map((wordObj, wIdx) => (
                <motion.button
                  key={wIdx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => speak(wordObj.en, item.letter)}
                  className="w-full flex items-center p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-green-500/5 hover:border-green-200 transition-all group text-left"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 mr-4 shrink-0">
                    <WikiImage word={wordObj.en} />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                      {wordObj.en}
                    </div>
                    <div className="text-sm font-medium text-primary/70">
                      {wordObj.bn}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center mt-1">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Click to hear
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
