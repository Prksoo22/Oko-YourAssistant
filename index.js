import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import { handleMessages } from './handler.js';

const config = JSON.parse(fs.readFileSync('./config.json'));
let isPairingStarted = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();
    console.log(`ℹ️ Menghubungkan menggunakan versi WA Web: ${version.join('.')}`);

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        version: version,
        browser: Browsers.ubuntu('Chrome')
    });

    if (!state.creds.registered && !isPairingStarted) {
        isPairingStarted = true;
        console.log('⏳ Menyiapkan jalur koneksi aman ke WhatsApp...');
        
        setTimeout(async () => {
            try {
                const targetNumber = config.pairingNumber.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(targetNumber);
                console.log(`\n========================================\n[!] PAIRING CODE KAMU: ${code}\n========================================\n`);
                console.log('📱 SILAKAN CEK HP! Masukkan kode di atas pada menu Perangkat Tertaut.\n');
            } catch (err) {
                console.error('❌ Gagal mendapatkan Pairing Code:', err.message);
                isPairingStarted = false;
            }
        }, 4000); 
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const errorLog = lastDisconnect.error?.toString() || '';
            const reason = lastDisconnect.error?.output?.statusCode;
            
            // JIKA MENDETEKSI BAD MAC / SESSION CORRUPT, BERSIHKAN OTOMATIS
            if (errorLog.includes('Bad MAC Error') || errorLog.includes('verifyMAC')) {
                console.log('⚠️ [SYSTEM] Mendeteksi Bad MAC Error! Menghapus otomatis folder session yang rusak...');
                try {
                    fs.rmSync('./session', { recursive: true, force: true });
                    console.log('✅ [SYSTEM] Folder session berhasil dibersihkan.');
                } catch (err) {
                    console.error('Gagal menghapus session:', err);
                }
                process.exit(1); // Matikan proses agar panel otomatis melakukan auto-restart dengan session bersih
            }

            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Sesi WhatsApp terhapus (Logged Out). Menghapus folder session...');
                try { fs.rmSync('./session', { recursive: true, force: true }); } catch (e) {}
                process.exit(1);
            } else {
                console.log(`♻️ Koneksi terputus (Status: ${reason}). Menghoba menghubungkan kembali...`);
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ KONEKSI SUKSES! OkoAi sudah terhubung dan siap digunakan.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;
            await handleMessages(sock, m);
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });
}

startBot();
