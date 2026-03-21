const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function sync() {
  console.log('Syncing existing meals to scanned_dishes...');
  
  try {
    // 1. Get all meals with images that are not yet in scanned_dishes
    const result = await pool.query(`
      SELECT m.* 
      FROM meals m
      WHERE m.image_url IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM scanned_dishes sd 
        WHERE sd.image_url = m.image_url 
        AND sd.user_id = m.user_id
        AND sd.created_at = m.created_at
      )
    `);

    console.log(`Found ${result.rows.length} meals to sync.`);

    for (const meal of result.rows) {
      await pool.query(
        `INSERT INTO scanned_dishes (id, user_id, dish_name, image_url, calories, protein, carbs, fat, scan_source, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuidv4(), 
          meal.user_id, 
          meal.food_name || meal.meal_name || 'Prato Escaneado', 
          meal.image_url, 
          meal.calories || 0, 
          meal.protein || 0, 
          meal.carbs || 0, 
          meal.fat || 0,
          'legacy_meal',
          meal.created_at
        ]
      );
    }

    console.log('Sync completed successfully.');
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    process.exit(0);
  }
}

sync();
