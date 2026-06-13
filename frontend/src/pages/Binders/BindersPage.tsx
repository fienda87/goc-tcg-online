import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBinderStore } from '../../store/binderStore';
import { BinderEmptyState } from '../../components/Binders/BinderEmptyState';
import { BinderCard } from '../../components/Binders/BinderCard';
import { CreateBinderModal } from '../../components/Binders/CreateBinderModal';
import { DeleteBinderConfirm } from '../../components/Binders/DeleteBinderConfirm';
import { Plus } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';

export const BindersPage: React.FC = () => {
  const navigate = useNavigate();
  const { binders, fetchBinders, createBinder, updateBinder, deleteBinder, loading, error } = useBinderStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editData, setEditData] = useState<{ id: string, name: string, colorId: string } | null>(null);
  
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchBinders();
  }, [fetchBinders]);

  const handleCreateSubmit = async (name: string, colorId: string) => {
    setActionLoading(true);
    try {
      if (editData) {
        await updateBinder(editData.id, name, colorId);
        setToast({ message: 'Binder berhasil diperbarui!', type: 'success' });
      } else {
        await createBinder(name, colorId);
        setToast({ message: 'Binder berhasil dibuat!', type: 'success' });
      }
      setIsCreateModalOpen(false);
      setEditData(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal menyimpan binder', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteData) return;
    setActionLoading(true);
    try {
      await deleteBinder(deleteData.id);
      setToast({ message: 'Binder berhasil dihapus!', type: 'success' });
      setDeleteData(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal menghapus binder', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (id: string) => {
    const binder = binders.find(b => b.id === id);
    if (binder) {
      setEditData({ id: binder.id, name: binder.name, colorId: binder.colorId });
      setIsCreateModalOpen(true);
    }
  };

  const openDeleteModal = (id: string) => {
    const binder = binders.find(b => b.id === id);
    if (binder) {
      setDeleteData({ id: binder.id, name: binder.name });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 pt-32 md:pt-36 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-[55px] font-[800] text-white uppercase tracking-tight mb-8">
          BINDER KU
        </h1>

        {loading && binders.length === 0 ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : binders.length === 0 ? (
          <BinderEmptyState onCreateClick={() => {
            setEditData(null);
            setIsCreateModalOpen(true);
          }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {binders.map((binder, i) => (
              <BinderCard
                key={binder.id}
                id={binder.id}
                name={binder.name}
                colorHex={binder.colorHex}
                cardCount={binder.cardCount}
                rotation={i % 2 === 0 ? 3 : -3}
                onClick={(id) => navigate(`/binders/${id}`)}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        )}

        {/* FAB for mobile / fixed positioning */}
        {binders.length > 0 && binders.length < 5 && (
          <button
            onClick={() => {
              setEditData(null);
              setIsCreateModalOpen(true);
            }}
            className="fixed bottom-8 right-8 flex items-center justify-center p-4 bg-white text-black rounded-full shadow-2xl hover:bg-gray-200 transition-transform hover:scale-110 z-40"
          >
            <Plus size={32} />
          </button>
        )}
      </div>

      <CreateBinderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditData(null);
        }}
        onSubmit={handleCreateSubmit}
        initialData={editData}
        loading={actionLoading}
      />

      <DeleteBinderConfirm
        isOpen={!!deleteData}
        binderName={deleteData?.name || ''}
        onClose={() => setDeleteData(null)}
        onConfirm={handleDeleteConfirm}
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
