import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';

interface BinderCardProps {
  id: string;
  name: string;
  colorHex: string;
  cardCount: number;
  rotation: number;
  onClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const BinderCard: React.FC<BinderCardProps> = ({
  id,
  name,
  colorHex,
  cardCount,
  rotation,
  onClick,
  onEdit,
  onDelete
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      initial={{ rotate: rotation }}
      className="relative group cursor-pointer"
      onClick={() => onClick(id)}
    >
      <div 
        className="bg-white rounded-xl shadow-xl overflow-hidden border-4 border-black"
        style={{ borderTopColor: colorHex, borderTopWidth: '12px' }}
      >
        <div className="p-6">
          <h3 className="text-2xl font-[800] text-black mb-2 uppercase tracking-tight line-clamp-2">
            {name}
          </h3>
          <p className="text-gray-600 font-[800] uppercase text-sm">
            {cardCount} / 24 KARTU
          </p>
        </div>
        
        {/* Action buttons show on hover for desktop, always visible on mobile */}
        <div className="absolute top-4 right-4 flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(id); }}
            className="p-2 bg-black text-white rounded-full hover:bg-gray-800"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
