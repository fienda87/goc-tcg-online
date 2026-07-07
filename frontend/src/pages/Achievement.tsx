import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Unlock, Award } from 'lucide-react';
import { useAchievementStore } from '../store/achievementStore';
import { useUserStore } from '../store/userStore';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievements';
import { useNavigate } from 'react-router-dom';

export const Achievement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { unlockedKeys, loading, fetchAchievements } = useAchievementStore();
  
  const [activeCategory, setActiveCategory] = useState<'all' | 'collection_size' | 'element_set' | 'rarity_set' | 'special'>('all');

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  // Filter definitions based on active category
  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENT_DEFINITIONS;
    return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === activeCategory);
  }, [activeCategory]);

  const unlockedCount = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.filter(a => unlockedKeys.includes(a.key)).length;
  }, [unlockedKeys]);

  const progressPercent = useMemo(() => {
    if (ACHIEVEMENT_DEFINITIONS.length === 0) return 0;
    return Math.round((unlockedCount / ACHIEVEMENT_DEFINITIONS.length) * 100);
  }, [unlockedCount]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 pt-32 text-center text-white">
        <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 text-white/40 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black mb-3">PRESTASI AKADEMIK</h1>
        <p className="text-white/50 text-sm max-w-sm mb-6">
          Achievement hanya tersedia untuk pemain yang terdaftar. Masuk akun untuk mulai melacak pencapaian koleksi Anda!
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors cursor-pointer text-sm"
        >
          MASUK AKUN
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-12 pt-32 md:pt-36 pb-20 max-w-[1100px] mx-auto text-white">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 text-left">
        <div>
          <h1 className="text-[45px] md:text-[55px] text-white leading-none font-black m-0 font-display">PRESTASI.</h1>
          <p className="text-[16px] md:text-[18px] font-bold text-white/50 m-0 mt-2">
            Pencapaian akademis dan koleksi kartu TCG Anda.
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#d7b73b]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex-1 text-left w-full">
          <span className="text-[11px] font-black text-[#d7b73b] tracking-wider uppercase">PROGRESS OVERALL</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black text-white">{unlockedCount}</span>
            <span className="text-white/40 font-bold">/ {ACHIEVEMENT_DEFINITIONS.length} Terbuka</span>
          </div>

          {/* Custom progress bar */}
          <div className="relative w-full h-3 bg-white/10 rounded-full mt-4 overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#d7b73b] to-[#c0a232] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/15 rounded-2xl px-6 py-4 flex flex-col items-center min-w-[150px] shrink-0">
          <Award className="w-8 h-8 text-[#d7b73b] mb-1" />
          <span className="text-2xl font-black text-white">{progressPercent}%</span>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-wider mt-0.5">SELESAI</span>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4 mb-8 select-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all border ${
            activeCategory === 'all'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setActiveCategory('collection_size')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all border ${
            activeCategory === 'collection_size'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          Jumlah Koleksi
        </button>
        <button
          onClick={() => setActiveCategory('element_set')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all border ${
            activeCategory === 'element_set'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          Komplet Atribut
        </button>
        <button
          onClick={() => setActiveCategory('rarity_set')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all border ${
            activeCategory === 'rarity_set'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          Komplet Tier
        </button>
        <button
          onClick={() => setActiveCategory('special')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all border ${
            activeCategory === 'special'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          Spesial
        </button>
      </div>

      {/* Achievement Grid */}
      {loading && unlockedKeys.length === 0 ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/10 border-t-[#d7b73b] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => {
            const isUnlocked = unlockedKeys.includes(ach.key);

            return (
              <div
                key={ach.key}
                className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all select-none ${
                  isUnlocked
                    ? 'border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_20px_rgba(215,183,59,0.05)]'
                    : 'border-white/5 bg-zinc-900/40 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isUnlocked ? 'bg-[#d7b73b]/10 text-[#d7b73b]' : 'bg-white/5 text-white/20'
                  }`}>
                    {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>

                  {/* Status Badge */}
                  {isUnlocked ? (
                    <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-white/20 bg-white/5 px-2 py-0.5 rounded uppercase">
                      LOCKED
                    </span>
                  )}
                </div>

                <div className="flex flex-col text-left mb-6">
                  <span className={`text-[16px] font-black leading-tight ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                    {ach.name}
                  </span>
                  <span className="text-[12px] text-white/40 mt-1.5 leading-snug">
                    {ach.description}
                  </span>
                </div>

                {/* Reward detail */}
                <div className="flex justify-between items-center border-t border-white/5 pt-4 text-xs">
                  <span className="text-white/40 font-bold">Reward:</span>
                  <span className={`font-black uppercase tracking-wider text-[11px] ${isUnlocked ? 'text-[#d7b73b]' : 'text-white/30'}`}>
                    🎁 {ach.rewardLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
