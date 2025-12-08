import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-scanner');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        onScan(decodedText);
        scanner.stop();
      },
      () => {}
    );

    return () => {
      if (scannerRef.current?.isScanning) {
        scanner.stop();
      }
    };
  }, [onScan]);

  return (
    <div className="mt-4">
      <div id="barcode-scanner" className="w-full max-w-md mx-auto"></div>
    </div>
  );
};

export default BarcodeScanner;
