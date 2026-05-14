import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { getShareUrl } from '../utils/share-url';

interface ShareDialogProps {
  onClose: () => void;
}

export function ShareDialog({ onClose }: ShareDialogProps) {
  const [url, setUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shareUrl = getShareUrl();
    queueMicrotask(() => setUrl(shareUrl));
    QRCode.toDataURL(shareUrl, { width: 200, margin: 2, color: { dark: '#1f2937', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="share-close" onClick={onClose}>✕</button>
        <h2 className="share-title">Share Configuration</h2>

        <div className="share-qr">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" width={200} height={200} />
          ) : (
            <div className="share-qr-placeholder">Generating QR...</div>
          )}
        </div>

        <div className="share-url-row">
          <input
            ref={inputRef}
            className="share-url-input"
            type="text"
            value={url}
            readOnly
            onClick={(e) => e.currentTarget.select()}
          />
          <button className="share-copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <p className="share-hint">
          Share this URL or QR code for others to load your exact robot config, maze, and code.
        </p>
      </div>
    </div>
  );
}
