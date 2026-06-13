import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { BinderSlot as SlotType } from '../../store/binderStore';
import { BinderSlot } from './BinderSlot';

interface BinderSlotGridProps {
  binderId: string;
  slots: SlotType[];
  onReorder: (newSlots: SlotType[]) => void;
  onAddCard: (slotPosition: number) => void;
  onRemoveCard: (slotPosition: number) => void;
  currentPage: number;
  itemsPerPage: number;
}

export const BinderSlotGrid: React.FC<BinderSlotGridProps> = ({
  binderId,
  slots,
  onReorder,
  onAddCard,
  onRemoveCard,
  currentPage,
  itemsPerPage
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = slots.findIndex((s) => `slot-${s.slotPosition}` === active.id);
      const newIndex = slots.findIndex((s) => `slot-${s.slotPosition}` === over.id);

      // Reorder slots
      const newSlots = arrayMove(slots, oldIndex, newIndex);
      
      // Update slotPosition for all elements
      const reindexedSlots = newSlots.map((slot, index) => ({
        ...slot,
        slotPosition: index
      }));

      onReorder(reindexedSlots);
    }
  };

  // Pagination calculation
  const startIndex = currentPage * itemsPerPage;
  const visibleSlots = slots.slice(startIndex, startIndex + itemsPerPage);
  
  // Sortable item IDs (must match exactly with useSortable hook ids)
  const itemIds = visibleSlots.map((s) => `slot-${s.slotPosition}`);
  const activeSlot = activeId ? slots.find(s => `slot-${s.slotPosition}` === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {visibleSlots.map((slot) => (
            <BinderSlot
              key={`slot-${slot.slotPosition}`}
              id={`slot-${slot.slotPosition}`}
              slotPosition={slot.slotPosition}
              card={slot.card}
              onAddClick={onAddCard}
              onRemoveClick={onRemoveCard}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay for visual feedback during drag */}
      <DragOverlay>
        {activeSlot ? (
          <BinderSlot
            id="overlay"
            slotPosition={activeSlot.slotPosition}
            card={activeSlot.card}
            onAddClick={() => {}}
            onRemoveClick={() => {}}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
