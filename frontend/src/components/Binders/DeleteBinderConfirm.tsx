import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface DeleteBinderConfirmProps {
  isOpen: boolean;
  binderName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteBinderConfirm: React.FC<DeleteBinderConfirmProps> = ({
  isOpen,
  binderName,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-sm p-6 bg-zinc-900 border-2 border-red-500 rounded-xl shadow-2xl text-center"
        >
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          
          <h2 className="text-2xl font-[800] text-white uppercase tracking-tight mb-2">
            HAPUS BINDER?
          </h2>
          
          <p className="text-gray-400 mb-6">
            Apakah kamu yakin ingin menghapus binder <span className="text-white font-bold">"{binderName}"</span>? Kartu di dalamnya akan kembali ke Koleksi. Tindakan ini tidak bisa dibatalkan.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-gray-800 text-white font-[800] uppercase rounded-lg hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-red-500 text-white font-[800] uppercase rounded-lg hover:bg-red-600 transition-colors"
            >
              {loading ? 'MENGHAPUS...' : 'HAPUS'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
