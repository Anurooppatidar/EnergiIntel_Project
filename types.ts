
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: string[]; // References to document names/chunks
}

export interface EnergyDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadDate: number;
  status: 'processing' | 'indexed' | 'error';
}

export interface AppSettings {
  backendUrl: string;
  chunkSize: number;
  chunkOverlap: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  documentIds: string[];
}
