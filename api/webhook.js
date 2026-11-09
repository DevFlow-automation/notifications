import { Bot, webhookCallback } from 'grammy';
import { neon } from '@neondatabase/serverless';

// Инициализация БД и бота
const sql = neon(process.env.DATABASE_URL);
const bot = new Bot(process.env.BOT_TOKEN);

const ADMIN_IDS = [8771384583, 229049117];
const DEPUTY_IDS = [387863654, 21900086, 87180537, 32542185, 1759984801, 11763622, 1176641277, 117636223, 219000864];
// Учителей лучше вынести в отдельный конфиг или таблицу, но пока оставим как в Python:
const TEACHERS = {
    593614259: "1А", 7475228092: "1Б", 165555820: "1В", 6759744115: "1Г"
    // ... добавьте остальных
};

bot.command('start', async (ctx) => {
    const userId = ctx.from.id;
    const isStaff = ADMIN_IDS.includes(userId) || DEPUTY_IDS.includes(userId) || !!TEACHERS[userId];
    const WEBAPP_URL = process.env.WEBAPP_URL;

    if (isStaff) {
        let roleName = "классный руководитель";
        if (ADMIN_IDS.includes(userId)) roleName = "администратор";
        else if (DEPUTY_IDS.includes(userId)) roleName = "замдиректора";

        await ctx.reply(`Добро пожаловать, ${roleName}! Нажмите кнопку ниже, чтобы открыть панель управления.`, {
            reply_markup: {
                inline_keyboard: [[{ text: "Панель управления", web_app: { url: WEBAPP_URL } }]]
            }
        });
    }

    // Проверяем, есть ли родитель в БД
    const parents = await sql`SELECT * FROM parents WHERE telegram_id = ${userId} LIMIT 1`;

    if (parents.length === 0) {
        await ctx.reply(
            "Добро пожаловать в официальный бот оповещений New Generation School.\n\nДля подключения к системе рассылки необходимо заполнить анкету.",
            {
                reply_markup: {
                    inline_keyboard: [[{ text: "📝 Пройти регистрацию", web_app: { url: `${WEBAPP_URL}/register.html` } }]]
                }
            }
        );
    } else if (!isStaff) {
        await ctx.reply("Вы уже зарегистрированы в системе оповещений.\n\nЕсли вы хотите добавить данные еще одного ребенка, отправьте команду /add_child");
    }
});

bot.callbackQuery(/ack_(\d+)/, async (ctx) => {
    const historyId = parseInt(ctx.match[1], 10);
    const userId = ctx.from.id;

    try {
        const existing = await sql`
            SELECT id FROM acknowledgments
            WHERE history_id = ${historyId} AND telegram_id = ${userId}
        `;

        if (existing.length === 0) {
            await sql`
                INSERT INTO acknowledgments (history_id, telegram_id)
                VALUES (${historyId}, ${userId})
            `;
        }
        await ctx.answerCallbackQuery("Вы подтвердили ознакомление!");
        await ctx.editMessageReplyMarkup(); // Убирает кнопку
    } catch (error) {
        console.error(error);
        await ctx.answerCallbackQuery({ text: "Произошла ошибка.", show_alert: true });
    }
});

// Экспорт для Vercel Serverless
export default webhookCallback(bot, 'http');
