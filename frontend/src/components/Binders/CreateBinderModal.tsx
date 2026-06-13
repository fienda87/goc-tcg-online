import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { BINDER_COLORS } from '../../constants/binderColors';

interface CreateBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, colorId: string) => void;
  initialData?: { name: string; colorId: string } | null;
  loading?: boolean;
}

export const CreateBinderModal: React.FC<CreateBinderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [colorId, setColorId] = useState(initialData?.colorId || BINDER_COLORS[0].id);
  const [error, setError] = useState('');

  // Reset form when opened with new data
  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setColorId(initialData?.colorId || BINDER_COLORS[0].id);
      setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3 || name.length > 50) {
      setError('Nama binder harus antara 3 - 50 karakter');
      return;
    }
    onSubmit(name, colorId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md p-6 bg-zinc-900 border-2 border-white rounded-xl shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>

          <h2 className="text-3xl font-[800] text-white uppercase tracking-tight mb-6">
            {initialData ? 'EDIT BINDER' : 'BUAT BINDER BARU'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-[800] uppercase text-gray-400 mb-2">
                Nama Binder
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cth: Kartu Legendku"
                className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white font-[800] focus:border-white focus:outline-none transition-colors"
                maxLength={50}
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div>
              <label className="block text-sm font-[800] uppercase text-gray-400 mb-2">
                Warna Tema
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {BINDER_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setColorId(color.id)}
                    className={`w-10 h-10 rounded-full flex-shrink-0 transition-all ${
                      colorId === color.id
                        ? 'ring-4 ring-white scale-110 shadow-lg'
                        : 'hover:scale-105 opacity-80 hover:opacity-100 border-2 border-transparent'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.display}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-white text-black text-lg font-[800] uppercase rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {loading ? 'MENYIMPAN...' : 'SIMPAN BINDER'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
