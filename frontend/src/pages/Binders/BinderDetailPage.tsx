import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBinderStore, type BinderSlot as SlotType } from '../../store/binderStore';
import { BinderSlotGrid } from '../../components/Binders/BinderSlotGrid';
import { BinderPagination } from '../../components/Binders/BinderPagination';
import { AddCardModal } from '../../components/Binders/AddCardModal';
import { ArrowLeft, Save } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { ALL_CARDS } from '../../data/cards';

export const BinderDetailPage: React.FC = () => {
  const { binderId } = useParams<{ binderId: string }>();
  const navigate = useNavigate();
  const { 
    currentBinder, 
    fetchBinderDetail, 
    reorderSlots,
    loading 
  } = useBinderStore();

  const [draftSlots, setDraftSlots] = useState<SlotType[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSlotPosition, setSelectedSlotPosition] = useState<number | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // For responsive pagination
  const [itemsPerPage, setItemsPerPage] = useState(24); // Desktop defaults to 24 (all)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (binderId) {
      fetchBinderDetail(binderId);
    }
  }, [binderId, fetchBinderDetail]);

  useEffect(() => {
    if (currentBinder) {
      setDraftSlots(currentBinder.slots);
      setIsDirty(false);
    }
  }, [currentBinder]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // mobile
        setItemsPerPage(12);
        setIsMobile(true);
      } else {
        setItemsPerPage(24);
        setIsMobile(false);
        setCurrentPage(0);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleReorder = (newSlots: SlotType[]) => {
    setDraftSlots(newSlots);
    setIsDirty(true);
  };

  const handleAddCardClick = (slotPosition?: number) => {
    setSelectedSlotPosition(slotPosition);
    setIsAddModalOpen(true);
  };

  const handleCardSelect = (cardId: string) => {
    const card = ALL_CARDS.find((c) => c.id === cardId);
    if (!card) return;

    // Check duplicates in draft
    const cardExists = draftSlots.some((s) => s.card?.name === card.name);
    if (cardExists) {
      setToast({ message: 'Kartu ini sudah ada di dalam binder', type: 'error' });
      return;
    }

    const newSlots = [...draftSlots];
    let targetPosition = selectedSlotPosition;

    if (targetPosition === undefined) {
      const emptyIndex = newSlots.findIndex((s) => s.card === null);
      if (emptyIndex === -1) {
        setToast({ message: 'Binder sudah penuh', type: 'error' });
        return;
      }
      targetPosition = emptyIndex;
    }

    newSlots[targetPosition] = {
      slotPosition: targetPosition,
      card,
    };

    setDraftSlots(newSlots);
    setIsDirty(true);
    setIsAddModalOpen(false);
    setToast({ message: 'Kartu berhasil ditambahkan ke draft!', type: 'success' });
  };

  const handleRemoveCardClick = (slotPosition: number) => {
    const newSlots = [...draftSlots];
    newSlots[slotPosition] = {
      slotPosition,
      card: null,
    };
    setDraftSlots(newSlots);
    setIsDirty(true);
    setToast({ message: 'Kartu dilepas dari slot!', type: 'success' });
  };

  const handleSaveBinder = async () => {
    if (!binderId || !currentBinder) return;
    setActionLoading(true);
    try {
      const payload = draftSlots
        .filter(s => s.card !== null)
        .map(s => ({ slotPosition: s.slotPosition, cardId: s.card!.id }));
      
      await reorderSlots(binderId, payload);
      setIsDirty(false);
      setToast({ message: 'Binder berhasil disimpan!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal menyimpan binder', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !currentBinder) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!currentBinder) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-[800] mb-4">Binder tidak ditemukan</h2>
        <button onClick={() => navigate('/binders')} className="px-6 py-2 bg-white text-black font-[800] rounded-lg">
          Kembali ke Binders
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(24 / itemsPerPage);
  const draftCardCount = draftSlots.filter(s => s.card !== null).length;

  return (
    <div className="min-h-screen bg-zinc-900 pt-32 md:pt-36 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-4 pb-6" style={{ borderBottomColor: currentBinder.colorHex }}>
          <div>
            <button 
              onClick={() => navigate('/binders')} 
              className="flex items-center text-white/60 hover:text-white mb-6 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit text-xs font-[800] uppercase tracking-wider"
            >
              <ArrowLeft size={16} className="mr-2" />
              Kembali
            </button>
            <h1 className="text-4xl md:text-5xl lg:text-[65px] font-[800] text-white uppercase tracking-tight leading-none mb-2">
              {currentBinder.name}
            </h1>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: currentBinder.colorHex }}></div>
              <span className="text-gray-400 font-[800] uppercase text-sm">{currentBinder.colorDisplay}</span>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0 flex flex-col items-start md:items-end w-full md:w-auto">
            <div className="text-3xl md:text-4xl font-[800] text-white mb-2 self-start md:self-auto">{draftCardCount} / 24</div>
            <div className="flex space-x-2 w-full md:w-auto">
              <button
                onClick={() => handleAddCardClick()}
                className="flex-1 md:flex-none px-4 py-2.5 md:px-6 md:py-3 bg-white text-black font-[800] uppercase tracking-tight rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base text-center"
              >
                TAMBAH KARTU
              </button>
              
              <button
                onClick={handleSaveBinder}
                disabled={actionLoading || !isDirty}
                className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3 font-[800] uppercase tracking-tight rounded-lg transition-colors border-2 text-sm md:text-base ${
                  isDirty 
                    ? 'bg-[#d7b73b] hover:bg-[#c5a630] border-[#d7b73b] text-black animate-pulse'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                }`}
              >
                <Save size={18} className="mr-2" />
                {actionLoading ? 'MENYIMPAN...' : 'SIMPAN'}
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 md:p-8 border border-gray-800">
          <BinderSlotGrid
            binderId={binderId!}
            slots={draftSlots}
            onReorder={handleReorder}
            onAddCard={handleAddCardClick}
            onRemoveCard={handleRemoveCardClick}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
          
          {isMobile && (
            <BinderPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelect={handleCardSelect}
        loading={actionLoading}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
