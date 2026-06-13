import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';

// Preset colors validation
const BINDER_COLORS = [
  'red', 'violet', 'gold', 'cobalt', 'sky', 'mint', 
  'pink', 'orange', 'black', 'white', 'yellow', 'lavender'
];

const COLOR_MAP: Record<string, { hex: string, display: string }> = {
  'red': { hex: '#fe2f2f', display: 'Merah Energik' },
  'violet': { hex: '#7333f1', display: 'Ungu Misterius' },
  'gold': { hex: '#d7b73b', display: 'Emas Premium' },
  'cobalt': { hex: '#1b5bff', display: 'Biru Gelap' },
  'sky': { hex: '#a0e9ff', display: 'Biru Langit' },
  'mint': { hex: '#b4ff91', display: 'Hijau Mint' },
  'pink': { hex: '#ffa0f0', display: 'Pink Cemara' },
  'orange': { hex: '#ff9559', display: 'Orange Hangat' },
  'black': { hex: '#1a1a1a', display: 'Hitam Elegan' },
  'white': { hex: '#f5f5f5', display: 'Putih Bersih' },
  'yellow': { hex: '#fffe5b', display: 'Kuning Cerah' },
  'lavender': { hex: '#ede5ff', display: 'Lavender Lembut' }
};

export const createBinder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { name, colorId } = req.body;

    if (!name || name.length < 3 || name.length > 50) {
      res.status(400).json({ error: 'Name must be between 3 and 50 characters' });
      return;
    }

    if (!BINDER_COLORS.includes(colorId)) {
      res.status(400).json({ error: 'Invalid color preset' });
      return;
    }

    // Check max binders
    const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM binders WHERE user_id = ?', [userId]);
    if (countRows[0].count >= 5) {
      res.status(409).json({ error: 'Maximum 5 binders allowed per user' });
      return;
    }

    const id = uuidv4();
    const colorHex = COLOR_MAP[colorId].hex;
    const colorDisplay = COLOR_MAP[colorId].display;

    await pool.query(
      'INSERT INTO binders (id, user_id, name, color_id, color_hex, color_display) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, name, colorId, colorHex, colorDisplay]
    );

    res.status(201).json({
      id,
      name,
      colorId,
      colorHex,
      colorDisplay,
      cardCount: 0,
      createdAt: new Date().toISOString()
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'A binder with this name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getBinders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const [rows]: any = await pool.query(
      'SELECT id, name, color_id as colorId, color_hex as colorHex, color_display as colorDisplay, card_count as cardCount, updated_at as updatedAt FROM binders WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBinderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { binderId } = req.params;

    const [binderRows]: any = await pool.query(
      'SELECT id, name, color_id as colorId, color_hex as colorHex, color_display as colorDisplay, card_count as cardCount FROM binders WHERE id = ? AND user_id = ?',
      [binderId, userId]
    );

    if (binderRows.length === 0) {
      res.status(404).json({ error: 'Binder not found' });
      return;
    }

    const binder = binderRows[0];

    const [slotRows]: any = await pool.query(
      `SELECT bs.slot_position as slotPosition, c.id, c.name, c.image_url as imageUrl, c.stage, c.element 
       FROM binder_slots bs 
       JOIN cards c ON bs.card_id = c.id 
       WHERE bs.binder_id = ? 
       ORDER BY bs.slot_position ASC`,
      [binderId]
    );

    // Create 24 slots array
    const slots = Array.from({ length: 24 }, (_, i) => {
      const found = slotRows.find((r: any) => r.slotPosition === i);
      if (found) {
        return {
          slotPosition: i,
          card: {
            id: found.id,
            name: found.name,
            imageUrl: found.imageUrl,
            stage: found.stage,
            element: found.element
          }
        };
      }
      return { slotPosition: i, card: null };
    });

    res.json({ ...binder, slots });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBinder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { binderId } = req.params;
    const { name, colorId } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      if (name.length < 3 || name.length > 50) {
        res.status(400).json({ error: 'Name must be between 3 and 50 characters' });
        return;
      }
      updates.push('name = ?');
      values.push(name);
    }

    if (colorId) {
      if (!BINDER_COLORS.includes(colorId)) {
        res.status(400).json({ error: 'Invalid color preset' });
        return;
      }
      updates.push('color_id = ?', 'color_hex = ?', 'color_display = ?');
      values.push(colorId, COLOR_MAP[colorId].hex, COLOR_MAP[colorId].display);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(binderId, userId);

    const query = `UPDATE binders SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    const [result]: any = await pool.query(query, values);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Binder not found' });
      return;
    }

    const [updated]: any = await pool.query(
      'SELECT id, name, color_id as colorId, color_hex as colorHex, color_display as colorDisplay, card_count as cardCount FROM binders WHERE id = ?',
      [binderId]
    );

    res.json(updated[0]);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'A binder with this name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteBinder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { binderId } = req.params;

    const [result]: any = await pool.query('DELETE FROM binders WHERE id = ? AND user_id = ?', [binderId, userId]);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Binder not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addCardToBinder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { binderId } = req.params;
    const { cardId, slotPosition } = req.body;

    // Check binder exists & user owns it
    const [binderRows]: any = await pool.query('SELECT card_count FROM binders WHERE id = ? AND user_id = ?', [binderId, userId]);
    if (binderRows.length === 0) {
      res.status(404).json({ error: 'Binder not found' });
      return;
    }

    if (binderRows[0].card_count >= 24) {
      res.status(409).json({ error: 'Binder is full' });
      return;
    }

    // Verify card ownership in inventory
    const [invRows]: any = await pool.query('SELECT quantity FROM inventories WHERE user_id = ? AND card_id = ?', [userId, cardId]);
    if (invRows.length === 0 || invRows[0].quantity < 1) {
      res.status(403).json({ error: 'You do not own this card' });
      return;
    }

    let finalSlot = slotPosition;
    if (finalSlot === undefined) {
      // Auto-fill first empty slot
      const [slots]: any = await pool.query('SELECT slot_position FROM binder_slots WHERE binder_id = ? ORDER BY slot_position ASC', [binderId]);
      const occupied = slots.map((s: any) => s.slot_position);
      for (let i = 0; i < 24; i++) {
        if (!occupied.includes(i)) {
          finalSlot = i;
          break;
        }
      }
    }

    if (finalSlot < 0 || finalSlot > 23) {
      res.status(400).json({ error: 'Invalid slot position' });
      return;
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO binder_slots (id, binder_id, card_id, slot_position) VALUES (?, ?, ?, ?)',
      [id, binderId, cardId, finalSlot]
    );

    await pool.query('UPDATE binders SET card_count = card_count + 1 WHERE id = ?', [binderId]);

    const [cardData]: any = await pool.query('SELECT id, name, image_url as imageUrl, stage, element FROM cards WHERE id = ?', [cardId]);

    res.status(201).json({
      slotPosition: finalSlot,
      card: cardData[0]
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Card already exists in this binder or slot is occupied' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const removeCardFromBinder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { binderId, slotPosition } = req.params;

    // Verify binder ownership
    const [binderRows]: any = await pool.query('SELECT id FROM binders WHERE id = ? AND user_id = ?', [binderId, userId]);
    if (binderRows.length === 0) {
      res.status(404).json({ error: 'Binder not found' });
      return;
    }

    const [result]: any = await pool.query(
      'DELETE FROM binder_slots WHERE binder_id = ? AND slot_position = ?',
      [binderId, parseInt(slotPosition)]
    );

    if (result.affectedRows > 0) {
      await pool.query('UPDATE binders SET card_count = card_count - 1 WHERE id = ?', [binderId]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reorderSlots = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const userId = (req as any).user.id;
    const { binderId } = req.params;
    const { slots } = req.body; // Array of { slotPosition, cardId }

    if (!Array.isArray(slots)) {
      res.status(400).json({ error: 'Slots must be an array' });
      return;
    }

    // Unique slot check
    const positions = slots.map(s => s.slotPosition);
    if (new Set(positions).size !== positions.length) {
      res.status(400).json({ error: 'Duplicate slot positions' });
      return;
    }

    await connection.beginTransaction();

    // Verify ownership
    const [binderRows]: any = await connection.query('SELECT id FROM binders WHERE id = ? AND user_id = ? FOR UPDATE', [binderId, userId]);
    if (binderRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Binder not found' });
      return;
    }

    // Verify card ownerships
    const cardIds = slots.map(s => s.cardId);
    if (cardIds.length > 0) {
      const [invRows]: any = await connection.query(
        'SELECT card_id FROM inventories WHERE user_id = ? AND card_id IN (?) AND quantity > 0',
        [userId, cardIds]
      );
      
      if (invRows.length !== cardIds.length) {
        await connection.rollback();
        res.status(403).json({ error: 'You do not own all these cards' });
        return;
      }
    }

    // Delete existing slots
    await connection.query('DELETE FROM binder_slots WHERE binder_id = ?', [binderId]);

    // Insert new slots
    if (slots.length > 0) {
      const values = slots.map(s => [uuidv4(), binderId, s.cardId, s.slotPosition]);
      await connection.query(
        'INSERT INTO binder_slots (id, binder_id, card_id, slot_position) VALUES ?',
        [values]
      );
    }

    // Update count
    await connection.query('UPDATE binders SET card_count = ? WHERE id = ?', [slots.length, binderId]);

    await connection.commit();
    res.json({ success: true });
  } catch (err: any) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
       res.status(409).json({ error: 'Duplicate cards detected' });
    } else {
       res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    connection.release();
  }
};
