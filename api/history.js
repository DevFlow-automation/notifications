import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method Not Allowed" });

    // Получаем последние 50 сообщений вместе с количеством подтверждений "Ознакомлен"
    try {
        const history = await sql`
            SELECT
                m.id,
                m.sender_id,
                m.recipient_id,
                m.message_text,
                m.timestamp,
                (SELECT COUNT(id) FROM acknowledgments a WHERE a.history_id = m.id) as ack_count
            FROM messages m
            ORDER BY m.timestamp DESC
            LIMIT 50
        `;

        const formattedHistory = history.map(msg => {
            // Форматируем дату в DD.MM.YYYY HH:MM
            const d = new Date(msg.timestamp);
            const timeStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

            // Человекопонятный получатель
            let targetDisplay = msg.recipient_id;
            if (targetDisplay === 'all') targetDisplay = "Всем родителям";
            else if (targetDisplay === 'sick') targetDisplay = "Всем болеющим";
            else if (targetDisplay === 'excused') targetDisplay = "Отсутствующим (уваж.)";
            else if (targetDisplay === 'unexcused') targetDisplay = "Отсутствующим (неуваж.)";
            else if (targetDisplay === 'late') targetDisplay = "Опоздавшим";
            else if (!isNaN(targetDisplay)) targetDisplay = `Родитель ID: ${targetDisplay}`; // Точечная отправка
            else targetDisplay = `Класс ${targetDisplay}`;

            // Человекопонятный отправитель
            let senderDisplay = "Неизвестно";
            const senderId = Number(msg.sender_id);
            if ([8771384583, 229049117].includes(senderId)) senderDisplay = "Админ";
            else if ([387863654, 21900086, 87180537].includes(senderId)) senderDisplay = "Замдир.";
            else if (senderId) senderDisplay = `Учитель (ID: ${senderId})`;

            return {
                id: msg.id,
                sender: senderDisplay,
                target: targetDisplay,
                text: msg.message_text,
                time: timeStr,
                ack_count: Number(msg.ack_count)
            };
        });

        return res.status(200).json({ history: formattedHistory });
    } catch (error) {
        console.error("Ошибка загрузки истории:", error);
        return res.status(500).json({ error: "Ошибка БД" });
    }
}
