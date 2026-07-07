import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, Star, Gift, Sparkles, X } from 'lucide-react';
import { useDailyLoginStore } from '../../store/dailyLoginStore';
import { DAILY_REWARDS } from '../../data/dailyRewards';
import { ALL_CARDS } from '../../data/cards';
import { useUserStore } from '../../store/userStore';

export const DailyLoginModal: React.FC = () => {
  const { user } = useUserStore();
  const {
    loginStreakDay,
    claimableToday,
    fetchStreak,
    claimDailyReward,
    loading,
    isOpen,
    setIsOpen
  } = useDailyLoginStore();

  const [showLegendaryPicker, setShowLegendaryPicker] = useState(false);
  const [selectedLegendaryId, setSelectedLegendaryId] = useState<string | null>(null);
  const [successReward, setSuccessReward] = useState<any | null>(null);

  // Filter exclusive legendary cards from ALL_CARDS
  const legendaryCards = ALL_CARDS.filter(c => c.rarity === 'Exclusive Legendary');

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user]);

  // Open modal automatically if claimable today
  useEffect(() => {
    if (claimableToday && user) {
      setIsOpen(true);
    }
  }, [claimableToday, user]);

  const handleClaim = async () => {
    const nextDay = loginStreakDay + 1 > 30 ? 1 : loginStreakDay + 1;
    
    // Day 30 is the legendary card selection day
    if (nextDay === 30) {
      setShowLegendaryPicker(true);
      return;
    }

    try {
      const res = await claimDailyReward();
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
      const res = await claimDailyReward(selectedLegendaryId);
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

  const currentClaimDay = loginStreakDay + 1 > 30 ? 1 : loginStreakDay + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* Step 1: Claim Success Screen */}
        {successReward ? (
          <motion.div
            key="success-screen"
            className="w-full max-w-md bg-zinc-900 border border-[#d7b73b]/40 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(215,183,59,0.15)] flex flex-col items-center justify-center"
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
            <p className="text-white/50 text-sm mb-6">Kamu mendapatkan hadiah Daily Login Hari ke-{successReward.newStreak}:</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-8 min-w-[200px] flex flex-col items-center">
              {successReward.rewardType === 'bp_points' && (
                <>
                  <span className="text-3xl font-black text-[#d7b73b]">{successReward.rewardAmount} BP</span>
                  <span className="text-xs text-white/40 mt-1">GOC Battle Points</span>
                </>
              )}
              {successReward.rewardType === 'gacha_ticket' && (
                <>
                  <span className="text-3xl font-black text-[#7333f1]">{successReward.rewardAmount} Tiket</span>
                  <span className="text-xs text-white/40 mt-1">Kesempatan Gacha Pack</span>
                </>
              )}
              {successReward.rewardType === 'card' && (
                <>
                  <span className="text-[11px] font-black uppercase text-[#fe2f2f] mb-1">EXCLUSIVE LEGENDARY</span>
                  <span className="text-xl font-black text-white">
                    {ALL_CARDS.find(c => c.id === successReward.rewardCardId)?.name || 'Kartu Pilihan'}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleClose}
              className="px-8 py-3.5 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors cursor-pointer w-full text-[15px]"
            >
              LULUS & LANJUT KULIAH
            </button>
          </motion.div>
        ) : showLegendaryPicker ? (
          /* Step 2: Legendary Card Picker Screen (Day 30) */
          <motion.div
            key="legendary-picker"
            className="w-full max-w-2xl bg-zinc-950 border border-[#fe2f2f]/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(254,47,47,0.15)] flex flex-col max-h-[85vh]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="text-center mb-6">
              <span className="text-xs font-black text-[#fe2f2f] tracking-widest uppercase">CONGRATULATIONS - ATTENDANCE DAY 30</span>
              <h3 className="text-3xl font-black text-white leading-none mt-1">PILIH KARTU LEGENDARY ANDA</h3>
              <p className="text-white/50 text-sm mt-2">Selamat atas login 30 hari penuh! Pilih satu dari kartu Legendary berikut untuk langsung ditambahkan ke koleksi Anda.</p>
            </div>

            {/* Grid of Legendary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-2 mb-6 min-h-[250px]">
              {legendaryCards.map((card) => {
                const isSelected = selectedLegendaryId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedLegendaryId(card.id)}
                    className={`relative cursor-pointer rounded-2xl border p-3 flex flex-col justify-between h-[150px] transition-all select-none ${
                      isSelected
                        ? 'border-[#fe2f2f] bg-[#fe2f2f]/10 shadow-[0_0_15px_rgba(254,47,47,0.3)]'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase text-[#fe2f2f]">LEGENDARY</span>
                      {isSelected && (
                        <div className="w-4 h-4 bg-[#fe2f2f] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[13px] font-black leading-tight text-white">{card.name}</span>
                      <span className="text-[10px] text-white/50 mt-1">{card.element}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-white/10 shrink-0">
              <button
                onClick={() => setShowLegendaryPicker(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-colors cursor-pointer text-sm"
              >
                KEMBALI
              </button>
              <button
                onClick={handleConfirmLegendarySelection}
                disabled={!selectedLegendaryId || loading}
                className="flex-1 py-3 bg-[#fe2f2f] hover:bg-[#d62424] disabled:opacity-40 disabled:hover:bg-[#fe2f2f] text-white font-extrabold rounded-full transition-colors cursor-pointer text-sm shadow-lg shadow-red-900/30"
              >
                PILIH & KLAIM
              </button>
            </div>
          </motion.div>
        ) : (
          /* Step 3: Calendar Attendance Screen */
          <motion.div
            key="attendance-grid"
            className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col max-h-[90vh] relative shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title / Streak Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0 text-left pr-10">
              <div>
                <span className="text-xs font-black text-[#d7b73b] tracking-widest uppercase">GOC ATTENDANCE</span>
                <h3 className="text-3xl font-black text-white leading-none mt-1">DAILY LOGIN REWARDS</h3>
                <p className="text-white/50 text-sm mt-1.5">Login setiap hari untuk mendapatkan koin BP, Tiket Gacha, dan Legendary Card pilihan!</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#d7b73b]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 leading-none">STREAK AKTIF</span>
                  <span className="text-[17px] font-black text-white mt-1">{loginStreakDay} / 30 Hari</span>
                </div>
              </div>
            </div>

            {/* Rewards 30 Days Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 overflow-y-auto flex-1 pr-2 mb-6">
              {DAILY_REWARDS.map((reward) => {
                const isClaimed = reward.day <= loginStreakDay;
                const isToday = reward.day === currentClaimDay && claimableToday;

                return (
                  <div
                    key={reward.day}
                    className={`relative rounded-xl border p-2 flex flex-col justify-between h-[85px] transition-all text-left ${
                      isClaimed
                        ? 'border-green-600/30 bg-green-950/20 opacity-60'
                        : isToday
                        ? 'border-[#d7b73b] bg-[#d7b73b]/10 shadow-[0_0_15px_rgba(215,183,59,0.2)] animate-pulse'
                        : reward.day === 30
                        ? 'border-[#fe2f2f]/40 bg-[#fe2f2f]/5'
                        : 'border-white/5 bg-zinc-900/60'
                    }`}
                  >
                    {/* Day index */}
                    <span className="text-[10px] font-black text-white/40">D-{reward.day}</span>

                    {/* Reward Detail icon / text */}
                    <div className="flex flex-col items-center text-center justify-center flex-1 my-1">
                      {reward.type === 'bp_points' && (
                        <>
                          <Gift className={`w-4 h-4 ${isToday ? 'text-[#d7b73b]' : 'text-white/60'}`} />
                          <span className="text-[11px] font-black text-white mt-1 leading-none">{reward.amount} BP</span>
                        </>
                      )}
                      {reward.type === 'gacha_ticket' && (
                        <>
                          <Star className={`w-4 h-4 ${isToday ? 'text-[#7333f1]' : 'text-[#7333f1]/70'}`} />
                          <span className="text-[11px] font-black text-white mt-1 leading-none">+{reward.amount} Tkt</span>
                        </>
                      )}
                      {reward.type === 'card' && (
                        <>
                          <Sparkles className="w-5 h-5 text-[#fe2f2f] animate-pulse" />
                          <span className="text-[9px] font-black text-[#fe2f2f] mt-1 leading-none">LEGENDARY</span>
                        </>
                      )}
                    </div>

                    {/* Footer Status */}
                    <div className="flex items-center justify-between text-[9px] font-black leading-none">
                      {isClaimed ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> KLAIMED
                        </span>
                      ) : isToday ? (
                        <span className="text-[#d7b73b]">KLAIM!</span>
                      ) : (
                        <span className="text-white/20">READY</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom button for claiming */}
            <div className="shrink-0 flex justify-end">
              {claimableToday ? (
                <button
                  onClick={handleClaim}
                  disabled={loading}
                  className="px-8 py-3.5 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors cursor-pointer text-sm shadow-xl flex items-center gap-2 animate-bounce"
                >
                  <Gift className="w-4 h-4" /> KLAIM SEKARANG
                </button>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-colors cursor-pointer text-sm"
                >
                  TUTUP & LANJUT MAIN
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
