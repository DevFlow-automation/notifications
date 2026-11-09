export default function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const userId = parseInt(req.query.user_id, 10) || 0;
    const ADMIN_IDS = [8771384583, 229049117];
    const DEPUTY_IDS = [387863654, 21900086, 87180537, 32542185, 1759984801, 11763622, 1176641277, 117636223, 219000864];
    const TEACHERS = { 593614259: "1А", 7475228092: "1Б", 165555820: "1В", 6759744115: "1Г" };

    if (ADMIN_IDS.includes(userId)) {
        return res.status(200).json({ role: "admin", class: null });
    } else if (DEPUTY_IDS.includes(userId)) {
        return res.status(200).json({ role: "deputy", class: null });
    } else if (TEACHERS[userId]) {
        return res.status(200).json({ role: "teacher", class: TEACHERS[userId] });
    }

    return res.status(200).json({ role: "none", class: null });
}
