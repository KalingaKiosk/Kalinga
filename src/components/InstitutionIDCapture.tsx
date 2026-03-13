'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { createWorker, Worker } from 'tesseract.js';

interface InstitutionIDCaptureProps {
  role: 'student' | 'employee';
  onSubmit: (data: { id: string; name: string; allergies: string }) => void;
  onBack: () => void;
}

type Mode = 'choose' | 'camera' | 'manual';

export default function InstitutionIDCapture({ role, onSubmit, onBack }: InstitutionIDCaptureProps) {

  const [mode, setMode] = useState<Mode>('choose');
  const [institutionId, setInstitutionId] = useState('');
  const [name, setName] = useState('');
  const [allergies, setAllergies] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const webcamRef = useRef<Webcam>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const roleLabel = role === 'student' ? 'Student' : 'Employee';

  /* Initialize OCR worker once */
  useEffect(() => {

    const initWorker = async () => {

      const worker = await createWorker('eng');

      await worker.setParameters({
        tessedit_char_whitelist: '0123456789-',
        tessedit_pageseg_mode: '6'
      });

      workerRef.current = worker;
    };

    initWorker();

    return () => {
      workerRef.current?.terminate();
    };

  }, []);

  /* Detect ID format XX-XXXX-XXX */
  const extractID = (text: string): string | null => {
    const match = text.match(/\d{2}-\d{4}-\d{3}/);
    return match ? match[0] : null;
  };

  /* Live OCR preview (grayscale frame) */
  useEffect(() => {

    const interval = setInterval(() => {

      if (!webcamRef.current || !previewCanvasRef.current) return;

      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) return;

      const img = new Image();
      img.src = screenshot;

      img.onload = () => {

        const canvas = previewCanvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = img.width;
        const height = img.height;

        const roiWidth = width * 0.5;
        const roiHeight = height * 0.18;
        const roiX = (width - roiWidth) / 2;
        const roiY = (height - roiHeight) / 2;

        canvas.width = roiWidth;
        canvas.height = roiHeight;

        ctx.drawImage(
          img,
          roiX,
          roiY,
          roiWidth,
          roiHeight,
          0,
          0,
          roiWidth,
          roiHeight
        );

        const imageData = ctx.getImageData(0, 0, roiWidth, roiHeight);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {

          const gray =
            0.299 * data[i] +
            0.587 * data[i + 1] +
            0.114 * data[i + 2];

          const value = gray > 140 ? 255 : 0;

          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;

        }

        ctx.putImageData(imageData, 0, 0);

      };

    }, 200);

    return () => clearInterval(interval);

  }, []);

  /* Capture and run OCR */
  const captureAndScan = useCallback(async () => {

    if (!webcamRef.current || !workerRef.current) return;

    const screenshot = webcamRef.current.getScreenshot();

    if (!screenshot) {
      setError("Failed to capture image.");
      return;
    }

    setScanning(true);
    setError('');

    try {

      const img = new Image();
      img.src = screenshot;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas error");

      const width = img.width;
      const height = img.height;

      const roiWidth = width * 0.5;
      const roiHeight = height * 0.18;
      const roiX = (width - roiWidth) / 2;
      const roiY = (height - roiHeight) / 2;

      canvas.width = roiWidth;
      canvas.height = roiHeight;

      ctx.drawImage(
        img,
        roiX,
        roiY,
        roiWidth,
        roiHeight,
        0,
        0,
        roiWidth,
        roiHeight
      );

      const imageData = ctx.getImageData(0, 0, roiWidth, roiHeight);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {

        const gray =
          0.299 * data[i] +
          0.587 * data[i + 1] +
          0.114 * data[i + 2];

        const value = gray > 140 ? 255 : 0;

        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;

      }

      ctx.putImageData(imageData, 0, 0);

      const processed = canvas.toDataURL("image/png");

      const { data: { text } } =
        await workerRef.current.recognize(processed);

      const extracted = extractID(text);

      if (extracted) {
        setInstitutionId(extracted);
        setMode('manual');
      } else {
        setError("ID not detected. Try again.");
      }

    } catch {
      setError("OCR failed.");
    } finally {
      setScanning(false);
    }

  }, []);

  const handleSubmit = () => {

    if (!institutionId) {
      setError("Invalid ID");
      return;
    }

    if (!name.trim()) {
      setError("Enter member name");
      return;
    }

    onSubmit({
      id: institutionId,
      name: name.trim(),
      allergies: allergies.trim()
    });

  };

  return (

    <div className="flex min-h-screen flex-col bg-gray-50">

      <div
        className="px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}
      >

        <button
          onClick={mode === 'choose' ? onBack : () => setMode('choose')}
          className="mb-2 text-blue-300 hover:text-white"
        >
          Back
        </button>

        <h1 className="text-2xl font-bold text-white">
          {roleLabel} Identification
        </h1>

      </div>

      <div className="flex-1 px-6 py-6">

        <div className="mx-auto max-w-md">

          {mode === 'choose' && (

            <div className="space-y-4">

              <button
                onClick={() => setMode('camera')}
                className="w-full rounded-xl bg-white p-5 shadow"
              >
                Scan ID Card
              </button>

              <button
                onClick={() => setMode('manual')}
                className="w-full rounded-xl bg-white p-5 shadow"
              >
                Enter Manually
              </button>

            </div>
          )}

          {mode === 'camera' && (

            <div className="space-y-4">

              <div className="relative rounded-xl overflow-hidden bg-black">

                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                  }}
                  className="w-full"
                />

                {/* guide box */}
                <div
                  className="absolute border-4 border-green-400"
                  style={{
                    width: "60%",
                    height: "20%",
                    top: "40%",
                    left: "20%"
                  }}
                />

              </div>

              <button
                onClick={captureAndScan}
                disabled={scanning}
                className="w-full rounded-xl py-4 text-white"
                style={{ background: '#1a1a4e' }}
              >
                {scanning ? "Scanning..." : "Capture & Scan"}
              </button>

              {/* OCR preview */}
              <canvas
                ref={previewCanvasRef}
                className="w-full rounded-xl border"
              />

            </div>
          )}

          {mode === 'manual' && (

            <div className="space-y-4">

              <input
                value={institutionId}
                onChange={(e)=>setInstitutionId(e.target.value)}
                placeholder="XX-XXXX-XXX"
                className="w-full rounded-xl border px-4 py-3 text-center"
              />

              <input
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Member Name"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                value={allergies}
                onChange={(e)=>setAllergies(e.target.value)}
                placeholder="Known Allergies"
                className="w-full rounded-xl border px-4 py-3"
              />

            </div>
          )}

          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}

        </div>

      </div>

      {mode === 'manual' && (

        <div className="border-t bg-white px-6 py-4">

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl py-4 text-white"
            style={{ background: '#1a1a4e' }}
          >
            Continue
          </button>

        </div>

      )}

    </div>
  );
}
