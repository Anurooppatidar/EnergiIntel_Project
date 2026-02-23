
import React, { useState, useEffect } from 'react';
import { EnergyDocument, Message, ChatSession, AppSettings } from './types';
import { extractTextFromPdf } from './utils/pdfProcessor';
import { generateRAGResponse } from './services/geminiService';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import DocumentViewer from './components/DocumentViewer';
import PipelineOverlay from './components/PipelineOverlay';
import { Zap, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<EnergyDocument[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    backendUrl: 'http://localhost:8000',
    chunkSize: 1000,
    chunkOverlap: 200
  });
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [indexedCount, setIndexedCount] = useState<number>(0);
  const [activeSession, setActiveSession] = useState<ChatSession>({
    id: 'default',
    title: 'New Investigation',
    messages: [],
    documentIds: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Periodically check if backend is alive and get stats
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${settings.backendUrl}/health`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          setBackendOnline(true);
          setIndexedCount(data.vector_store_active ? (data.chunks_indexed || 0) : 0);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, [settings.backendUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStage('Extracting Text');
        let content = '';

        // Use a clone for client-side extraction so the original file is intact for backend upload
        const fileForUpload = file.type === 'application/pdf' ? new File([file.slice(0, file.size)], file.name, { type: file.type }) : file;
        if (file.type === 'application/pdf') {
          try {
            content = await extractTextFromPdf(fileForUpload);
          } catch (pdfErr: any) {
            throw new Error(`PDF read failed: ${pdfErr.message || 'Could not extract text.'}`);
          }
        } else {
          content = await file.text();
        }

        // Sync with backend when available (send original file so it is not consumed)
        if (backendOnline) {
          setProcessingStage('Syncing with FAISS');
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch(`${settings.backendUrl}/upload`, {
            method: 'POST',
            body: formData
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(`Backend sync failed: ${err.detail || 'Unknown error'}`);
          }
          const uploadData = await uploadRes.json();
          console.log("Backend indexed:", uploadData);
        } else {
          setProcessingStage('Preparing for browser Q&A');
          await new Promise(r => setTimeout(r, 400));
        }

        const newDoc: EnergyDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          content: content,
          uploadDate: Date.now(),
          status: 'indexed'
        };

        setDocuments(prev => [...prev, newDoc]);
        setActiveSession(prev => ({
          ...prev,
          documentIds: [...prev.documentIds, newDoc.id]
        }));
      }
    } catch (err: any) {
      console.error("Upload failed", err);
      alert(err.message || "Failed to process document.");
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  };

  const performDirectQuery = async (text: string, currentMessages: Message[]) => {
    const sessionDocs = documents.filter(d => activeSession.documentIds.includes(d.id));
    const fullContext = sessionDocs.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n');
    // Trim context to keep browser-side calls fast
    const safeContext = fullContext.slice(0, 400000); 
    
    const responseText = await generateRAGResponse(
      text,
      safeContext,
      // Use only the last few turns to reduce token usage
      currentMessages.slice(-4).map(m => ({ role: m.role, content: m.content }))
    );
    return { responseText, sources: sessionDocs.map(d => d.name) };
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...activeSession.messages, userMsg];
    setActiveSession(prev => ({ ...prev, messages: newMessages }));
    setIsProcessing(true);

    try {
      let responseText = "";
      let sources: string[] = [];

      // Use backend when available, otherwise answer from browser-loaded documents
      try {
        const res = await fetch(`${settings.backendUrl}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, session_id: activeSession.id }),
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          const data = await res.json();
          responseText = data.answer;
          sources = data.sources || [];
        } else throw new Error((await res.json()).detail || "Backend query failed");
      } catch {
        const fallback = await performDirectQuery(text, newMessages);
        responseText = fallback.responseText;
        sources = fallback.sources;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        sources: sources
      };

      setActiveSession(prev => ({
        ...prev,
        messages: [...prev.messages, userMsg, aiMsg]
      }));
    } catch (err: any) {
      console.error("Inference Error:", err);
      const aiErrorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `### ⚠️ System Error\n\n${err.message || "Failed to generate response."}`,
        timestamp: Date.now(),
      };
      setActiveSession(prev => ({ ...prev, messages: [...prev.messages, userMsg, aiErrorMsg] }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar 
        documents={documents} 
        onUpload={handleFileUpload} 
        onRemove={(id) => setDocuments(d => d.filter(x => x.id !== id))}
        onSelectDoc={setSelectedDocId}
        isProcessing={isProcessing}
        backendStatus={backendOnline ? 'online' : 'offline'}
        vectorCount={indexedCount}
      />

      <main className="flex-1 flex flex-col min-w-0 border-l border-slate-800">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight leading-none">EnergiIntel RAG</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Vector Intelligence System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3" />
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <ChatArea 
            messages={activeSession.messages} 
            onSendMessage={handleSendMessage} 
            isProcessing={isProcessing}
            hasDocs={documents.length > 0}
          />
          
          {selectedDocId && (
            <DocumentViewer 
              document={documents.find(d => d.id === selectedDocId)} 
              onClose={() => setSelectedDocId(null)} 
            />
          )}

          {processingStage && (
            <PipelineOverlay stage={processingStage} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
