import { getAudioUrl } from 'google-tts-api';
import fs from 'fs';
import axios from 'axios';
import { downloadTikTok, downloadIG } from '../../lib/aiHelper.js';

const config = JSON.parse(fs.readFileSync('./config.json'));

export default async function (sock, m, text, sender) {
    if (!text || text.startsWith('.')) return; 

    try {
        // Logika Trial
        let trials = {};
        if (fs.existsSync('./database/trials.json')) {
            trials = JSON.parse(fs.readFileSync('./database/trials.json'));
        }
        
        let activePrompt = config.systemPrompt; 
        if (trials[sender]) {
            const now = Date.now();
            if (now > trials[sender].expiredAt) {
                return sock.sendMessage(sender, { text: '⚠️ Masa aktif trial Jadibot Anda telah berakhir.' }, { quoted: m });
            }
            if (trials[sender].customPrompt) {
                activePrompt = trials[sender].customPrompt;
            }
        }

        const finalPrompt = `${activePrompt}\n\n[INSTRUKSI WAJIB SYSTEM: Jika user minta download tiktok, balas [TIKTOK] <url>. Jika IG, balas [IG] <url>. Jika user minta pesan suara/VN, balas [VN] <teks>.]\n\nUser: ${text}\nBalasan AI:`;

        const res = await fetch('https://puruboy-api.vercel.app/api/ai/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalPrompt })
        });

        const json = await res.json();
        const responseText = String(json.result?.answer || json.result || "");

        // --- HANDLER FITUR ---
        
        // 1. TIKTOK
        if (responseText.includes('[TIKTOK]')) {
            const url = responseText.split('[TIKTOK] ')[1]?.trim();
            await sock.sendMessage(sender, { text: '⏳ Mengunduh video TikTok...' }, { quoted: m });
            const data = await downloadTikTok(url);
            if (data?.play) await sock.sendMessage(sender, { video: { url: data.play }, caption: data.title }, { quoted: m });
        } 
        // 2. INSTAGRAM
        else if (responseText.includes('[IG]')) {
            const url = responseText.split('[IG] ')[1]?.trim();
            await sock.sendMessage(sender, { text: '⏳ Mengunduh Instagram...' }, { quoted: m });
            const apiUrl = `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(url)}`;
            const apiRes = await axios.get(apiUrl);
            if (apiRes.data.result?.[0]?.url) {
                await sock.sendMessage(sender, { video: { url: apiRes.data.result[0].url } }, { quoted: m });
            }
        }
        // 3. VOICE NOTE (Versi stabil via npm google-tts-api)
        else if (responseText.includes('[VN]')) {
            const vnText = responseText.split('[VN] ')[1]?.trim();
            const audioUrl = getAudioUrl(vnText, { lang: 'id', slow: false, host: 'https://translate.google.com' });
            await sock.sendMessage(sender, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: m });
        }
        // 4. CHAT BIASA
        else {
            await sock.sendMessage(sender, { text: responseText }, { quoted: m });
        }
    } catch (error) {
        console.error("Error AI Module:", error?.response?.data || error.message);
        await sock.sendMessage(sender, { text: 'Waduh, sistem AI sedang mengalami kendala. Coba lagi nanti ya.' }, { quoted: m });
    }
}
