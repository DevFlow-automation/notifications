import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== 'PUT') return res.status(405).json({ status: "error", message: "Method Not Allowed" });

    const parentId = parseInt(req.query.id, 10);
    const { status } = req.body;

    try {
        await sql`UPDATE parents SET student_status = ${status} WHERE id = ${parentId}`;
        return res.status(200).json({ status: "success", student_status: status });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
}
