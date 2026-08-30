'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { ProfileDocument } from '@/types';
import { sound } from '@/lib/sound';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ProfileDocument | null;
  profileId?: string;
  profileName?: string;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  profileId,
  profileName,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !document) return null;

  const docUrl = `/api/documents/${document.id}`;
  const isImage = document.mimeType.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_60px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header Bar */}
        <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                  {document.docType.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  {profileId} {profileName ? `(${profileName})` : ''}
                </span>
              </div>
              <p className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {document.originalName}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-cyan-400 px-1">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            <a
              href={docUrl}
              download={document.originalName}
              onClick={() => sound.playClick()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
              title="Download Document"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Download</span>
            </a>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-950/60 overflow-auto flex items-center justify-center p-4 relative">
          {isImage && (
            <div
              className="transition-transform duration-200 flex items-center justify-center min-w-full min-h-full"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={docUrl}
                alt={document.originalName}
                className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={docUrl}
              title={document.originalName}
              className="w-full h-full rounded-xl border border-slate-800 bg-white"
            />
          )}

          {!isImage && !isPdf && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <FileText className="w-16 h-16 text-cyan-400" />
              <p className="text-sm font-mono">Binary File: {document.mimeType}</p>
              <a
                href={docUrl}
                download={document.originalName}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-medium text-xs font-mono"
              >
                Download to View
              </a>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="h-12 px-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            <span>Type: </span>
            <span className="text-slate-200">{document.mimeType}</span>
            <span className="mx-2">•</span>
            <span>Size: </span>
            <span className="text-slate-200">{(document.sizeBytes / 1024).toFixed(1)} KB</span>
          </div>
          <div className="text-[11px] text-cyan-400">
            CONFIDENTIAL VAULT STREAM
          </div>
        </div>
      </div>
    </div>
  );
}
