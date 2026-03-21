const db = require('../config/database');

exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT theme_mode FROM user_preferences WHERE user_id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.json({ theme_mode: 'auto' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching preferences:', err);
        res.status(500).json({ message: 'Erro ao buscar preferências' });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { theme_mode } = req.body;

        if (!['light', 'dark', 'auto'].includes(theme_mode)) {
            return res.status(400).json({ message: 'Modo de tema inválido' });
        }

        const result = await db.query(`
            INSERT INTO user_preferences (user_id, theme_mode)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET theme_mode = EXCLUDED.theme_mode, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [userId, theme_mode]);

        res.json({ message: 'Preferência salva com sucesso', preference: result.rows[0] });
    } catch (err) {
        console.error('Error updating preferences:', err);
        res.status(500).json({ message: 'Erro ao salvar preferências' });
    }
};
