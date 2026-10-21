const urls = [
  'http://www.dxgarage.com/',
  'https://www.mycarworkshopdubai.com/',
  'http://almeerajauto.com/',
  'http://www.carcafe.ae/',
  'https://cargarageexpert.com/'
];

async function auditSite(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(timer);

    const html = await res.text();
    const isHttp = url.startsWith('http://');
    const copyrightMatch = html.match(/(?:©|copyright|&copy;)\s*(?:20\d\d\s*[-–]\s*)?(20\d\d)/i);
    const year = copyrightMatch ? parseInt(copyrightMatch[1], 10) : null;
    const isOldYear = year !== null && year <= 2021;
    const isModernYear = year !== null && year >= 2024;
    const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
    const hasOldWP = html.includes('wp-content') || html.includes('wp-includes');

    let status = 'MODERN_OR_ACTIVE';
    if (isHttp && !res.url.startsWith('https://')) {
      status = 'OUTDATED_NO_SSL';
    } else if (isOldYear) {
      status = `OUTDATED_YEAR_${year}`;
    } else if (!hasViewport) {
      status = 'OUTDATED_NOT_MOBILE_RESPONSIVE';
    } else if (isModernYear) {
      status = `MODERN_${year}`;
    }

    console.log(url, '=> Status:', status, '| Detected Year:', year, '| Final URL:', res.url);
  } catch (err) {
    console.log(url, '=> DEAD/TIMEOUT:', err.message);
  }
}

async function run() {
  for (const u of urls) {
    await auditSite(u);
  }
}

run();
