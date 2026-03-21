const db = require('../config/database');

exports.getPreferences = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const result = await db.query('SELECT theme_mode FROM admin_preferences WHERE admin_id = $1', [adminId]);
        
        if (result.rows.length === 0) {
            return res.json({ theme_mode: 'light' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching admin preferences:', err);
        res.status(500).json({ message: 'Erro ao buscar preferências do administrador' });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { theme_mode } = req.body;

        if (!['light', 'dark', 'auto'].includes(theme_mode)) {
            return res.status(400).json({ message: 'Modo de tema inválido' });
        }

        const result = await db.query(`
            INSERT INTO admin_preferences (admin_id, theme_mode)
            VALUES ($1, $2)
            ON CONFLICT (admin_id)
            DO UPDATE SET theme_mode = EXCLUDED.theme_mode, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [adminId, theme_mode]);

        res.json({ message: 'Preferência do administrador salva com sucesso', preference: result.rows[0] });
    } catch (err) {
        console.error('Error updating admin preferences:', err);
        res.status(500).json({ message: 'Erro ao salvar preferências do administrador' });
    }
};
