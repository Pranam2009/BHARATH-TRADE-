'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Eye,
  Trash2,
  RefreshCw,
  FileCheck,
  CreditCard,
  User,
  FileSignature,
  Loader2,
  FileText,
} from 'lucide-react';
import { DocumentType, ProfileDocument } from '@/types';
import { sound } from '@/lib/sound';
import DocumentViewerModal from './DocumentViewerModal';
import DeleteModal from './DeleteModal';

interface DocumentUploaderProps {
  profileId: string;
  profileName?: string;
  documents?: ProfileDocument[];
  onDocumentsChange?: () => void;
  disabled?: boolean;
}

const DOC_CONFIGS: {
  type: DocumentType;
  title: string;
  description: string;
  icon: typeof CreditCard;
  accept: string;
}[] = [
  {
    type: 'passport_photo',
    title: 'Passport Size Photo',
    description: 'Recent clear portrait photo (JPG/PNG)',
    icon: User,
    accept: 'image/jpeg,image/png,image/webp',
  },
  {
    type: 'aadhaar_front',
    title: 'Aadhaar Card (Front)',
    description: 'Front side with photo & Aadhaar number',
    icon: CreditCard,
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
  },
  {
    type: 'aadhaar_back',
    title: 'Aadhaar Card (Back)',
    description: 'Back side with residential address',
    icon: CreditCard,
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
  },
  {
    type: 'pan_card',
    title: 'PAN Card Photo',
    description: 'Clear image of Permanent Account Number card',
    icon: FileText,
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
  },
  {
    type: 'signature',
    title: 'Signature Photo',
    description: 'Clear specimen signature on white background',
    icon: FileSignature,
    accept: 'image/jpeg,image/png,image/webp',
  },
];

export default function DocumentUploader({
  profileId,
  profileName,
  documents = [],
  onDocumentsChange,
  disabled = false,
}: DocumentUploaderProps) {
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [viewingDoc, setViewingDoc] = useState<ProfileDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<ProfileDocument | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [key in DocumentType]?: HTMLInputElement | null }>({});

  const getDoc = (type: DocumentType) => documents.find(d => d.docType === type);

  const handleFileUpload = async (type: DocumentType, file: File) => {
    sound.playClick();
    setUploadingType(type);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('profileId', profileId);
      formData.append('docType', type);
      formData.append('file', file);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      sound.playSuccess();
      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err: unknown) {
      sound.playAlert();
      setErrorMessage((err as Error).message || 'Failed to upload document');
    } finally {
      setUploadingType(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    try {
      const res = await fetch(`/api/documents/${deletingDoc.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      sound.playSuccess();
      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err: unknown) {
      sound.playAlert();
      setErrorMessage((err as Error).message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs uppercase font-mono tracking-wider hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DOC_CONFIGS.map(config => {
          const doc = getDoc(config.type);
          const isUploading = uploadingType === config.type;
          const Icon = config.icon;

          return (
            <div
              key={config.type}
              className={`
                relative rounded-2xl p-5 backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between
                ${doc
                  ? 'bg-slate-900/80 border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.08)]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }
              `}
            >
              {/* Header of doc card */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        doc
                          ? 'bg-cyan-950/60 border-cyan-400/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {config.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {doc ? `${(doc.sizeBytes / 1024).toFixed(1)} KB` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>

                  {doc && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <FileCheck className="w-3 h-3" />
                      SAVED
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* Upload or View Area */}
              <div>
                {doc ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setViewingDoc(doc);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {!disabled && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              fileInputRefs.current[config.type]?.click();
                            }}
                            disabled={isUploading}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition-colors"
                            title="Replace Document"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin text-cyan-400' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playAlert();
                              setDeletingDoc(doc);
                            }}
                            disabled={isUploading}
                            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-xs transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {!disabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRefs.current[config.type]?.click();
                        }}
                        disabled={isUploading}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 border border-dashed border-slate-700 text-xs font-mono flex items-center justify-center gap-2 transition-all group"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-transform group-hover:-translate-y-0.5" />
                            <span>Upload Document</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="py-2 text-center text-xs font-mono text-slate-500">
                        Optional (Empty)
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={el => {
                    fileInputRefs.current[config.type] = el;
                  }}
                  type="file"
                  accept={config.accept}
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(config.type, file);
                    }
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        profileId={profileId}
        profileName={profileName}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleDeleteConfirm}
        profileId={profileId}
        isDocument={true}
        documentTitle={deletingDoc ? deletingDoc.docType.replace('_', ' ').toUpperCase() : ''}
      />
    </div>
  );
}
