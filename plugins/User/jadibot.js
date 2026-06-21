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
import { makeWASocket, useMultiFileAuthState, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import { handleMessages } from '../../handler.js';

const dbDir = path.resolve('./database');
const dbPath = path.join(dbDir, 'users.json');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

export default async function (sock, m, text, sender) {
    if (text.startsWith('.jadibot')) {
        const args = text.split(' ');
        const targetNumber = args[1]?.replace(/[^0-9]/g, '');

        if (!targetNumber) {
            return sock.sendMessage(sender, { text: '❌ Format salah! Gunakan: `.jadibot 628xxxxxxxx`' }, { quoted: m });
        }

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        const now = Date.now();

        if (!db[sender]) {
            db[sender] = { 
                premium: false, 
                trialExpired: now + (3 * 24 * 60 * 60 * 1000), 
                prompt: "Kamu adalah asisten AI." 
            };
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }

        const user = db[sender];
        if (!user.premium && now > user.trialExpired) {
            return sock.sendMessage(sender, { text: '❌ Masa trial 3 hari kamu sudah habis! Hubungi owner untuk premium.' }, { quoted: m });
        }

        await sock.sendMessage(sender, { text: `⏳ Sedang menyiapkan Jadibot untuk: ${targetNumber}...` }, { quoted: m });

        const sessionDir = path.resolve(`./session/jadibot-${targetNumber}`);
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const subSock = makeWASocket({
            logger: pino({ level: 'silent' }),
            auth: state,
            browser: Browsers.ubuntu('Chrome')
        });

        subSock.ev.on('creds.update', saveCreds);

        setTimeout(async () => {
            try {
                if (!state.creds.registered) {
                    const code = await subSock.requestPairingCode(targetNumber);
                    const instruksi = `✅ *Jadibot Siap Dihubungkan!*\n\n` +
                                     `*Pairing Code:* ${code}\n\n` +
                                     `*Cara Sambungin:*\n` +
                                     `1. Buka WA di HP target.\n` +
                                     `2. Klik Perangkat Tertaut.\n` +
                                     `3. Pilih Tautkan Perangkat Baru.\n` +
                                     `4. Tautkan dengan nomor telepon saja.\n` +
                                     `5. Masukkan kode di atas.`;
                    await sock.sendMessage(sender, { text: instruksi }, { quoted: m });
                }
            } catch (e) {
                await sock.sendMessage(sender, { text: `❌ Gagal buat Pairing Code: ${e.message}` }, { quoted: m });
            }
        }, 5000);

        subSock.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
                sock.sendMessage(sender, { text: `✅ Jadibot ${targetNumber} sudah aktif!` }, { quoted: m });
            }
        });

        subSock.ev.on('messages.upsert', async (chat) => {
            const msg = chat.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            await handleMessages(subSock, msg);
        });
    }

    if (text.startsWith('.setprompt ')) {
        let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        if (!db[sender]) {
            return sock.sendMessage(sender, { text: '❌ Daftar dulu dengan .jadibot <nomor>' }, { quoted: m });
        }

        const newPrompt = text.replace('.setprompt ', '').trim();
        db[sender].prompt = newPrompt;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        
        await sock.sendMessage(sender, { text: `✅ *Prompt berhasil diubah ke:*\n"${newPrompt}"` }, { quoted: m });
    }
}
