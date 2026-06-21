// ==========================================
// O k o - Y o u r A s s i s t a n t
// Created by : Prks.adiw -> Instagram
// Part of : OkoAi - WhatsApp Bot
// Github : Prksoo22
// 
// Premium WhatsApp Bot! Not for resale.
// All forms of ownership are owned by the Maker and the Buyer. It should be noted that the Buyer is prohibited from reselling the Goods.
//             OkoAi - ©Since of 2020
// ==========================================

import fs from 'fs';
import path from 'path';

export async function handleMessages(sock, m) {
    const msg = m.messages?.[0] || m;
    if (!msg.message || msg.key.fromMe) return;

    // FILTER PESAN LAMA
    const messageTimestamp = msg.messageTimestamp;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - messageTimestamp > 15) return;

    // ✅ FIX: Ditambahkan dukungan untuk membaca teks dari caption gambar & video
    const text = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || 
                 msg.message?.imageMessage?.caption || 
                 msg.message?.videoMessage?.caption || '';
                 
    const sender = msg.key.remoteJid;

    // Load semua plugins secara dinamis (ESM)
    const pluginFolders = ['General', 'User', 'Owner'];
    for (const folder of pluginFolders) {
        const dirPath = path.resolve(`./plugins/${folder}`);
        if (!fs.existsSync(dirPath)) continue;

        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const plugin = await import(`file://${path.join(dirPath, file)}`);
            if (typeof plugin.default === 'function') {
                await plugin.default(sock, msg, text, sender);
            }
        }
    }
}
