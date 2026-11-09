import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const userId = parseInt(req.query.user_id, 10) || 0;
    const ADMIN_IDS = [8771384583, 229049117];
    const DEPUTY_IDS = [387863654, 21900086]; // Сократил для примера
    const TEACHERS = { 593614259: "1А" }; // Сократил для примера

    try {
        if (ADMIN_IDS.includes(userId) || DEPUTY_IDS.includes(userId)) {
            // Получаем уникальные классы из базы
            const result = await sql`SELECT DISTINCT school_class FROM parents ORDER BY school_class`;
            const classes = result.map(row => row.school_class).filter(Boolean);
            return res.status(200).json({ classes });
        } else if (TEACHERS[userId]) {
            return res.status(200).json({ classes: [TEACHERS[userId]] });
        }

        return res.status(200).json({ classes: [] });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
