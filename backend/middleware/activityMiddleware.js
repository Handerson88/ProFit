const db = require('../config/database');

/**
 * Middleware to track real-time user activity
 * Throttles database updates to once every 30 seconds per user
 */
const activityMiddleware = async (req, res, next) => {
    if (req.user && req.user.id) {
        try {
            // Check if we already updated activity recently in this request cycle or 
            // if we should check the DB for the last update time.
            // To keep it simple and fast, we'll just attempt a Conditional Update.
            
            // Logic: Update only if last_active_at is NULL or older than 30 seconds
            await db.query(`
                UPDATE users 
                SET last_active_at = NOW() 
                WHERE id = $1 
                AND (last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '30 seconds')
            `, [req.user.id]);
        } catch (err) {
            // Don't block the request if activity tracking fails
            console.error('[ActivityMiddleware] Error:', err);
        }
    }
    next();
};

module.exports = activityMiddleware;
