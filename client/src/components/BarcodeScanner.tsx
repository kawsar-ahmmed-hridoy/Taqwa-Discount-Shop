import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, X, ScanLine, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const scannerRef  = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState('');
  const [flash, setFlash]       = useState(false); // success flash

  const stop = async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); } catch {}
    }
    setScanning(false);
  };

  const start = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 240, height: 240 } },
        (text) => {
          setFlash(true);
          setTimeout(() => setFlash(false), 500);
          onScan(text);
          stop();
        },
        () => {}
      );
      setScanning(true);
    } catch {
      setError('Camera access denied. Check your browser permissions and try again.');
    }
  };

  useEffect(() => () => { stop(); }, []);

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl w-auto" style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${scanning ? 'bg-[var(--accent)]/20' : 'bg-[var(--surface-2)]'}`}>
            <ScanLine size={14} className={scanning ? 'text-[var(--accent)]' : 'text-[var(--muted)]'} />
          </div>
          <div>
            <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>Barcode Scanner</p>
            <p className="text-[10.5px]" style={{ color: 'var(--muted)' }}>{scanning ? 'Scanning…' : 'Ready to scan'}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={() => { stop(); onClose(); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-all" style={{ color: 'var(--muted)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Viewfinder */}
      <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        {/* Scanner mount */}
        <div id="qr-reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>img]:hidden [&_div:last-child]:hidden" />

        {/* Idle overlay */}
        {!scanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--surface-2)' }}>
            <div className="w-16 h-16 rounded-2xl border-2" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={28} style={{ color: 'var(--muted)' }} />
            </div>
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>Camera preview will appear here</p>
          </div>
        )}

        {/* Scanning reticle */}
        {scanning && (
          <>
            {/* Corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                {[['top-0 left-0 border-t-2 border-l-2 rounded-tl-lg'],['top-0 right-0 border-t-2 border-r-2 rounded-tr-lg'],['bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg'],['bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg']].map(([cls], i) => (
                  <div key={i} className={`absolute w-7 h-7 border-[#1f6feb] ${cls}`} />
                ))}
                {/* Scan line animation */}
                <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-[#1f6feb] to-transparent animate-[scanline_2s_ease-in-out_infinite]" style={{ top: '50%' }} />
              </div>
            </div>
            {/* Dark vignette corners */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(13,15,19,0.7) 100%)' }} />
          </>
        )}

        {/* Success flash */}
        {flash && <div className="absolute inset-0 bg-emerald-400/20 animate-pulse pointer-events-none" />}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--surface-2)' }}>
            <div className="w-12 h-12 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <p className="text-[12px] leading-relaxed text-center px-6" style={{ color: 'var(--text)' }}>{error}</p>
            <button onClick={() => setError('')} className="text-[12px] text-[var(--accent)] hover:underline">Dismiss</button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-5 py-4 space-y-3">
        <button
          onClick={scanning ? stop : start}
          className={`w-full h-9 flex items-center justify-center gap-2 text-[13px] font-semibold rounded-lg transition-all
            ${scanning
              ? 'text-red-400 border border-red-400/25 bg-red-400/10 hover:bg-red-400/20'
              : 'text-white bg-[#1f6feb] hover:bg-[#1a5fd4]'}`}>
          {scanning ? <><CameraOff size={14} /> Stop</> : <><Camera size={14} /> Start Scanning</>}
        </button>

        <p className="text-[11px] text-[#3a404f] text-center">
          {scanning ? 'Align barcode within the frame — it will scan automatically' : 'Press start to activate the camera'}
        </p>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-80px); opacity: 0; }
          10%, 90%  { opacity: 1; }
          50%       { transform: translateY(80px); }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;