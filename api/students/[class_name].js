import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    // Имя параметра должно совпадать с названием файла в скобках. 
    // Если файл называется [id].js, используйте req.query.id
    const className = req.query.id || req.query.class_name;

    try {
        // Сортировка по алфавиту через ORDER BY child_full_name ASC
        const result = await sql`
            SELECT telegram_id, child_full_name, parent_full_name 
            FROM parents 
            WHERE school_class = ${className}
            ORDER BY child_full_name ASC
        `;
        const students = result.map(s => ({ ...s, telegram_id: String(s.telegram_id) }));
        
        return res.status(200).json({ students });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
