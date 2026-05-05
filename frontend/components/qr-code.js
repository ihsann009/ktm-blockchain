'use client';

import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeComponent({ text, size = 200, className = '' }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!text) return;

    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          width: size,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(url);
        setError(null);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQR();
  }, [text, size]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 text-red-500 rounded-lg border border-red-200 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!qrDataUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-slate-100 rounded-lg animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-8 h-8 border-4 border-slate-300 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-2 rounded-xl shadow-sm border border-slate-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={qrDataUrl} 
        alt="QR Code" 
        width={size} 
        height={size}
        className="mx-auto"
        draggable={false}
      />
    </div>
  );
}
