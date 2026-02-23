
import React from 'react';
import { Loader2, FileText, Scissors, Cpu, Save } from 'lucide-react';

const PipelineOverlay: React.FC<{ stage: string }> = ({ stage }) => {
  const stages = [
    { name: 'Extracting Text', icon: FileText, color: 'text-blue-400' },
    { name: 'Chunking Document', icon: Scissors, color: 'text-purple-400' },
    { name: 'Generating Embeddings', icon: Cpu, color: 'text-emerald-400' },
    { name: 'Updating Vector Store', icon: Save, color: 'text-amber-400' }
  ];

  const activeIndex = stages.findIndex(s => s.name === stage);

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-white">RAG Indexing Pipeline</h3>
          <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        </div>

        <div className="space-y-6">
          {stages.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < activeIndex;
            const isActive = i === activeIndex;

            return (
              <div key={s.name} className="flex items-center gap-4 transition-all duration-500">
                <div className={`p-3 rounded-xl border transition-all ${
                  isActive ? 'bg-slate-800 border-slate-600 ring-2 ring-emerald-500/50' : 
                  isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-950 border-slate-900'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isActive ? s.color : 
                    isCompleted ? 'text-emerald-500' : 'text-slate-700'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${isActive ? 'text-white' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                      {s.name}
                    </p>
                    {isCompleted && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>}
                  </div>
                  <div className="mt-2 w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${
                      isActive ? 'w-1/2 bg-emerald-500 animate-pulse' : 
                      isCompleted ? 'w-full bg-emerald-600' : 'w-0'
                    }`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-500 font-medium">
          Semantic vectors are being generated for semantic search...
        </p>
      </div>
    </div>
  );
};

export default PipelineOverlay;
