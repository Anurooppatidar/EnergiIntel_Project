
import React from 'react';
import { EnergyDocument } from '../types';
import { Upload, FileText, Trash2, BookOpen, AlertCircle, Loader2, Database } from 'lucide-react';

interface SidebarProps {
  documents: EnergyDocument[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onSelectDoc: (id: string) => void;
  isProcessing: boolean;
  backendStatus?: 'online' | 'offline';
  vectorCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  documents, 
  onUpload, 
  onRemove, 
  onSelectDoc, 
  isProcessing,
  backendStatus,
  vectorCount = 0
}) => {
  return (
    <aside className="w-80 flex flex-col bg-slate-900 overflow-hidden">
      <div className="p-4 space-y-4">
        <label className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
            )}
            <p className="text-sm text-slate-400 font-medium">Add Technical Assets</p>
            <p className="text-xs text-slate-500 mt-1">PDF, TXT to Vector Vault</p>
          </div>
          <input type="file" className="hidden" accept=".pdf,.txt" multiple onChange={onUpload} disabled={isProcessing} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Knowledge Assets</h3>
          {backendStatus === 'online' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400">
              <Database className="w-2.5 h-2.5" />
              {vectorCount} CHUNKS
            </div>
          )}
        </div>
        
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <AlertCircle className="w-8 h-8 text-slate-700 mb-3" />
            <p className="text-sm text-slate-500 leading-relaxed">No data indexed. Upload engineering reports to populate the FAISS store.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 transition-all cursor-pointer"
                onClick={() => onSelectDoc(doc.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-slate-700 rounded-md">
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-200 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-500">{(doc.size / 1024).toFixed(1)} KB • Synced</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(doc.id); }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
};

export default Sidebar;
