import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  const startScanning = async () => {
    try {
      setError('');
      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      console.error('Scanner error:', err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Barcode Scanner</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div id="barcode-scanner" className="w-full max-w-md mx-auto border-2 border-gray-200 rounded-lg overflow-hidden"></div>
        
        <div className="flex gap-3 justify-center">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Camera size={20} />
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <CameraOff size={20} />
              Stop Scanning
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600 text-center">
          Position the barcode within the frame to scan
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
