import { useEffect } from 'react';

const APP_STORE_URL = 'https://apps.apple.com/app/id6767374981';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.wavi.app';

function detectOS(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export default function DownloadPage() {
  useEffect(() => {
    const os = detectOS();
    if (os === 'ios') window.location.href = APP_STORE_URL;
    if (os === 'android') window.location.href = PLAY_STORE_URL;
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <img
        src="/logo.png"
        alt="Wavi"
        className="w-24 h-24 rounded-3xl shadow-lg mb-6"
      />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Wavi</h1>
      <p className="text-gray-500 text-center mb-10 max-w-xs">
        Encuentra el plan perfecto para ti
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a
          href={APP_STORE_URL}
          className="flex items-center justify-center gap-3 bg-black text-white rounded-2xl px-6 py-4 font-semibold text-lg hover:bg-gray-800 transition"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Descargar en App Store
        </a>

        <a
          href={PLAY_STORE_URL}
          className="flex items-center justify-center gap-3 bg-black text-white rounded-2xl px-6 py-4 font-semibold text-lg hover:bg-gray-800 transition"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" aria-hidden="true">
            <path d="M3.18 23.76c.3.17.64.22.99.16l12.87-7.43-2.82-2.82-11.04 10.09zM.35 1.5C.13 1.86 0 2.3 0 2.83v18.34c0 .53.13.97.35 1.33l.07.07 10.27-10.27v-.24L.42 1.43l-.07.07zM21.45 10.16l-2.83-1.63-3.16 3.16 3.16 3.15 2.85-1.65c.81-.47.81-1.56-.02-2.03zM3.18.24l12.87 7.43-2.82 2.82L3.18.31l-.07-.07z" />
          </svg>
          Descargar en Google Play
        </a>
      </div>
    </div>
  );
}
