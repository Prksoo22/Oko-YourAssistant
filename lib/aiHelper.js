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

import axios from 'axios';
export async function downloadWhatsAppMedia(m) {
    const q = m.quoted ? m.quoted : m;
    const mimetype = q.msg?.mimetype || q.mimetype || '';
    
    if (/image/.test(mimetype)) {
        return await q.download(); 
    }
    return null;
}

export async function downloadTikTok(url) {
    const apiUrl = `https://api.nexray.eu.cc/downloader/tiktok?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl);
    return res.data;
}

export async function downloadIG(url) {
    const apiUrl = `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl);
    return res.data;
}
