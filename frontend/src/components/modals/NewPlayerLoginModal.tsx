import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Star, Gift, Sparkles } from 'lucide-react';
import { useNewPlayerLoginStore } from '../../store/newPlayerLoginStore';
import { NEW_PLAYER_REWARDS } from '../../data/newPlayerRewards';
import { ALL_CARDS } from '../../data/cards';
import { useUserStore } from '../../store/userStore';

export const NewPlayerLoginModal: React.FC = () => {
  const { user } = useUserStore();
  const {
    newPlayerStreakDay,
    claimableToday,
    isNewPlayerEligible,
    fetchNewPlayerStreak,
    claimNewPlayerReward,
    loading,
    isOpen,
    setIsOpen
  } = useNewPlayerLoginStore();

  const [showLegendaryPicker, setShowLegendaryPicker] = useState(false);
  const [selectedLegendaryId, setSelectedLegendaryId] = useState<string | null>(null);
  const [successReward, setSuccessReward] = useState<any | null>(null);

  // Filter exclusive legendary cards
  const legendaryCards = ALL_CARDS.filter(c => c.rarity === 'Exclusive Legendary');

  useEffect(() => {
    if (user) {
      fetchNewPlayerStreak();
    }
  }, [user]);

  // Open modal automatically if claimable today and eligible
  useEffect(() => {
    if (claimableToday && isNewPlayerEligible && user) {
      setIsOpen(true);
    }
  }, [claimableToday, isNewPlayerEligible, user]);

  const handleClaim = async () => {
    const nextDay = newPlayerStreakDay + 1;
    
    // Day 7 is legendary card picker
    if (nextDay === 7) {
      setShowLegendaryPicker(true);
      return;
    }

    try {
      const res = await claimNewPlayerReward();
      if (res && res.success) {
        setSuccessReward(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmLegendarySelection = async () => {
    if (!selectedLegendaryId) return;
    try {
      const res = await claimNewPlayerReward(selectedLegendaryId);
      if (res && res.success) {
        setSuccessReward(res);
        setShowLegendaryPicker(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSuccessReward(null);
  };

  if (!isOpen || !user) return null;

  const currentClaimDay = newPlayerStreakDay + 1 > 7 ? 7 : newPlayerStreakDay + 1;

  return (
    <div className="fixed inset-0 z-[150] flex items-start md:items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* Step 1: Claim Success Screen */}
        {successReward ? (
          <motion.div
            key="success-screen"
            className="w-full max-w-md bg-zinc-950 border-2 border-[#d7b73b] rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(215,183,59,0.25)] flex flex-col items-center justify-center my-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#d7b73b]/20 rounded-full blur-xl animate-pulse" />
              <div className="w-20 h-20 bg-[#d7b73b]/10 border border-[#d7b73b]/30 rounded-full flex items-center justify-center relative">
                <Sparkles className="w-10 h-10 text-[#d7b73b] animate-bounce" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-white leading-none mb-2">KLAIM BERHASIL!</h3>
            <p className="text-white/60 text-sm font-semibold mb-6">
              Hadiah Login Pemain Baru Hari ke-{successReward.newStreak} telah ditambahkan ke akun Anda.
            </p>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 flex flex-col items-center justify-center">
              <span className="text-[12px] font-black text-[#d7b73b] uppercase tracking-wider mb-1">HADIAH ANDA</span>
              {successReward.rewardType === 'bp_points' && (
                <span className="text-3xl font-black text-white">+{successReward.rewardAmount} BP</span>
              )}
              {successReward.rewardType === 'gacha_ticket' && (
                <span className="text-3xl font-black text-white">+{successReward.rewardAmount} Tiket Gacha</span>
              )}
              {successReward.rewardType === 'card' && (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-xl font-black text-[#fe2f2f] uppercase">KARTU LEGENDARY!</span>
                  <div className="text-lg font-bold text-white">
                    {ALL_CARDS.find(c => c.id === successReward.rewardCardId)?.name || 'Kartu Eksklusif'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors cursor-pointer text-sm shadow-lg shadow-[#d7b73b]/10"
            >
              MULAI BERMAIN!
            </button>
          </motion.div>
        ) : showLegendaryPicker ? (
          /* Step 2: Legendary Card Picker Screen (Day 7) */
          <motion.div
            key="legendary-picker"
            className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative my-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="text-center mb-6">
              <span className="px-3 py-1 bg-[#fe2f2f]/10 border border-[#fe2f2f]/30 rounded-full text-xs font-black text-[#fe2f2f] tracking-widest uppercase">
                Hari 7: Bonus Legenda
              </span>
              <h2 className="text-3xl font-black text-white mt-3 leading-none">PILIH 1 KARTU LEGENDARY</h2>
              <p className="text-white/50 text-sm font-semibold mt-2">
                Pilih salah satu dari kartu Exclusive Legendary di bawah ini untuk ditambahkan ke koleksi Anda secara permanen.
              </p>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto p-2 border border-white/5 rounded-2xl bg-black/40 mb-6 custom-scrollbar">
              {legendaryCards.map((card) => {
                const isSelected = selectedLegendaryId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedLegendaryId(card.id)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border cursor-pointer transition-all flex flex-col group ${
                      isSelected
                        ? 'border-[#fe2f2f] bg-[#fe2f2f]/10 shadow-[0_0_15px_rgba(254,47,47,0.3)] scale-[1.02]'
                        : 'border-white/10 bg-zinc-900 hover:border-white/30'
                    }`}
                  >
                    {/* Element badge */}
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-extrabold text-white">
                      {card.element}
                    </div>

                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform"
                    />

                    {/* Overlay info */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 text-center">
                      <div className="text-[11px] font-black text-white truncate">{card.name}</div>
                      <div className="text-[9px] font-extrabold text-[#fe2f2f] mt-0.5">{card.rarityLabel}</div>
                    </div>

                    {/* Check Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#fe2f2f]/20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-10 h-10 rounded-full bg-[#fe2f2f] flex items-center justify-center shadow-lg animate-scale">
                          <Check className="w-6 h-6 text-white stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLegendaryPicker(false)}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-extrabold rounded-full transition-colors cursor-pointer text-sm border border-white/10"
              >
                KEMBALI
              </button>
              <button
                onClick={handleConfirmLegendarySelection}
                disabled={!selectedLegendaryId || loading}
                className={`flex-1 py-4 font-black rounded-full transition-colors cursor-pointer text-sm shadow-lg ${
                  selectedLegendaryId
                    ? 'bg-[#fe2f2f] text-white hover:bg-[#d82222] shadow-[#fe2f2f]/20'
                    : 'bg-zinc-800 text-white/30 cursor-not-allowed border border-white/5'
                }`}
              >
                {loading ? 'MEMPROSES...' : 'KONFIRMASI PILIHAN'}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Step 3: Calendar Calendar View */
          <motion.div
            key="calendar-view"
            className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl relative text-center my-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {/* Background Glow */}
            <div className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 w-48 h-48 bg-[#d7b73b]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-4 flex flex-col items-center">
              <div className="px-3 py-1 bg-[#d7b73b]/10 border border-[#d7b73b]/30 rounded-full flex items-center gap-1.5 text-[10px] font-black text-[#d7b73b] tracking-wider uppercase mb-2">
                <Gift className="w-3 h-3" /> EXCLUSIVE WELCOME REWARD
              </div>
              <h2 className="text-2xl font-black text-white m-0">LOGIN PEMAIN BARU</h2>
              <p className="text-white/50 text-xs font-semibold mt-1">
                Hadiah eksklusif 7 hari pertama untuk mempercepat langkah Anda menyusun deck legendaris.
              </p>
            </div>

            {/* Grid 7 Hari */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {NEW_PLAYER_REWARDS.map((reward) => {
                const isClaimed = reward.day <= newPlayerStreakDay;
                const isCurrent = reward.day === currentClaimDay;

                return (
                  <div
                    key={reward.day}
                    className={`relative rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all overflow-hidden ${
                      reward.day === 7 ? 'col-span-2 py-2' : ''
                    } ${
                      isClaimed
                        ? 'bg-green-950/20 border-green-600/30 text-green-500'
                        : isCurrent
                        ? 'bg-[#d7b73b]/10 border-[#d7b73b] text-white shadow-[0_0_15px_rgba(215,183,59,0.2)]'
                        : 'bg-zinc-900/60 border-white/5 text-white/40'
                    }`}
                  >
                    <span className="text-[9px] font-black tracking-wider uppercase mb-0.5">HARI {reward.day}</span>

                    {/* Reward Icon */}
                    {isClaimed ? (
                      <div className="w-5 h-5 rounded-full bg-green-900/30 border border-green-600/40 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-500 stroke-[3]" />
                      </div>
                    ) : reward.day === 7 ? (
                      <Star className={`w-5 h-5 ${isCurrent ? 'text-[#fe2f2f] animate-pulse' : 'text-white/20'}`} />
                    ) : (
                      <Gift className={`w-5 h-5 ${isCurrent ? 'text-[#d7b73b]' : 'text-white/20'}`} />
                    )}

                    <span className="text-[10px] font-black mt-1 text-center truncate w-full px-1">{reward.label}</span>

                    {/* Current tag overlay */}
                    {isCurrent && (
                      <div className="absolute top-0.5 right-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d7b73b] animate-ping" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Reward Message Info */}
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-left mb-4 flex gap-3 items-center">
              <div className="w-8 h-8 bg-[#d7b73b]/10 border border-[#d7b73b]/30 rounded-lg flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-[#d7b73b]" />
              </div>
              <div>
                <div className="text-[9px] font-black text-white/40 uppercase">KLAIM HARI INI (HARI {currentClaimDay})</div>
                <div className="text-sm font-bold text-white mt-0.5">{NEW_PLAYER_REWARDS[currentClaimDay - 1].label}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{NEW_PLAYER_REWARDS[currentClaimDay - 1].description}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-extrabold rounded-full transition-colors cursor-pointer text-xs border border-white/10"
              >
                NANTI SAJA
              </button>
              <button
                onClick={handleClaim}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-black rounded-full transition-all cursor-pointer text-xs shadow-xl shadow-[#d7b73b]/10 flex items-center justify-center gap-1.5"
              >
                {loading ? 'MEMPROSES...' : 'KLAIM HADIAH SEKARANG!'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
