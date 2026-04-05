const db = require('./config/database');
async function test() {
    try {
        const res = await db.query(
            "INSERT INTO coupons (code, discount_type, discount_value) VALUES ($1, $2, $3) RETURNING *",
            ['TEST_COUPON', 'percent', 10]
        );
        console.log('Success:', res.rows[0]);
    } catch (err) {
        console.error('Failure:', err);
    }
}
test();
