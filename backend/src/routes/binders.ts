import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createBinder,
  getBinders,
  getBinderById,
  updateBinder,
  deleteBinder,
  addCardToBinder,
  removeCardFromBinder,
  reorderSlots
} from '../controllers/bindersController';

const router = Router();

// All binder routes require authentication
router.use(authenticate);

// Core binder CRUD
router.post('/', createBinder);
router.get('/', getBinders);
router.get('/:binderId', getBinderById);
router.patch('/:binderId', updateBinder);
router.delete('/:binderId', deleteBinder);

// Slot operations
router.post('/:binderId/cards', addCardToBinder);
router.put('/:binderId/slots/reorder', reorderSlots); // Reorder must come before /:slotPosition
router.delete('/:binderId/slots/:slotPosition', removeCardFromBinder);

export default router;
