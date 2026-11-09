import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method Not Allowed" });

    try {
        // 1. Получаем саму историю
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

        // 2. Получаем всех родителей, чтобы сопоставить их ID с именами
        const parents = await sql`SELECT telegram_id, parent_full_name, child_full_name, school_class FROM parents`;
        const parentMap = new Map();
        // Сохраняем в Map для мгновенного поиска по ID
        parents.forEach(p => parentMap.set(String(p.telegram_id), p));

        const formattedHistory = history.map(msg => {
            const d = new Date(msg.timestamp);
            const timeStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

            let targetDisplay = msg.recipient_id;
            
            // Логика формирования получателя под требования index.html
            if (targetDisplay === 'all') targetDisplay = "Всем родителям";
            else if (targetDisplay === 'sick') targetDisplay = "Всем болеющим";
            else if (targetDisplay === 'excused') targetDisplay = "Отсутствующим (уваж.)";
            else if (targetDisplay === 'unexcused') targetDisplay = "Отсутствующим (неуваж.)";
            else if (targetDisplay === 'late') targetDisplay = "Опоздавшим";
            else if (!isNaN(targetDisplay)) {
                // Если recipient_id — это цифры (Telegram ID)
                const p = parentMap.get(String(targetDisplay));
                if (p) {
                    // ФОРМАТ, КОТОРЫЙ ЖДЕТ ФРОНТЕНД: Имя Родителя (реб. Имя Ребенка, Класс)
                    targetDisplay = `${p.parent_full_name} (реб. ${p.child_full_name}, ${p.school_class})`;
                } else {
                    targetDisplay = `Удаленный профиль (ID: ${targetDisplay})`;
                }
            }
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
