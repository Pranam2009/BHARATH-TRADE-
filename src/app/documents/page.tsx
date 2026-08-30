'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CreditCard,
  User,
  FileSignature,
  Eye,
  Download,
  Trash2,
  Search,
  Loader2,
  ExternalLink,
  Shield,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import DocumentViewerModal from '@/components/profiles/DocumentViewerModal';
import DeleteModal from '@/components/profiles/DeleteModal';
import { DocumentType, ProfileDocument } from '@/types';
import { formatDate } from '@/lib/formatters';
import { sound } from '@/lib/sound';

interface VaultDocument extends ProfileDocument {
  ownerProfileId: string;
  ownerName: string;
  ownerStatus: string;
}

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDoc, setViewingDoc] = useState<ProfileDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<VaultDocument | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Fetch vault error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    try {
      const res = await fetch(`/api/documents/${deletingDoc.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        sound.playSuccess();
        fetchDocuments();
      }
    } catch (err) {
      console.error('Delete document error:', err);
    }
  };

  const filteredDocuments = documents.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.originalName.toLowerCase().includes(q) ||
      d.ownerProfileId.toLowerCase().includes(q) ||
      d.ownerName.toLowerCase().includes(q) ||
      d.docType.toLowerCase().includes(q)
    );
  });

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'passport_photo': return User;
      case 'aadhaar_front':
      case 'aadhaar_back': return CreditCard;
      case 'pan_card': return FileText;
      case 'signature': return FileSignature;
      default: return FileText;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                CENTRAL REPOSITORY
              </span>
              <span className="text-xs font-mono text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">
                {documents.length} Encrypted Files
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
              Document & Verification Vault
            </h1>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-300">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>AUTHENTICATED STREAMING ONLY</span>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by file name, BT-ID, owner name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-sans"
            />
          </div>

          {/* Type Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'passport_photo', label: 'Passports' },
              { id: 'aadhaar_front', label: 'Aadhaar (F)' },
              { id: 'aadhaar_back', label: 'Aadhaar (B)' },
              { id: 'pan_card', label: 'PAN Cards' },
              { id: 'signature', label: 'Signatures' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setFilterType(t.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
                  filterType === t.id
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs font-mono text-cyan-300">
              Querying Vault Files...
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Documents Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No files match the selected filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocuments.map(doc => {
              const Icon = getDocIcon(doc.docType);

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl p-5 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 backdrop-blur-xl shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Owner Info */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                      <Link
                        href={`/profiles/${doc.ownerProfileId}`}
                        className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 truncate"
                      >
                        <span>{doc.ownerProfileId}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </Link>
                      <span className="text-xs text-slate-400 truncate max-w-[120px]">
                        {doc.ownerName}
                      </span>
                    </div>

                    {/* Doc Title & Icon */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono truncate">
                          {doc.docType.replace('_', ' ')}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                          {doc.originalName}
                        </p>
                      </div>
                    </div>

                    {/* File Meta */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 py-2">
                      <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setViewingDoc(doc);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <a
                      href={`/api/documents/${doc.id}`}
                      download={doc.originalName}
                      onClick={() => sound.playClick()}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playAlert();
                        setDeletingDoc(doc);
                      }}
                      className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 text-xs transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleDeleteConfirm}
        profileId={deletingDoc?.ownerProfileId || ''}
        isDocument={true}
        documentTitle={deletingDoc ? `${deletingDoc.docType.replace('_', ' ').toUpperCase()} (${deletingDoc.originalName})` : ''}
      />
    </AppShell>
  );
}
