import { pool } from './src/db/pool';

async function runMigration() {
  try {
    console.log('Running migration for Binders...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS binders (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        color_id VARCHAR(20) NOT NULL,
        color_hex VARCHAR(7) NOT NULL,
        color_display VARCHAR(50),
        description TEXT,
        card_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_binder_per_user (user_id, name),
        INDEX idx_user_id (user_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS binder_slots (
        id VARCHAR(36) PRIMARY KEY,
        binder_id VARCHAR(36) NOT NULL,
        card_id VARCHAR(36) NOT NULL,
        slot_position INT NOT NULL CHECK (slot_position >= 0 AND slot_position < 24),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (binder_id) REFERENCES binders(id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
        UNIQUE KEY unique_card_per_binder (binder_id, card_id),
        UNIQUE KEY unique_slot_per_binder (binder_id, slot_position),
        INDEX idx_binder_id (binder_id),
        INDEX idx_card_id (card_id)
      )
    `);

    console.log('Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
