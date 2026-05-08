'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onScanSuccess }) {
  const [isScanning, setIsScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  const startScanner = async () => {
    setErrorMsg(null);
    setPermissionDenied(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionDenied(true);
      setErrorMsg('Browser tidak mendukung akses kamera pada koneksi HTTP. Gunakan HTTPS atau localhost di Chrome.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());

      setIsScanning(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setErrorMsg('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setErrorMsg('Gagal mengakses kamera: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isScanning) return;

    let scanner = null;

    const initScanner = async () => {
      try {
        scanner = new Html5Qrcode('qr-reader-container');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            stopScanner();
            onScanSuccess(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error('Scanner start failed:', err);
        setErrorMsg('Gagal memulai scanner: ' + (err.message || err));
        setIsScanning(false);
      }
    };

    const timer = setTimeout(initScanner, 150);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === 2) {
            scanner.stop().catch(() => {});
          }
        } catch {}
      }
    };
  }, [isScanning, onScanSuccess]);

  return (
    <div className="w-full flex flex-col items-center">
      {!isScanning ? (
        <div className="w-full flex flex-col items-center">
          <div className="w-full bg-slate-50/80 border-2 border-dashed border-slate-300 rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center transition-colors hover:bg-slate-100/80 hover:border-primary-400 group">
            <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm18 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v3a1 1 0 102 0V4zM3 20a1 1 0 001 1h4a1 1 0 100-2H5v-3a1 1 0 10-2 0v4zm18 0a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 112 0v4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8v4H8z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1.5">Scan QR Code</h3>
            <p className="text-sm text-slate-500 mb-5 max-w-[240px]">
              Gunakan kamera untuk scan QR pada KTM Digital mahasiswa.
            </p>
            <button
              onClick={startScanner}
              className="btn-primary flex items-center gap-2 shadow-md shadow-primary-600/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Buka Kamera
            </button>
          </div>

          {permissionDenied && (
            <div className="mt-4 w-full p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm">
                <p className="font-bold text-amber-800">Izin Kamera Diperlukan</p>
                <p className="text-amber-700 mt-1 leading-relaxed">
                  Browser memblokir akses kamera. Untuk mengizinkan:
                </p>
                <ol className="text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>Klik ikon gembok/info di address bar</li>
                  <li>Cari pengaturan &quot;Camera&quot; atau &quot;Kamera&quot;</li>
                  <li>Ubah ke &quot;Allow&quot; / &quot;Izinkan&quot;</li>
                  <li>Refresh halaman ini</li>
                </ol>
              </div>
            </div>
          )}

          {errorMsg && !permissionDenied && (
            <div className="mt-4 w-full p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-bold text-red-800">Error</p>
                <p className="text-red-700 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full relative rounded-xl overflow-hidden shadow-lg border border-slate-200">
          <div id="qr-reader-container" className="w-full min-h-[300px] bg-black"></div>
          
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={stopScanner}
              className="bg-slate-900/70 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Tutup scanner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-slate-900/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
              Arahkan kamera ke QR Code
            </div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            #qr-reader-container { border: none !important; }
            #qr-reader-container video { object-fit: cover !important; border-radius: 0.75rem; }
            #qr-reader-container img[alt="Info icon"] { display: none !important; }
          `}} />
        </div>
      )}
    </div>
  );
}
