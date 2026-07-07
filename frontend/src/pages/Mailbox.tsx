import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MailOpen, Gift, Check, X, Inbox } from 'lucide-react';
import { useMailboxStore, type MailboxMessage } from '../store/mailboxStore';
import { useUserStore } from '../store/userStore';
import { useNavigate } from 'react-router-dom';

export const Mailbox: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const {
    messages,
    loading,
    fetchMessages,
    claimReward,
    claimAllRewards
  } = useMailboxStore();

  const [activeMessage, setActiveMessage] = useState<MailboxMessage | null>(null);
  const [successClaim, setSuccessClaim] = useState<boolean>(false);
  const [claimingAllStatus, setClaimingAllStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const handleClaim = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening modal
    try {
      const ok = await claimReward(messageId);
      if (ok) {
        setSuccessClaim(true);
        setTimeout(() => setSuccessClaim(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimAll = async () => {
    setClaimingAllStatus('Mengambil hadiah...');
    try {
      const { successCount } = await claimAllRewards();
      if (successCount > 0) {
        setClaimingAllStatus(`Berhasil mengklaim ${successCount} hadiah!`);
      } else {
        setClaimingAllStatus('Tidak ada hadiah baru untuk diklaim.');
      }
      setTimeout(() => setClaimingAllStatus(null), 3000);
    } catch (err) {
      setClaimingAllStatus('Gagal mengklaim semua hadiah.');
      setTimeout(() => setClaimingAllStatus(null), 3000);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 pt-32 text-center text-white">
        <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-10 h-10 text-white/40" />
        </div>
        <h1 className="text-3xl font-black mb-3">KOTAK MASUK GOC</h1>
        <p className="text-white/50 text-sm max-w-sm mb-6">
          Sistem Mailbox hanya tersedia untuk pemain yang terdaftar. Masuk akun untuk melihat pesan dan mengklaim hadiah Anda!
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

  const unclaimedCount = messages.filter(m => !m.isClaimed && m.rewardType !== 'none').length;

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-12 pt-32 md:pt-36 pb-20 max-w-[1000px] mx-auto text-white">
      
      {/* Toast Notifs */}
      <AnimatePresence>
        {successClaim && (
          <motion.div
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 border border-green-600 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md font-bold text-[14px] flex items-center gap-2"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            <span>✅ Hadiah berhasil diklaim & masuk ke koleksi!</span>
          </motion.div>
        )}
        {claimingAllStatus && (
          <motion.div
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#7333f1]/90 border border-[#8349f2] text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md font-bold text-[14px] flex items-center gap-2"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            <span>🎁 {claimingAllStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mailbox Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 text-left">
        <div>
          <h1 className="text-[45px] md:text-[55px] text-white leading-none font-black m-0">KOTAK MASUK.</h1>
          <p className="text-[16px] md:text-[18px] font-bold text-white/50 m-0 mt-2">
            Terima informasi penting dan klaim hadiah pencapaian kuliahmu.
          </p>
        </div>

        {unclaimedCount > 0 && (
          <button
            onClick={handleClaimAll}
            className="px-6 py-3 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors cursor-pointer text-sm shadow-xl flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Gift className="w-4 h-4" /> KLAIM SEMUA ({unclaimedCount})
          </button>
        )}
      </div>

      {/* Message List Grid */}
      {loading && messages.length === 0 ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/10 border-t-[#d7b73b] rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-md flex flex-col items-center justify-center">
          <Inbox className="w-16 h-16 text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-white/70 m-0">Kotak Masuk Kosong</h3>
          <p className="text-sm text-white/40 mt-1 max-w-xs m-0">Belum ada pesan masuk saat ini. Terus kumpulkan kartu untuk membuka achievement!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const hasAttachment = msg.rewardType !== 'none';
            const isUnread = !msg.isClaimed;

            return (
              <div
                key={msg.id}
                onClick={() => setActiveMessage(msg)}
                className={`relative rounded-2xl border px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all cursor-pointer text-left select-none ${
                  isUnread
                    ? 'border-white/15 bg-white/5 shadow-md hover:border-white/25 hover:bg-white/10'
                    : 'border-white/5 bg-zinc-900/40 opacity-70 hover:opacity-100 hover:border-white/10'
                }`}
              >
                <div className="flex gap-4 flex-1 items-start">
                  {/* Read/Unread Icon */}
                  <div className="mt-1">
                    {msg.isClaimed ? (
                      <MailOpen className="w-5 h-5 text-white/30" />
                    ) : (
                      <Mail className="w-5 h-5 text-[#d7b73b]" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-[15px] font-black leading-tight ${isUnread ? 'text-white' : 'text-white/60'}`}>
                        {msg.title}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#d7b73b]" />
                      )}
                    </div>
                    <span className="text-[12px] text-white/40 mt-1 leading-snug line-clamp-1">
                      {msg.body}
                    </span>
                    <span className="text-[10px] text-white/30 mt-2">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Attachment / Claim action */}
                {hasAttachment && (
                  <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between border-t border-white/5 pt-3 md:border-none md:pt-0">
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] font-black text-white/40 uppercase">LAMPIRAN</span>
                      <span className="text-xs font-bold text-[#d7b73b] mt-0.5">
                        {msg.rewardType === 'bp_points' && `${msg.rewardAmount} BP`}
                        {msg.rewardType === 'gacha_ticket' && `${msg.rewardAmount} Tiket Gacha`}
                        {msg.rewardType === 'card' && (msg.cardDetail?.name || 'Legendary Card')}
                      </span>
                    </div>

                    {msg.isClaimed ? (
                      <span className="px-4 py-2 bg-green-950/20 text-green-500 border border-green-500/20 text-[11px] font-bold rounded-full flex items-center gap-1 leading-none">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> KLAIMED
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleClaim(msg.id, e)}
                        className="px-5 py-2 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors text-[12px] cursor-pointer"
                      >
                        KLAIM
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Message Modal Detail */}
      <AnimatePresence>
        {activeMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col relative text-left"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button
                onClick={() => setActiveMessage(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <span className="text-[10px] font-black text-white/40">{new Date(activeMessage.createdAt).toLocaleString()}</span>
              <h3 className="text-xl font-black text-white mt-1.5 leading-tight pr-8">{activeMessage.title}</h3>

              <div className="border-t border-white/10 my-4" />

              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto">
                {activeMessage.body}
              </p>

              {/* Reward Box */}
              {activeMessage.rewardType !== 'none' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 my-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#d7b73b]/10 border border-[#d7b73b]/30 rounded-full flex items-center justify-center">
                      <Gift className="w-5 h-5 text-[#d7b73b]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white/40 uppercase">HADIAH LAMPIRAN</span>
                      <span className="text-[15px] font-bold text-white">
                        {activeMessage.rewardType === 'bp_points' && `${activeMessage.rewardAmount} GOC Battle Points`}
                        {activeMessage.rewardType === 'gacha_ticket' && `${activeMessage.rewardAmount} Tiket Gacha`}
                        {activeMessage.rewardType === 'card' && (activeMessage.cardDetail?.name || 'Exclusive Legendary Card')}
                      </span>
                    </div>
                  </div>

                  {activeMessage.isClaimed ? (
                    <span className="px-4 py-2 bg-green-950/20 text-green-500 border border-green-500/20 text-[11px] font-bold rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> KLAIMED
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        const ok = await claimReward(activeMessage.id);
                        if (ok) {
                          setActiveMessage({ ...activeMessage, isClaimed: true });
                          setSuccessClaim(true);
                          setTimeout(() => setSuccessClaim(false), 2500);
                        }
                      }}
                      className="px-6 py-2.5 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors text-xs cursor-pointer"
                    >
                      KLAIM
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setActiveMessage(null)}
                className="w-full py-3 bg-zinc-900 border border-white/10 text-white font-bold rounded-full transition-colors cursor-pointer text-sm mt-2"
              >
                TUTUP
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
