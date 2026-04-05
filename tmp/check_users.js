const db = require('../backend/config/database');
async function check() {
    try {
        const r = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'influencer')");
        console.log('---TOTAL_REAL_USERS_FOUND:' + r.rows[0].count + '---');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
