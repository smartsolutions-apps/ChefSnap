import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ICONS } from '../constants';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  isAnalyzing: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      console.error("Camera access denied:", err);
      setError('Unable to access camera. Please upload a photo instead.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        stopCamera(); // Ensure camera stops if uploading while stream is active
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmImage = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 p-4 md:p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-100 bg-white">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">What's in your fridge?</h2>
          <p className="text-slate-500 text-sm">Snap a photo to find recipes instantly.</p>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-[3/4] bg-slate-900 flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : !stream ? (
             <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                <div className="bg-slate-800 p-4 rounded-full">
                  {ICONS.Camera}
                </div>
                {error ? (
                  <p className="text-red-400 text-sm">{error}</p>
                ) : (
                  <p className="text-sm">Camera is off</p>
                )}
                <button 
                  onClick={startCamera}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Start Camera
                </button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or</span></div>
                </div>
                <label className="cursor-pointer px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-colors border border-slate-600">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
             </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover transform scale-x-[-1]" /* Mirror effect */
            />
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Grid (Visual Polish) */}
          {!capturedImage && stream && (
            <div className="absolute inset-0 pointer-events-none opacity-20">
               <div className="w-full h-full border-[20px] border-black/30"></div>
               <div className="absolute top-1/3 left-0 w-full h-px bg-white/50"></div>
               <div className="absolute top-2/3 left-0 w-full h-px bg-white/50"></div>
               <div className="absolute left-1/3 top-0 h-full w-px bg-white/50"></div>
               <div className="absolute left-2/3 top-0 h-full w-px bg-white/50"></div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-white space-y-3">
          {capturedImage ? (
            <div className="flex space-x-3">
              <button 
                onClick={retake}
                disabled={isAnalyzing}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Retake
              </button>
              <button 
                onClick={confirmImage}
                disabled={isAnalyzing}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-70 flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze Fridge</span>
                )}
              </button>
            </div>
          ) : stream ? (
            <div className="flex items-center justify-around w-full">
              <label className="p-3 bg-slate-100 rounded-full text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors shadow-sm" title="Upload Photo">
                 <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                 {ICONS.Image}
              </label>

              <button 
                onClick={handleCapture}
                className="w-20 h-20 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center hover:border-slate-200 transition-all shadow-sm active:scale-95 group"
              >
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center p-1 group-active:scale-95 transition-transform">
                  <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                </div>
              </button>
              
              {/* Spacer to keep shutter centered */}
              <div className="w-12"></div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};