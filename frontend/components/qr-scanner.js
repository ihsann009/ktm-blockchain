'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner({ onScanSuccess }) {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerInstanceRef = useRef(null);

  const startScanner = () => {
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.clear().catch(err => {
        console.error("Failed to clear scanner", err);
      });
      scannerInstanceRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isScanning) return;

    const initTimer = setTimeout(() => {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      try {
        const scanner = new Html5QrcodeScanner('qr-reader', config, false);
        scannerInstanceRef.current = scanner;

        const onScanError = (errorMessage) => {};

        const handleSuccess = (decodedText) => {
          if (scannerInstanceRef.current) {
            scannerInstanceRef.current.clear().catch(err => {
              console.error("Failed to clear scanner on success", err);
            });
            scannerInstanceRef.current = null;
          }
          setIsScanning(false);
          onScanSuccess(decodedText);
        };

        scanner.render(handleSuccess, onScanError);
      } catch (err) {
        console.error("Scanner initialization failed:", err);
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(err => {
          console.error("Failed to clear scanner on unmount", err);
        });
        scannerInstanceRef.current = null;
      }
    };
  }, [isScanning, onScanSuccess]);

  return (
    <div className="w-full flex flex-col items-center">
      {!isScanning ? (
        <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center transition-colors hover:bg-slate-100 hover:border-slate-400">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm18 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v3a1 1 0 102 0V4zM3 20a1 1 0 001 1h4a1 1 0 100-2H5v-3a1 1 0 10-2 0v4zm18 0a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 112 0v4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8v4H8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Scan QR Code</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Use your device's camera to scan a student's digital credential QR code.
          </p>
          <button
            onClick={startScanner}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm hover:bg-blue-700 hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
          >
            Start Camera Scanner
          </button>
        </div>
      ) : (
        <div className="w-full relative bg-black rounded-xl overflow-hidden shadow-md">
          <div id="qr-reader" className="w-full h-full min-h-[300px]"></div>
          
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={stopScanner}
              className="bg-slate-900/70 hover:bg-slate-800 text-white p-2 rounded-full backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close scanner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            #qr-reader { border: none !important; }
            #qr-reader__dashboard_section_csr { display: none !important; }
            #qr-reader__dashboard_section_swaplink { text-decoration: none !important; color: white !important; display: inline-block; margin-top: 10px; background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 4px; }
            #qr-reader__status_span { display: none !important; }
            #qr-reader video { object-fit: cover !important; }
          `}} />
        </div>
      )}
    </div>
  );
}
