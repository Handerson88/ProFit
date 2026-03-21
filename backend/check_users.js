const db = require('./config/database');

async function checkUsers() {
    try {
        const result = await db.query('SELECT name, email, role FROM users LIMIT 10');
        console.log(JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUsers();
