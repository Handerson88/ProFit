const jwt = require('jsonwebtoken');
const db = require('../config/database');

const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if the user exists in the users table and has admin role
        const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        
        if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'Acesso restrito. Somente administradores.' });
        }

        req.admin = result.rows[0];
        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

module.exports = adminMiddleware;
