import React from 'react';
import { FolderPlus } from 'lucide-react';

interface BinderEmptyStateProps {
  onCreateClick: () => void;
}

export const BinderEmptyState: React.FC<BinderEmptyStateProps> = ({ onCreateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-700 rounded-xl bg-black/40 backdrop-blur-sm">
      <FolderPlus size={64} className="text-gray-500 mb-4" />
      <h3 className="text-2xl font-[800] text-white mb-2 tracking-tight">Belum Ada Binder</h3>
      <p className="text-gray-400 mb-6 max-w-md">
        Buat binder pertamamu untuk memamerkan koleksi kartu favorit. Kamu bisa membuat hingga 5 binder dengan warna berbeda!
      </p>
      <button
        onClick={onCreateClick}
        className="px-6 py-3 bg-white text-black font-[800] tracking-tight uppercase rounded-lg hover:bg-gray-200 transition-colors"
      >
        Buat Binder Pertama
      </button>
    </div>
  );
};
