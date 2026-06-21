import fs from 'fs';
const dbPath = './database/users.json';

export default async function (sock, m, text, sender) {
    if (!text.startsWith('.addprem')) return;
    
    // Cek Owner (Ganti dengan nomor owner kamu)
    if (sender !== '6285168864066@s.whatsapp.net') return sock.sendMessage(sender, { text: '❌ Fitur khusus Owner!' }, { quoted: m });

    const args = text.split(' ');
    const target = args[1]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const days = parseInt(args[2]);

    if (!target || !days) return sock.sendMessage(sender, { text: 'Format: .addprem <nomor> <hari>\nContoh: .addprem 628xxxx 30' }, { quoted: m });

    let db = JSON.parse(fs.readFileSync(dbPath));
    db[target] = { premium: true, expired: Date.now() + (days * 86400000) };
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    await sock.sendMessage(sender, { text: `✅ Berhasil memberikan status premium ke ${target} selama ${days} hari.` }, { quoted: m });
}
