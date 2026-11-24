'use client';
import { useEffect } from 'react';
import markup from './markup';

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
const load = src => new Promise(ok => {
  const s = document.createElement('script');
  s.src = src; s.onload = () => ok(true); s.onerror = () => ok(false);
  document.head.appendChild(s);
});

export default function LegacyApp() {
  useEffect(() => {
    if (window.__itliveStarted) return;
    window.__itliveStarted = true;
    (async () => {
      // Kutubxonalar (QR yaratish, QR o'qish, PDF) — ilovadan oldin yuklanadi; autotable jsPDF'dan keyin
      await Promise.all([
        load(CDN + 'qrcode-generator/1.4.4/qrcode.min.js'),
        load(CDN + 'jsQR/1.4.0/jsQR.min.js'),
        load(CDN + 'jspdf/2.5.1/jspdf.umd.min.js').then(() => load(CDN + 'jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')),
      ]);
      await load('/app.js?v=2');
    })();
  }, []);

  // display:contents — sarlavha, asosiy qism va pastki panel to'g'ridan-to'g'ri <body> grid'ining bolalari bo'lib qoladi
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: markup }} />;
}
