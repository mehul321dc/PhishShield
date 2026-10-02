import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Upload,
  Camera,
  CameraOff,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Wifi,
  Sparkles,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import jsQR from 'jsqr';
import ScanResult from './ScanResult';

export default function QrScanner({ onScanComplete }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrResult, setQrResult] = useState(null);

  // Sample QRs from server
  const [sampleQrs, setSampleQrs] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Camera scanner states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Fetch sample QRs on mount
  useEffect(() => {
    fetchSampleQrs();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchSampleQrs = async () => {
    try {
      setLoadingSamples(true);
      const res = await fetch('/api/samples');
      const json = await res.json();
      if (json.success && json.samples) {
        setSampleQrs(json.samples);
      }
    } catch (err) {
      console.error('Failed to load sample QRs:', err);
    } finally {
      setLoadingSamples(false);
    }
  };

  // Handle file drop / select
  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    setError(null);
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Automatically trigger scanning
    scanQrFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Send file to server for QR decoding & phishing check
  const scanQrFile = async (file) => {
    setIsLoading(true);
    setError(null);
    setQrResult(null);

    const formData = new FormData();
    formData.append('qrImage', file);

    try {
      const res = await fetch('/api/scan-qr', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to detect or analyze QR code.');
      }

      setQrResult(json.data);
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (err) {
      setError(err.message || 'Error processing QR code image.');
    } finally {
      setIsLoading(false);
    }
  };

  // Test with pre-made sample QR
  const handleSampleClick = async (sample) => {
    setError(null);
    setQrResult(null);
    setIsLoading(true);
    setPreviewUrl(sample.dataUrl);

    try {
      // Send base64 image data to server
      const res = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: sample.dataUrl })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to decode sample QR');
      }

      setQrResult(json.data);
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Camera QR Scanner Handlers ---
  const startCamera = async () => {
    setCameraError(null);
    setError(null);
    setQrResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        requestAnimationFrame(tickCamera);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsCameraActive(false);
  };

  const tickCamera = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (canvas) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          // QR detected!
          stopCamera();
          // Send detected text/url for analysis
          processDecodedQrString(code.data);
          return;
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(tickCamera);
  };

  const processDecodedQrString = async (qrString) => {
    setIsLoading(true);
    setError(null);

    try {
      const isUrl = /^https?:\/\//i.test(qrString) || /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(qrString);

      if (isUrl) {
        const res = await fetch('/api/scan-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: qrString })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);

        setQrResult({
          qrContent: qrString,
          isUrl: true,
          analysis: json.data
        });
      } else {
        setQrResult({
          qrContent: qrString,
          isUrl: false,
          analysis: {
            isValid: false,
            isNonUrlPayload: true,
            verdict: 'SAFE',
            verdictText: 'Plain Text QR Code',
            riskScore: 0,
            flags: [
              {
                severity: 'INFO',
                title: 'Decoded Non-URL Content',
                description: `Raw QR contents: "${qrString}"`,
                recommendation: 'Does not contain a web URL.'
              }
            ]
          }
        });
      }

      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.message || 'Failed to inspect decoded QR link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Header Box */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-5 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/50 text-indigo-400 text-xs font-mono">
            <QrCode className="w-3.5 h-3.5" />
            <span>Anti-Quishing QR Code Threat Scanner</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Scan & Decode QR Codes for Quishing Traps
          </h2>

          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            "Quishing" (QR Phishing) hides dangerous phishing links inside QR codes to bypass enterprise email security and security scanners. Upload or scan any QR code below.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image File</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live WebCam Scanner</span>
            </button>
          </div>

          {/* Mode 1: File Upload & Drag-and-Drop */}
          {activeTab === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="mt-4 border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl p-6 md:p-8 transition-all bg-slate-950/50 hover:bg-slate-950/80 flex flex-col items-center justify-center cursor-pointer group"
              onClick={() => document.getElementById('qr-file-input').click()}
            >
              <input
                id="qr-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />

              <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-lg">
                <Upload className="w-7 h-7" />
              </div>

              <span className="text-white font-semibold text-sm md:text-base">
                Click to browse or drag & drop QR code image
              </span>
              <span className="text-slate-500 text-xs mt-1 font-mono">
                Supports PNG, JPG, JPEG, WEBP, SVG
              </span>

              {previewUrl && (
                <div className="mt-4 p-2 bg-slate-900 rounded-xl border border-slate-700 inline-flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Scanned QR preview"
                    className="w-16 h-16 object-contain rounded-lg border border-slate-800 bg-white"
                  />
                  <div className="text-left text-xs font-mono">
                    <span className="text-indigo-400 font-bold block">Loaded Image</span>
                    <span className="text-slate-400 truncate max-w-[200px] block">
                      {selectedFile ? selectedFile.name : 'Sample QR Image'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Live Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden bg-black border border-slate-700">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Crosshairs & Target viewfinder */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-indigo-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative animate-pulse">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                    </div>
                  </div>
                )}

                {!isCameraActive && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-3 text-red-400 text-xs font-mono">
                  {cameraError}
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                {isCameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-700 text-red-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Restart Camera</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Pre-Generated Test QR Cards */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant Test QR Codes (Click any to test without phone):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
              {sampleQrs.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSampleClick(sample)}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <img
                      src={sample.dataUrl}
                      alt={sample.name}
                      className="w-12 h-12 rounded-lg bg-white p-0.5 border border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sample.type}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">
                        {sample.name}
                      </h4>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {sample.description}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-indigo-400 group-hover:underline flex items-center gap-1">
                    <span>Click to Scan</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-sm flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Scanning Radar View */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-indigo-800/40 text-center space-y-3 animate-pulse">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
            <div className="w-12 h-12 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <QrCode className="w-6 h-6 text-indigo-400 absolute" />
          </div>
          <h3 className="text-base font-bold text-white">Extracting QR Pixel Matrix & Inspecting Payload</h3>
          <p className="text-xs font-mono text-indigo-400">
            Decoding barcode, validating destination, detecting obfuscated quishing redirects...
          </p>
        </div>
      )}

      {/* QR Decoded Information & Phishing Result */}
      {qrResult && !isLoading && (
        <div className="space-y-6">
          {/* Decoded QR Header Banner */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400">Decoded QR Content:</span>
              <span className="text-cyan-300 font-bold break-all">{qrResult.qrContent}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Payload Type: {qrResult.isUrl ? 'Web Link' : 'Plain Text / Config'}
              </span>
            </div>
          </div>

          {/* Full Phishing Analysis */}
          {qrResult.analysis && (
            <ScanResult result={qrResult.analysis} source="QR CODE" />
          )}
        </div>
      )}
    </div>
  );
}
