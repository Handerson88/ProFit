const db = require('./config/database');
console.log('Database config loaded');
db.query('SELECT NOW()').then(res => {
    console.log('Connection successful:', res.rows[0]);
    process.exit(0);
}).catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
});
