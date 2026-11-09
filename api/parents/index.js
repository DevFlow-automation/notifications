import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    // Получение всех родителей (GET)
    if (req.method === 'GET') {
        const userId = parseInt(req.query.user_id, 10) || 0;
        const TEACHERS = { 593614259: "1А", 7475228092: "1Б" }; // Укажите ваших учителей

        try {
            let parents;
            if (TEACHERS[userId]) {
                const sClass = TEACHERS[userId];
                parents = await sql`SELECT * FROM parents WHERE school_class = ${sClass} ORDER BY parent_full_name`;
            } else {
                parents = await sql`SELECT * FROM parents ORDER BY school_class, parent_full_name`;
            }
            // Преобразуем BigInt (telegram_id) в строку, иначе JSON.stringify выдаст ошибку
            const formatted = parents.map(p => ({ ...p, telegram_id: String(p.telegram_id) }));
            return res.status(200).json({ parents: formatted });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Ручное добавление родителя (POST)
    if (req.method === 'POST') {
        const { telegram_id, parent_full_name, child_full_name, school_class, email, phone, address } = req.body;
        try {
            await sql`
                INSERT INTO parents (telegram_id, parent_full_name, child_full_name, school_class, email, phone, address, student_status)
                VALUES (${telegram_id}, ${parent_full_name}, ${child_full_name}, ${school_class}, ${email}, ${phone}, ${address}, 'present')
            `;
            return res.status(200).json({ status: "success" });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
