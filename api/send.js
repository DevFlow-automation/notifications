import { neon } from '@neondatabase/serverless';
import { Bot } from 'grammy';

const sql = neon(process.env.DATABASE_URL);
const bot = new Bot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ status: "error", message: "Method Not Allowed" });

    const { target_type, target_value, text, user_id } = req.body;
    const statusTargets = ['sick', 'excused', 'unexcused', 'late'];

    try {
        let parentIds = [];

        // Логика выборки получателей из базы
        if (target_type === 'all') {
            const rows = await sql`SELECT DISTINCT telegram_id FROM parents`;
            parentIds = rows.map(r => r.telegram_id);
        } else if (statusTargets.includes(target_type)) {
            const rows = await sql`SELECT DISTINCT telegram_id FROM parents WHERE student_status = ${target_type}`;
            parentIds = rows.map(r => r.telegram_id);
        } else if (target_type === 'class') {
            const rows = await sql`SELECT DISTINCT telegram_id FROM parents WHERE school_class = ${target_value}`;
            parentIds = rows.map(r => r.telegram_id);
        } else if (target_type === 'student') {
            parentIds = [parseInt(target_value, 10)];
        } else {
            return res.status(400).json({ status: "error", message: "Неверный тип рассылки" });
        }

        if (parentIds.length === 0) {
            return res.status(400).json({ status: "error", message: "Нет получателей в этой категории" });
        }

        // 1. Создаем запись в истории сообщений и получаем её ID (RETURNING id)
        const msgResult = await sql`
            INSERT INTO messages (sender_id, recipient_id, message_text)
            VALUES (${user_id}, ${target_value}, ${text})
            RETURNING id
        `;
        const newMsgId = msgResult[0].id;

        let successCount = 0;

        // 2. Делаем рассылку
        for (const pid of parentIds) {
            try {
                await bot.api.sendMessage(pid, text, {
                    reply_markup: {
                        inline_keyboard: [[{ text: "Ознакомлен ✅", callback_data: `ack_${newMsgId}` }]]
                    }
                });
                successCount++;
                // Искусственная задержка 50мс, чтобы Telegram не заблокировал за спам (Flood Control)
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (err) {
                console.error(`Ошибка отправки пользователю ${pid}:`, err.message);
            }
        }

        return res.status(200).json({ status: "success", count: successCount });
    } catch (error) {
        console.error("Ошибка при рассылке:", error);
        return res.status(500).json({ status: "error", message: "Ошибка БД при рассылке." });
    }
}
