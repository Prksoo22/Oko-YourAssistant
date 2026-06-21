import axios from 'axios';

// Eksekusi download gambar lokal tanpa API dari pesan WhatsApp
export async function downloadWhatsAppMedia(m) {
    const q = m.quoted ? m.quoted : m;
    const mimetype = q.msg?.mimetype || q.mimetype || '';
    
    if (/image/.test(mimetype)) {
        return await q.download(); // Fungsi download bawaan dari boilerplate-mu
    }
    return null;
}

// Download TikTok menggunakan Nexray (disamakan dengan format IG)
export async function downloadTikTok(url) {
    const apiUrl = `https://api.nexray.eu.cc/downloader/tiktok?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl);
    return res.data;
}

// Download Instagram menggunakan Nexray
export async function downloadIG(url) {
    const apiUrl = `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl);
    return res.data;
}
