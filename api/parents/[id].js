import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    const parentId = parseInt(req.query.id, 10);
    if (!parentId) return res.status(400).json({ status: "error", message: "ID не указан" });

    // Редактирование (PUT)
    if (req.method === 'PUT') {
        const { parent_full_name, child_full_name, school_class, email, phone, address } = req.body;
        try {
            await sql`
                UPDATE parents
                SET parent_full_name = ${parent_full_name},
                    child_full_name = ${child_full_name},
                    school_class = ${school_class},
                    email = ${email},
                    phone = ${phone},
                    address = ${address}
                WHERE id = ${parentId}
            `;
            return res.status(200).json({ status: "success" });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    // Удаление (DELETE)
    if (req.method === 'DELETE') {
        try {
            await sql`DELETE FROM parents WHERE id = ${parentId}`;
            return res.status(200).json({ status: "success" });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    return res.status(405).json({ status: "error", message: "Method Not Allowed" });
}
