const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Admin: Create a new coupon
 */
exports.createCoupon = async (req, res) => {
    try {
        const { code, discount_type, discount_value, influencer_id, max_uses, expires_at } = req.body;

        if (!code || !discount_type || discount_value === undefined) {
            return res.status(400).json({ message: 'Código, tipo e valor do desconto são obrigatórios.' });
        }

        let finalInfluencerId = null;

        // Flexible Influencer Lookup
        if (influencer_id && influencer_id.trim() !== '') {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            
            if (uuidRegex.test(influencer_id)) {
                finalInfluencerId = influencer_id;
            } else {
                // Try to find user by name or email
                console.log(`[Coupons] Searching for influencer by string: ${influencer_id}`);
                const userLookup = await db.query(
                    `SELECT id FROM users 
                     WHERE (name ILIKE $1 OR email ILIKE $1) 
                     AND (is_influencer = true OR role = 'admin')
                     LIMIT 1`,
                    [influencer_id.trim()]
                );

                if (userLookup.rows.length === 0) {
                    return res.status(404).json({ 
                        message: `Influenciador '${influencer_id}' não encontrado. Verifique o nome ou use o ID (UUID).` 
                    });
                }
                finalInfluencerId = userLookup.rows[0].id;
                console.log(`[Coupons] Found influencer ID: ${finalInfluencerId} for search: ${influencer_id}`);
            }
        }

        const result = await db.query(
            `INSERT INTO coupons (code, discount_type, discount_value, influencer_id, max_uses, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [code.toUpperCase(), discount_type, discount_value, finalInfluencerId, max_uses || null, expires_at || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Este código de cupom já existe.' });
        }
        console.error('Create Coupon Error:', error);
        res.status(500).json({ message: 'Erro ao criar cupom: ' + (error.message || 'Erro interno') });
    }
};

/**
 * Admin: List all coupons
 */
exports.listCoupons = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, u.name as influencer_name 
            FROM coupons c
            LEFT JOIN users u ON c.influencer_id = u.id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('List Coupons Error:', error);
        res.status(500).json({ message: 'Erro ao listar cupons.' });
    }
};

/**
 * Public: Validate a coupon at checkout
 * Strict: One-time use per user (first purchase)
 */
exports.validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code) {
            return res.status(400).json({ message: 'Código do cupom é obrigatório.' });
        }

        // 1. Check if user already used ANY coupon before
        const userResult = await db.query(
            `SELECT has_used_coupon FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length > 0 && userResult.rows[0].has_used_coupon) {
            return res.status(403).json({ 
                message: 'Este cupom não é mais válido para sua conta. Você já utilizou um benefício promocional anteriormente.' 
            });
        }

        // 2. Check if the coupon exists and is active
        const result = await db.query(
            `SELECT * FROM coupons WHERE code = $1 AND active = true`,
            [code.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cupom inválido ou inativo.' });
        }

        const coupon = result.rows[0];

        // 3. Check expiration
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Este cupom expirou.' });
        }

        // 4. Check max uses (global limit for this specific coupon)
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return res.status(400).json({ message: 'Este cupom atingiu o limite de usos.' });
        }

        // 5. Check if THIS user already used THIS specific coupon (extra safety)
        const usageCheck = await db.query(
            `SELECT * FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2`,
            [coupon.id, userId]
        );

        if (usageCheck.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Você já utilizou este cupom. Promoções são válidas apenas na primeira compra.' 
            });
        }

        // Success: Return discount details
        res.json({
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: parseFloat(coupon.discount_value)
        });
    } catch (error) {
        console.error('Validate Coupon Error:', error);
        res.status(500).json({ message: 'Erro interno ao validar cupom. Tente novamente.' });
    }
};

/**
 * Admin: Get influencer performance stats
 */
exports.getInfluencerStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.id as influencer_id,
                u.name as influencer_name,
                COUNT(cu.id) as total_uses,
                SUM(
                    CASE 
                        WHEN c.discount_type = 'percent' THEN 299 * (1 - c.discount_value / 100)
                        WHEN c.discount_type = 'fixed' THEN GREATEST(0, 299 - c.discount_value)
                        ELSE 299
                    END
                ) as total_revenue
            FROM users u
            JOIN coupons c ON u.id = c.influencer_id
            LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
            WHERE u.is_influencer = true
            GROUP BY u.id, u.name
            ORDER BY total_uses DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Influencer Stats Error:', error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
    }
};

/**
 * Admin: Toggle coupon active status
 */
exports.toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        await db.query(
            `UPDATE coupons SET active = $1 WHERE id = $2`,
            [active, id]
        );

        res.json({ message: `Cupom ${active ? 'ativado' : 'desativado'} com sucesso.` });
    } catch (error) {
        console.error('Toggle Coupon Error:', error);
        res.status(500).json({ message: 'Erro ao atualizar status do cupom.' });
    }
};
