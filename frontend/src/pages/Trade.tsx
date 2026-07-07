import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Plus, Check, X, ArrowLeftRight, User, Trash2, Clock, History, AlertCircle } from 'lucide-react';
import { useTradeStore, type Friend } from '../store/tradeStore';
import { useUserStore } from '../store/userStore';
import { useCollectionStore } from '../store/collectionStore';
import { RARITY_COLORS } from '../data/cards';

export const Trade: React.FC = () => {
  const navigate = useNavigate();
  
  // Stores
  const { user } = useUserStore();
  const myCollection = useCollectionStore((s) => s.cards);
  
  const {
    friends,
    trades,
    friendCode,
    loading,
    error,
    fetchFriendCode,
    fetchFriends,
    sendFriendRequest,
    respondFriendRequest,
    removeFriend,
    fetchTrades,
    createTradeOffer,
    acceptTradeOffer,
    declineTradeOffer,
    cancelTradeOffer,
    fetchFriendCollection,
  } = useTradeStore();

  // Local state
  const [activeTab, setActiveTab] = useState<'friends' | 'trades' | 'history'>('friends');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Trade Builder state
  const [selectedFriendForTrade, setSelectedFriendForTrade] = useState<Friend | null>(null);
  const [friendCollection, setFriendCollection] = useState<any[]>([]);
  const [loadingFriendCollection, setLoadingFriendCollection] = useState(false);
  const [senderSelectedCards, setSenderSelectedCards] = useState<any[]>([]); // my cards offered
  const [receiverSelectedCards, setReceiverSelectedCards] = useState<any[]>([]); // friend's cards requested

  // Initialize
  useEffect(() => {
    if (user) {
      fetchFriendCode();
      fetchFriends();
      fetchTrades();
    }
  }, [user]);

  // Clear messages automatically
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const handleCopyCode = () => {
    if (friendCode) {
      navigator.clipboard.writeText(friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await sendFriendRequest(friendCodeInput);
      setSuccessMessage('Permintaan pertemanan berhasil dikirim!');
      setFriendCodeInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim permintaan pertemanan');
    }
  };

  // Open Trade Builder
  const handleOpenTradeBuilder = async (friend: Friend) => {
    setSelectedFriendForTrade(friend);
    setLoadingFriendCollection(true);
    setSenderSelectedCards([]);
    setReceiverSelectedCards([]);
    try {
      const collection = await fetchFriendCollection(friend.friendProfileId);
      setFriendCollection(collection);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFriendCollection(false);
    }
  };

  const handleCloseTradeBuilder = () => {
    setSelectedFriendForTrade(null);
    setFriendCollection([]);
    setSenderSelectedCards([]);
    setReceiverSelectedCards([]);
  };

  // Toggle card selection in Trade Builder
  const toggleMyCardSelection = (card: any) => {
    if (senderSelectedCards.some(c => c.id === card.id)) {
      setSenderSelectedCards(senderSelectedCards.filter(c => c.id !== card.id));
    } else {
      if (senderSelectedCards.length >= 3) {
        setErrorMessage('Maksimal bertukar 3 kartu sekaligus!');
        return;
      }
      setSenderSelectedCards([...senderSelectedCards, card]);
    }
  };

  const toggleFriendCardSelection = (card: any) => {
    if (receiverSelectedCards.some(c => c.id === card.id)) {
      setReceiverSelectedCards(receiverSelectedCards.filter(c => c.id !== card.id));
    } else {
      if (receiverSelectedCards.length >= 3) {
        setErrorMessage('Maksimal meminta 3 kartu sekaligus!');
        return;
      }
      setReceiverSelectedCards([...receiverSelectedCards, card]);
    }
  };

  const handleSubmitTrade = async () => {
    if (!selectedFriendForTrade) return;
    if (senderSelectedCards.length === 0 && receiverSelectedCards.length === 0) {
      setErrorMessage('Kamu harus memilih minimal 1 kartu untuk ditawarkan atau diminta!');
      return;
    }
    setErrorMessage(null);
    try {
      const senderIds = senderSelectedCards.map(c => c.id);
      const receiverIds = receiverSelectedCards.map(c => c.id);
      await createTradeOffer(selectedFriendForTrade.friendProfileId, senderIds, receiverIds);
      setSuccessMessage('Penawaran trade berhasil dikirim!');
      handleCloseTradeBuilder();
      setActiveTab('trades');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim penawaran trade');
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const ok = await acceptTradeOffer(tradeId);
      if (ok) {
        setSuccessMessage('Trade sukses! Kartu berhasil ditukar.');
      } else {
        setErrorMessage('Trade gagal! Kartu yang ditawarkan sudah tidak tersedia lagi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses trade');
    }
  };

  if (!user) {
    // Unauthenticated Teaser Screen
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-32 md:pt-36 pb-12 bg-zinc-950 text-white">
        <motion.div
          className="w-full max-w-[500px] bg-zinc-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md text-center shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-[#d7b73b]/10 border border-[#d7b73b]/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeftRight className="w-10 h-10 text-[#d7b73b]" />
          </div>
          <h1 className="text-[32px] font-black leading-none tracking-tight mb-3">GOC TRADE CENTER.</h1>
          <p className="text-[15px] text-white/60 mb-8 leading-relaxed">
            Punya banyak kartu duplikat? Tukarkan kartu klon milikmu dengan kartu incaran yang belum kamu miliki dengan fitur Pertukaran Kartu antar Pemain!
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-[13px] text-[#d7b73b] font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            Fitur pertemanan dan trade membutuhkan akun cloud Supabase.
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 py-3.5 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors cursor-pointer text-[15px]"
            >
              MASUK AKUN
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-full transition-colors border border-white/10 cursor-pointer text-[15px]"
            >
              DAFTAR SEKARANG
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Separate friends list
  const activeFriends = friends.filter(f => f.status === 'accepted');
  const pendingRequests = friends.filter(f => f.status === 'pending');

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-12 pt-32 md:pt-36 pb-20 max-w-[1200px] mx-auto text-white">
      
      {/* Messages */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 border border-red-600 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md font-bold text-[14px] flex items-center gap-2"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-2 hover:opacity-80"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 border border-green-600 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md font-bold text-[14px] flex items-center gap-2"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            <span>✅ {successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:opacity-80"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trade Builder View */}
      <AnimatePresence>
        {selectedFriendForTrade && (
          <motion.div
            className="fixed inset-0 z-40 bg-zinc-950 flex flex-col pt-24 pb-6 px-4 md:px-12 overflow-y-auto"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            {/* Trade Builder Header */}
            <div className="flex justify-between items-center mb-6 max-w-[1200px] w-full mx-auto">
              <div>
                <span className="text-[12px] font-black text-[#d7b73b] tracking-wider uppercase">TRADE BUILDER</span>
                <h2 className="text-[32px] md:text-[42px] font-black leading-none m-0 mt-1">
                  TRADE DENGAN {selectedFriendForTrade.username.toUpperCase()}
                </h2>
              </div>
              <button
                onClick={handleCloseTradeBuilder}
                className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trays of selected cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1200px] w-full mx-auto mb-8">
              {/* My Offered Cards */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
                <span className="text-[12px] font-black text-white/50 mb-3 block">KARTU YANG ANDA TAWARKAN (Maks 3)</span>
                <div className="flex gap-4 items-center flex-1 min-h-[120px] bg-black/20 border border-white/5 rounded-xl p-3">
                  {senderSelectedCards.length === 0 ? (
                    <span className="text-sm text-white/30 italic mx-auto">Pilih kartu dari koleksi Anda di bawah</span>
                  ) : (
                    senderSelectedCards.map(card => (
                      <div key={card.id} className="relative group">
                        <div className="w-[70px] h-[100px] bg-zinc-800 rounded-lg overflow-hidden border border-white/10 flex flex-col justify-between p-1.5 text-left">
                          <span className="text-[8px] font-black" style={{ color: (RARITY_COLORS as any)[card.rarity] || '#fff' }}>
                            {card.rarity.substring(0, 4)}
                          </span>
                          <span className="text-[9px] font-extrabold truncate text-white leading-tight">{card.name}</span>
                        </div>
                        <button
                          onClick={() => toggleMyCardSelection(card)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center border border-black cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Requested Cards */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
                <span className="text-[12px] font-black text-white/50 mb-3 block">KARTU TEMAN YANG ANDA MINTA (Maks 3)</span>
                <div className="flex gap-4 items-center flex-1 min-h-[120px] bg-black/20 border border-white/5 rounded-xl p-3">
                  {receiverSelectedCards.length === 0 ? (
                    <span className="text-sm text-white/30 italic mx-auto">Pilih kartu milik teman di bawah</span>
                  ) : (
                    receiverSelectedCards.map(card => (
                      <div key={card.id} className="relative group">
                        <div className="w-[70px] h-[100px] bg-zinc-800 rounded-lg overflow-hidden border border-white/10 flex flex-col justify-between p-1.5 text-left">
                          <span className="text-[8px] font-black" style={{ color: (RARITY_COLORS as any)[card.rarity] || '#fff' }}>
                            {card.rarity.substring(0, 4)}
                          </span>
                          <span className="text-[9px] font-extrabold truncate text-white leading-tight">{card.name}</span>
                        </div>
                        <button
                          onClick={() => toggleFriendCardSelection(card)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center border border-black cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Split screen selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1200px] w-full mx-auto flex-1 overflow-y-auto mb-6 pr-2">
              {/* My Collection Selector */}
              <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl p-6 h-[400px]">
                <h3 className="text-lg font-black mb-3">Koleksi Kartu Anda</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1">
                  {myCollection.length === 0 ? (
                    <span className="text-sm text-white/40 col-span-full">Koleksi kartu kosong</span>
                  ) : (
                    myCollection.map((card) => {
                      const isSelected = senderSelectedCards.some(c => c.id === card.id);
                      return (
                        <div
                          key={card.id}
                          onClick={() => toggleMyCardSelection(card)}
                          className={`relative cursor-pointer rounded-xl border p-2 flex flex-col justify-between h-[120px] transition-all select-none ${
                            isSelected
                              ? 'border-[#d7b73b] bg-[#d7b73b]/10 shadow-[0_0_12px_rgba(215,183,59,0.3)]'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase" style={{ color: (RARITY_COLORS as any)[card.rarity] || '#fff' }}>
                            {card.rarity.split(' ')[0]}
                          </span>
                          <span className="text-[11px] font-bold leading-tight mt-2 truncate text-white">{card.name}</span>
                          <span className="text-[10px] text-white/50 text-right mt-1">Vol {card.volume || 1}</span>
                          
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-[#d7b73b] rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-black stroke-[4]" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Friend's Collection Selector */}
              <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl p-6 h-[400px]">
                <h3 className="text-lg font-black mb-3">Koleksi Kartu {selectedFriendForTrade.username}</h3>
                {loadingFriendCollection ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-white/10 border-t-[#d7b73b] rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1">
                    {friendCollection.length === 0 ? (
                      <span className="text-sm text-white/40 col-span-full">Teman belum mengumpulkan kartu</span>
                    ) : (
                      friendCollection.map((card) => {
                        const isSelected = receiverSelectedCards.some(c => c.id === card.id);
                        return (
                          <div
                            key={card.id}
                            onClick={() => toggleFriendCardSelection(card)}
                            className={`relative cursor-pointer rounded-xl border p-2 flex flex-col justify-between h-[120px] transition-all select-none ${
                              isSelected
                                ? 'border-[#d7b73b] bg-[#d7b73b]/10 shadow-[0_0_12px_rgba(215,183,59,0.3)]'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase" style={{ color: (RARITY_COLORS as any)[card.rarity] || '#fff' }}>
                              {card.rarity.split(' ')[0]}
                            </span>
                            <span className="text-[11px] font-bold leading-tight mt-2 truncate text-white">{card.name}</span>
                            <span className="text-[10px] text-white/50 text-right mt-1">Vol {card.volume || 1}</span>

                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-[#d7b73b] rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-black stroke-[4]" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="max-w-[1200px] w-full mx-auto flex gap-4 pt-4 border-t border-white/10">
              <button
                onClick={handleCloseTradeBuilder}
                className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-full transition-colors border border-white/10 cursor-pointer text-sm"
              >
                KEMBALI
              </button>
              <button
                onClick={handleSubmitTrade}
                className="flex-1 py-3.5 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors cursor-pointer text-sm shadow-xl"
              >
                AJUKAN PENAWARAN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-[45px] md:text-[55px] text-white leading-none font-black m-0">TRADE CENTER.</h1>
          <p className="text-[16px] md:text-[18px] font-bold text-white/50 m-0 mt-2">
            Tukarkan kartu klonmu dengan kartu pemain lain.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10 gap-2 mb-8 select-none">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-6 py-3 font-extrabold text-[15px] border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'friends' ? 'border-[#d7b73b] text-white' : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          <User className="w-4 h-4" /> Teman & Permintaan
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`px-6 py-3 font-extrabold text-[15px] border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'trades' ? 'border-[#d7b73b] text-white' : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          <Clock className="w-4 h-4" /> Trade Aktif
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-extrabold text-[15px] border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history' ? 'border-[#d7b73b] text-white' : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          <History className="w-4 h-4" /> Riwayat
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Friend */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit backdrop-blur-md">
            <h3 className="text-xl font-black mb-3">Tambah Teman</h3>
            <p className="text-sm text-white/50 mb-6">Masukkan Kode Teman pemain lain untuk mengirim permintaan.</p>
            <form onSubmit={handleAddFriend} className="flex gap-3 mb-6">
              <input
                type="text"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                placeholder="Contoh: GOC-3F9D2A"
                className="flex-1 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-white font-semibold outline-none focus:border-[#d7b73b] transition-colors"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#d7b73b] text-black hover:bg-[#c0a232] font-black rounded-full transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> TAMBAH
              </button>
            </form>

            {/* Display Own Friend Code Here */}
            {friendCode && (
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-white/40 leading-none">KODE TEMAN ANDA</span>
                  <span className="text-[18px] font-black text-[#d7b73b] mt-1.5 tracking-wider">{friendCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-4 py-2 text-xs font-black rounded-full border cursor-pointer flex items-center gap-1.5 transition-all ${
                    copied
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> TERSALIN
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> SALIN KODE
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Friends list */}
          <div className="flex flex-col gap-6">
            {/* Incoming Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-black mb-4 text-[#d7b73b] flex items-center gap-2">
                  <span>📩</span> Permintaan Masuk
                </h3>
                <div className="flex flex-col gap-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between bg-black/20 border border-white/5 px-4 py-3 rounded-xl">
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-[15px]">{req.username}</span>
                        <span className="text-[11px] text-white/40 mt-0.5">{req.friendCode}</span>
                      </div>
                      
                      {!req.isSender ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondFriendRequest(req.id, true)}
                            className="w-9 h-9 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                            title="Terima Teman"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => respondFriendRequest(req.id, false)}
                            className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                            title="Tolak"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-white/30 italic">Menunggu persetujuan...</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Friends */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-xl font-black mb-4">Daftar Teman</h3>
              {activeFriends.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl">👥</span>
                  <p className="text-sm text-white/40 mt-3 m-0">Belum ada teman terdaftar</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between bg-black/25 border border-white/5 px-5 py-4 rounded-xl">
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-[16px] text-white">{friend.username}</span>
                        <span className="text-[11px] text-[#d7b73b] mt-0.5">{friend.friendCode}</span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleOpenTradeBuilder(friend)}
                          className="px-4 py-2 bg-[#d7b73b] hover:bg-[#c0a232] text-black font-extrabold rounded-full transition-colors text-[13px] cursor-pointer"
                        >
                          PROPOSE TRADE
                        </button>
                        <button
                          onClick={() => removeFriend(friend.id)}
                          className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer flex items-center justify-center"
                          title="Hapus Teman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Trades Tab */}
      {activeTab === 'trades' && (
        <div className="flex flex-col gap-6">
          {trades.filter(t => t.status === 'pending').length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
              <span className="text-4xl">🃏</span>
              <p className="text-sm text-white/40 mt-3 m-0">Tidak ada trade aktif saat ini</p>
            </div>
          ) : (
            trades.filter(t => t.status === 'pending').map((trade) => {
              const isReceiver = trade.receiverId === user.id;
              const myOffered = trade.items.filter(item => item.userId === user.id);
              const friendOffered = trade.items.filter(item => item.userId !== user.id);

              return (
                <div key={trade.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 text-[10px] font-black rounded uppercase">
                        PENDING OFFER
                      </span>
                      <span className="text-sm text-white/50">
                        {isReceiver ? `Dari ${trade.senderName}` : `Kepada ${trade.receiverName}`}
                      </span>
                    </div>

                    {/* Swap displays */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 rounded-xl p-4">
                      {/* Left: What you give */}
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-black text-white/40 mb-2">ANDA MEMBERIKAN:</span>
                        <div className="flex flex-wrap gap-2">
                          {myOffered.length === 0 ? (
                            <span className="text-[12px] text-white/40">Tidak ada kartu</span>
                          ) : (
                            myOffered.map(item => (
                              <div key={item.id} className="w-[60px] h-[85px] bg-zinc-800 rounded border border-white/5 flex flex-col justify-between p-1">
                                <span className="text-[7px] font-black truncate" style={{ color: (RARITY_COLORS as any)[item.card.rarity] }}>
                                  {item.card.rarity.split(' ')[0]}
                                </span>
                                <span className="text-[9px] font-bold truncate text-white leading-tight">{item.card.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: What you receive */}
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-black text-[#d7b73b] mb-2">ANDA MENERIMA:</span>
                        <div className="flex flex-wrap gap-2">
                          {friendOffered.length === 0 ? (
                            <span className="text-[12px] text-white/40">Tidak ada kartu</span>
                          ) : (
                            friendOffered.map(item => (
                              <div key={item.id} className="w-[60px] h-[85px] bg-zinc-800 rounded border border-white/5 flex flex-col justify-between p-1">
                                <span className="text-[7px] font-black truncate" style={{ color: (RARITY_COLORS as any)[item.card.rarity] }}>
                                  {item.card.rarity.split(' ')[0]}
                                </span>
                                <span className="text-[9px] font-bold truncate text-white leading-tight">{item.card.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col justify-end items-center gap-3">
                    {isReceiver ? (
                      <>
                        <button
                          onClick={() => handleAcceptTrade(trade.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-full transition-colors cursor-pointer text-xs shadow-lg"
                        >
                          <Check className="w-4 h-4" /> TERIMA
                        </button>
                        <button
                          onClick={() => declineTradeOffer(trade.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-full transition-colors cursor-pointer text-xs shadow-lg"
                        >
                          <X className="w-4 h-4" /> TOLAK
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => cancelTradeOffer(trade.id)}
                        className="px-5 py-2.5 border border-red-500 text-red-500 hover:bg-red-500/10 font-extrabold rounded-full transition-colors cursor-pointer text-xs"
                      >
                        BATALKAN
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Trade History Tab */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4">
          {trades.filter(t => t.status !== 'pending').length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
              <span className="text-4xl">⏳</span>
              <p className="text-sm text-white/40 mt-3 m-0">Belum ada riwayat pertukaran</p>
            </div>
          ) : (
            trades.filter(t => t.status !== 'pending').map((trade) => {
              const myOffered = trade.items.filter(item => item.userId === user.id);
              const friendOffered = trade.items.filter(item => item.userId !== user.id);
              const statusColors = {
                accepted: 'bg-green-600/20 text-green-500 border border-green-500/30',
                declined: 'bg-red-600/20 text-red-500 border border-red-500/30',
                cancelled: 'bg-zinc-600/20 text-zinc-400 border border-zinc-500/30',
                pending: 'bg-zinc-600/20 text-zinc-400 border border-zinc-500/30',
              };

              return (
                <div key={trade.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur-md">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase ${statusColors[trade.status]}`}>
                        {trade.status}
                      </span>
                      <span className="text-xs text-white/40">{new Date(trade.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm text-white/60">
                      Tukar dengan <strong className="text-white">{trade.senderId === user.id ? trade.receiverName : trade.senderName}</strong>
                    </span>
                    
                    {/* Item count */}
                    <span className="text-[11px] text-white/40">
                      Item: {myOffered.length} diberikan, {friendOffered.length} diterima.
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* Tiny thumbnail summaries */}
                    <div className="flex -space-x-2">
                      {trade.items.slice(0, 3).map((item, i) => (
                        <div
                          key={item.id}
                          className="w-7 h-9 rounded border border-black bg-zinc-800 flex items-center justify-center text-[7px] font-black shadow-lg"
                          style={{ borderColor: (RARITY_COLORS as any)[item.card.rarity] || '#fff', zIndex: 10 - i }}
                          title={item.card.name}
                        >
                          {item.card.name.substring(0, 2)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
