const db = require('./config/database');

const migrateOnboarding = async () => {
  try {
    console.log('Starting DB migration for Onboarding...');

    // Rename 'name' to 'first_name'
    try {
      await db.query('ALTER TABLE users RENAME COLUMN name TO first_name');
      console.log('> Renamed name to first_name successfully.');
    } catch (err) {
      if (err.code === '42703') { 
        console.log('> Column name does not exist (already migrated).');
      } else {
        console.error('> Error renaming column:', err.message);
      }
    }

    // Add necessary columns
    const columnsToAdd = [
      'last_name TEXT',
      'activity_level TEXT',
      'target_weight NUMERIC'
    ];

    for (const col of columnsToAdd) {
      const colName = col.split(' ')[0];
      try {
        await db.query(`ALTER TABLE users ADD COLUMN ${col}`);
        console.log(`> Added column ${colName} successfully.`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`> Column ${colName} already exists.`);
        } else {
          console.error(`> Error adding column ${colName}:`, err.message);
        }
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrateOnboarding();
