export default function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const userId = parseInt(req.query.user_id, 10) || 0;
    const ADMIN_IDS = [8771384583, 229049117]; 
    const DEPUTY_IDS = [387863654, 21900086, 87180537, 32542185, 1759984801, 11763622, 1176641277, 117636223, 219000864];
    const TEACHERS = {
        593614259: "1А", 7475228092: "1Б", 165555820: "1В", 6759744115: "1Г",
        262935335: "2А", 2067119625: "2Б", 192592122: "2В", 261773072: "2Г",
        843534212: "3А", 83655322: "3Б", 1579165503: "3В", 1849602045: "3Г",
        389444120: "4А", 8300203162: "4Б", 132622662: "4В",
        267481288: "5А", 815313499: "5Б", 937544028: "5В",
        127589326: "6А", 905178719: "6Б",
        8885418064: "7А", 8099039998: "7Б", 144330475: "7В",
        241743825: "8А", 42760022: "8Б",
        1329417314: "9А", 124341010: "10А", 539135124: "11А"
    };

    if (ADMIN_IDS.includes(userId)) {
        return res.status(200).json({ role: "admin", class: null });
    } else if (DEPUTY_IDS.includes(userId)) {
        return res.status(200).json({ role: "deputy", class: null });
    } else if (TEACHERS[userId]) {
        return res.status(200).json({ role: "teacher", class: TEACHERS[userId] });
    }

    return res.status(200).json({ role: "none", class: null });
}
