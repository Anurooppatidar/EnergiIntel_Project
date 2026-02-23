
import React from 'react';
import { EnergyDocument } from '../types';
import { X, Search, FileText } from 'lucide-react';

interface DocumentViewerProps {
  document?: EnergyDocument;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  if (!document) return null;

  return (
    <div className="w-[450px] border-l border-slate-800 bg-slate-900 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <header className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 truncate pr-4">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
          <h2 className="font-semibold text-sm text-slate-200 truncate">{document.name}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>
      
      <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input 
            placeholder="Search in document..." 
            className="w-full bg-slate-900 border border-slate-700 text-xs rounded-md py-1.5 pl-8 pr-3 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed text-slate-400 bg-slate-950/30">
        <div className="max-w-none prose prose-invert">
          <p className="whitespace-pre-wrap">{document.content}</p>
        </div>
      </div>

      <footer className="p-4 border-t border-slate-800 bg-slate-900/80 text-[11px] text-slate-500 flex justify-between">
        <span>Type: {document.type.split('/')[1]?.toUpperCase() || 'TXT'}</span>
        <span>Indexed on: {new Date(document.uploadDate).toLocaleDateString()}</span>
      </footer>
    </div>
  );
};

export default DocumentViewer;
