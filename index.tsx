
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Cpu, ChevronDown, Zap, Save, RotateCcw, RotateCw, 
  Database, Download, Package, Upload, Link, 
  Maximize2, Minimize2, RefreshCw, Microchip,
  Trash2, FolderOpen, Box, Image as ImageIcon, 
  Sun, Search, Plus, ExternalLink, Loader2, Sparkles
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
interface Snippet {
    id: string;
    title: string;
    code: string;
    timestamp: number;
}

interface Interaction {
    prompt: string;
    timestamp: number;
}

interface SessionMemory {
    preferences: string[];
    interactionCount: number;
}

interface Asset {
    id: string;
    name: string;
    type: 'model' | 'texture' | 'hdri';
    url: string;
    thumbnail: string;
    license: string;
    author: string;
    localData?: string;
}

// --- SERVICES ---
const MEMORY_KEY = 'html-ai-session-memory';

const getSessionMemory = (): SessionMemory => {
    const saved = localStorage.getItem(MEMORY_KEY);
    return saved ? JSON.parse(saved) : { preferences: [], interactionCount: 0 };
};

const updateSessionMemory = (newPreferences: string[]) => {
    const memory = getSessionMemory();
    memory.preferences = Array.from(new Set([...memory.preferences, ...newPreferences])).slice(-10);
    memory.interactionCount += 1;
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
};

const generateCode = async (
    prompt: string, 
    currentCode: string, 
    modelType: string = 'gemini-3-flash-preview',
    history: Interaction[] = []
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const memory = getSessionMemory();
    
    const contextHistory = history.slice(-5).map(h => `- ${h.prompt}`).join('\n');
    const learnedDirectives = memory.preferences.length > 0 
        ? `LEARNED USER PREFERENCES (Prioritize these): ${memory.preferences.join(', ')}` 
        : '';

    const systemInstruction = `You are a world-class 3D Game Architect and UI Engineer.
    
    Current Intelligence Level: ${modelType.includes('pro') ? 'GOD_MODE' : 'Standard'}.
    Session Depth: ${memory.interactionCount} interactions.
    ${learnedDirectives}

    CORE OBJECTIVES:
    1. Produce high-performance Three.js code using CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
    2. Optimize for Android/Mobile: 'touch-action: none', responsive canvas, joystick/tap controls.
    3. Memory Persistence: You are continuing a project. Respect the previous architectural choices while improving them.
    4. NO PLACEHOLDERS. Return full, functional HTML/JS.

    RECENT SESSION HISTORY:
    ${contextHistory}
    `;

    const config: any = {
        systemInstruction,
        temperature: 0.7,
    };

    if (modelType.includes('pro')) {
        config.thinkingConfig = { thinkingBudget: 4000 };
    }

    const response = await ai.models.generateContent({
      model: modelType,
      contents: [
        {
            role: 'user',
            parts: [{ text: `CONTEXT:\n${currentCode}\n\nNEW TASK:\n${prompt}` }]
        }
      ],
      config
    });

    let text = response.text || '';
    text = text.replace(/```html/g, '').replace(/```/g, '').trim();

    // Learning phase (non-blocking)
    ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify 1-2 core stylistic or technical preferences in this prompt: "${prompt}". Return as a JSON array of strings, e.g. ["neon aesthetics", "arcade physics"]. Provide ONLY the array.`,
        config: { responseMimeType: 'application/json' }
    }).then(learningResponse => {
        try {
            const newPrefs = JSON.parse(learningResponse.text || '[]');
            if (Array.isArray(newPrefs)) updateSessionMemory(newPrefs);
        } catch (e) { /* ignore */ }
    }).catch(() => {});

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

const searchAssets = async (query: string): Promise<Asset[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Find 5 free-to-use 3D assets (GLB models, HDR maps) for: "${query}". 
    Return as raw JSON array of Asset objects with fields: id, name, type, url, thumbnail, license, author.
    Provide ONLY JSON. No markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || '[]';
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    return [];
  }
};

// --- COMPONENTS ---

const Header: React.FC<{ modelType: string; onModelChange: (m: string) => void }> = ({ modelType, onModelChange }) => {
    const [interactionCount, setInteractionCount] = useState(0);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            const memory = localStorage.getItem(MEMORY_KEY);
            if (memory) setInteractionCount(JSON.parse(memory).interactionCount);
            
            if ((window as any).aistudio?.hasSelectedApiKey) {
                const selected = await (window as any).aistudio.hasSelectedApiKey();
                setHasKey(selected);
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleKeySelect = async () => {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setHasKey(true); // Assume success per race condition handling rules
        }
    };

    return (
        <div className="flex justify-between items-start mb-6 select-none flex-wrap gap-4">
            <div className="relative">
                <div className="text-[50px] md:text-[80px] font-black italic leading-[0.8] tracking-[-5px] bg-gradient-to-b from-blue-800 to-blue-500 text-transparent bg-clip-text">
                    HTML
                </div>
                <div className="absolute -bottom-2 left-0 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 border border-slate-800 rounded-full">
                    <Zap size={10} className="text-highlightCyan animate-pulse" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                        NEURAL SYNC: {interactionCount > 0 ? `LEVEL ${Math.floor(interactionCount/5) + 1}` : 'INITIALIZING'}
                    </span>
                </div>
            </div>
            
            <div className="flex gap-4 items-start ml-auto">
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1">
                        Intelligence Core
                    </div>
                    <div className="relative inline-flex items-center group">
                        <select 
                            value={modelType}
                            onChange={(e) => onModelChange(e.target.value)}
                            className="appearance-none bg-darkPanel border border-slate-800 text-slate-400 text-[10px] font-bold px-3 py-2 pr-8 rounded-sm hover:border-highlightCyan transition-colors focus:outline-none cursor-pointer uppercase tracking-wider"
                        >
                            <option value="gemini-3-flash-preview">3.0 Flash (Fast)</option>
                            <option value="gemini-3-pro-preview">3.0 Pro (Smarter)</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 text-slate-600 group-hover:text-highlightCyan pointer-events-none" />
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1">
                        System Status
                    </div>
                    <button 
                        onClick={handleKeySelect}
                        className={`border-2 p-1 bg-transparent w-[45px] h-[45px] relative group transition-colors cursor-pointer ml-auto flex items-center justify-center shadow-lg ${hasKey ? 'border-slate-800 hover:border-highlightCyan' : 'border-red-900 animate-pulse hover:border-red-500'}`}
                        title="Configure API Key"
                    >
                        <div className={`absolute top-1/2 -left-[20px] w-[20px] h-[2px] transition-colors ${hasKey ? 'bg-slate-800 group-hover:bg-highlightCyan' : 'bg-red-900'}`} />
                        <div className="w-full h-full border border-slate-900 flex flex-col items-center justify-center text-[8px] font-bold text-slate-900 bg-slate-800/20 group-hover:bg-highlightCyan/10">
                            <span className={hasKey ? "text-slate-400 group-hover:text-highlightCyan" : "text-red-500"}>{hasKey ? 'KEY' : 'OFF'}</span>
                            <Cpu size={14} className={`${hasKey ? 'text-slate-600 group-hover:text-highlightCyan' : 'text-red-800'} mt-0.5`} />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-darkPanel shadow-lg ${hasKey ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CodeEditor: React.FC<{ code: string; onChange: (v: string) => void; isLoading: boolean }> = ({ code, onChange, isLoading }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onChange(newValue);
            setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + 2; }, 0);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-[400px] relative">
            <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1 flex justify-between">
                <span>CODE EDITOR:/</span>
                {isLoading && <span className="text-highlightCyan animate-pulse">WRITING...</span>}
            </div>
            <div className="flex-grow border border-slate-800 relative bg-darkPanel overflow-hidden rounded-sm">
                <div className="absolute inset-0 bg-grid-pattern bg-[length:25px_25px] opacity-100 pointer-events-none" />
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    className="w-full h-full bg-transparent text-highlightCyan font-mono text-sm p-5 resize-none border-none outline-none relative z-10 placeholder-slate-700 leading-relaxed"
                />
                {isLoading && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-highlightCyan text-xs tracking-widest">
                         <div className="animate-pulse">SYNTHESIZING_CORE...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PreviewFrame: React.FC<{ code: string }> = ({ code }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fullHtml = useMemo(() => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { margin: 0; overflow: hidden; font-family: sans-serif; background: #000; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
            </style>
        </head>
        <body>${code}</body>
        </html>
    `, [code, refreshKey]);

    return (
        <div className={`${isFullScreen ? 'fixed inset-0 z-[100] bg-[#02040a] p-4 md:p-6 flex flex-col' : 'flex flex-col h-full min-h-[300px]'}`}>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">PREVIEW SECTION:/</div>
                    <button onClick={() => setRefreshKey(prev => prev + 1)} className="text-slate-500 hover:text-highlightCyan p-1">
                        <RefreshCw size={12} />
                    </button>
                </div>
                <button onClick={() => setIsFullScreen(!isFullScreen)} className="text-slate-500 hover:text-highlightCyan p-1">
                    {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>
            <div className="flex-grow border border-slate-800 bg-darkPanel overflow-hidden rounded-sm relative">
                <iframe key={refreshKey} srcDoc={fullHtml} className="w-full h-full border-none bg-transparent" sandbox="allow-scripts allow-modals allow-same-origin" />
            </div>
        </div>
    );
};

const PromptBar: React.FC<{ onSubmit: (p: string) => void; isLoading: boolean }> = ({ onSubmit, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const handleSubmit = () => {
        if (!prompt.trim() || isLoading) return;
        onSubmit(prompt);
        setPrompt('');
    };
    return (
        <div>
            <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1">INTELLIGENCE:/</div>
            <div className="bg-promptTeal border-[2px] border-black p-3 md:p-4 flex items-center justify-between gap-4 focus-within:ring-2 focus-within:ring-highlightCyan">
                <input 
                    type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoComplete="off" disabled={isLoading}
                    className="bg-transparent border-none outline-none text-black/60 text-[24px] md:text-[38px] font-black italic w-full uppercase tracking-tighter disabled:opacity-50"
                />
                <button onClick={handleSubmit} disabled={isLoading} className="bg-transparent border-[2px] border-black w-[45px] h-[45px] flex-shrink-0 flex items-center justify-center hover:bg-black hover:border-white group transition-all active:scale-95 disabled:opacity-50">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-black group-hover:text-white">AI</span>
                        <Microchip size={18} className="text-black group-hover:text-highlightCyan" />
                    </div>
                </button>
            </div>
        </div>
    );
};

const DataBank: React.FC<{ isOpen: boolean; snippets: Snippet[]; onLoad: (c: string) => void; onDelete: (id: string) => void; onClose: () => void }> = ({ isOpen, snippets, onLoad, onDelete, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-[#02040a] border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div className="text-[20px] font-black italic text-highlightCyan tracking-tighter">DATA BANK</div>
                <button onClick={onClose} className="text-slate-500 hover:text-white uppercase text-xs font-bold tracking-widest">[CLOSE]</button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-3">
                {snippets.length === 0 ? <div className="text-slate-600 text-sm font-mono text-center mt-10">// MEMORY EMPTY</div> : 
                    snippets.map(snippet => (
                        <div key={snippet.id} className="border border-slate-800 p-3 bg-slate-900/50 hover:border-highlightCyan group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-300 text-sm truncate pr-2">{snippet.title}</h3>
                                <button onClick={() => onDelete(snippet.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                            <button onClick={() => onLoad(snippet.code)} className="w-full bg-slate-800 hover:bg-highlightCyan hover:text-black text-highlightCyan text-xs font-bold py-2 px-2 flex items-center justify-center gap-2 uppercase">
                                <FolderOpen size={12} /> Load Data
                            </button>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

const AssetHub: React.FC<{ isOpen: boolean; onClose: () => void; onImport: (a: Asset) => void }> = ({ isOpen, onClose, onImport }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Asset[]>([]);

    if (!isOpen) return null;

    const handleSearch = async () => {
        setIsSearching(true);
        try { setResults(await searchAssets(query)); } finally { setIsSearching(false); }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-[#02040a] border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="text-[24px] font-black italic text-highlightCyan tracking-tighter">ASSET HUB</div>
                <button onClick={onClose} className="text-slate-500 hover:text-white uppercase text-xs font-bold tracking-widest border border-slate-800 px-2 py-1 hover:border-highlightCyan">[EXIT]</button>
            </div>
            <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                    <input type="text" placeholder="SEARCH GLOBAL DATABASE..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-slate-900 border border-slate-800 py-2 px-4 text-xs font-mono text-highlightCyan focus:border-highlightCyan" />
                    <button onClick={handleSearch} disabled={isSearching} className="bg-highlightCyan/10 border border-highlightCyan/40 p-2 text-highlightCyan">
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4">
                {results.map(asset => (
                    <div key={asset.id} className="border border-slate-800 bg-slate-900/40 p-3 hover:border-highlightCyan">
                        <div className="h-24 bg-black mb-3 overflow-hidden">
                            <img src={asset.thumbnail} className="w-full h-full object-cover opacity-60" />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2">{asset.name}</h4>
                        <button onClick={() => onImport(asset)} className="w-full bg-slate-800 hover:bg-highlightCyan hover:text-black text-highlightCyan text-[11px] font-black py-2 uppercase">Import</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- APP ROOT ---

const App: React.FC = () => {
    const [history, setHistory] = useState<string[]>(['']);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [interactionHistory, setInteractionHistory] = useState<Interaction[]>([]);
    const [modelType, setModelType] = useState('gemini-3-flash-preview');
    const [isLoading, setIsLoading] = useState(false);
    const [isDataBankOpen, setIsDataBankOpen] = useState(false);
    const [isAssetHubOpen, setIsAssetHubOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('html-ai-databank');
        if (saved) setSnippets(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('html-ai-databank', JSON.stringify(snippets));
    }, [snippets]);

    const currentCode = history[currentIndex];

    const handleCodeChange = (newCode: string) => {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newCode);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    };

    const handlePromptSubmit = async (prompt: string, assetToInject?: Asset) => {
        // Validation check for key
        const hasKey = (window as any).aistudio?.hasSelectedApiKey ? await (window as any).aistudio.hasSelectedApiKey() : true;
        if (!hasKey) {
            if ((window as any).aistudio?.openSelectKey) {
                await (window as any).aistudio.openSelectKey();
            } else {
                alert("SYSTEM ERROR: NO API KEY CONFIGURED.");
                return;
            }
        }

        setIsLoading(true);
        setInteractionHistory(prev => [...prev, { prompt, timestamp: Date.now() }]);
        try {
            let enhancedPrompt = prompt;
            if (assetToInject) enhancedPrompt = `Integrate this asset: ${assetToInject.name} from ${assetToInject.url}. ${prompt}`;
            const generated = await generateCode(enhancedPrompt, currentCode, modelType, interactionHistory);
            handleCodeChange(generated);
        } catch (error: any) {
            if (error.message?.includes("Requested entity was not found")) {
                await (window as any).aistudio?.openSelectKey?.();
            }
            alert("COMMUNICATION ERROR: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className={`min-h-screen p-4 md:p-6 flex flex-col font-sans max-w-[1600px] mx-auto transition-all ${isDragging ? 'scale-[0.99] grayscale-[0.5]' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file?.name.endsWith('.html')) {
                    const r = new FileReader();
                    r.onload = (ev) => handleCodeChange(ev.target?.result as string);
                    r.readAsText(file);
                }
            }}
        >
            {isDragging && (
                <div className="fixed inset-0 z-[200] bg-highlightCyan/10 backdrop-blur-sm border-[8px] border-dashed border-highlightCyan pointer-events-none flex flex-col items-center justify-center animate-pulse">
                    <Link size={80} className="text-highlightCyan mb-4" />
                    <div className="text-[40px] font-black italic text-highlightCyan tracking-tighter uppercase">Neural Link Ready</div>
                </div>
            )}

            <Header modelType={modelType} onModelChange={setModelType} />

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                <div className="flex flex-col gap-4">
                    <CodeEditor code={currentCode} onChange={handleCodeChange} isLoading={isLoading} />
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mr-2">CONTROLS:/</div>
                        <button onClick={() => currentIndex > 0 && setCurrentIndex(v => v - 1)} disabled={currentIndex === 0} className="bg-slate-900 border border-slate-700 text-slate-400 p-2 hover:text-highlightCyan disabled:opacity-30"><RotateCcw size={16} /></button>
                        <button onClick={() => currentIndex < history.length - 1 && setCurrentIndex(v => v + 1)} disabled={currentIndex === history.length - 1} className="bg-slate-900 border border-slate-700 text-slate-400 p-2 hover:text-highlightCyan disabled:opacity-30"><RotateCw size={16} /></button>
                        <div className="h-4 w-px bg-slate-800 mx-1" />
                        <button onClick={() => {
                            const t = prompt("LABEL:");
                            if(t) setSnippets(p => [{id: Date.now().toString(), title: t, code: currentCode, timestamp: Date.now()}, ...p])
                        }} className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-2 text-xs font-bold hover:text-highlightCyan"><Save size={14} /></button>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-2 text-xs font-bold hover:text-highlightCyan"><Upload size={14} /></button>
                        <input type="file" ref={fileInputRef} onChange={(e) => {
                             const f = e.target.files?.[0];
                             if(f) { const r = new FileReader(); r.onload = (ev) => handleCodeChange(ev.target?.result as string); r.readAsText(f); }
                        }} accept=".html" className="hidden" />
                        <div className="flex gap-2 ml-auto">
                            <button onClick={() => setIsAssetHubOpen(true)} className="bg-slate-950 border border-highlightCyan/30 text-highlightCyan/70 px-3 py-2 text-xs font-black hover:text-highlightCyan italic"><Package size={14} /> ASSET HUB</button>
                            <button onClick={() => setIsDataBankOpen(true)} className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-2 text-xs font-bold hover:text-highlightCyan"><Database size={14} /> DATA BANK</button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6 h-full">
                    <PromptBar onSubmit={handlePromptSubmit} isLoading={isLoading} />
                    <PreviewFrame code={currentCode} />
                </div>
            </div>

            <DataBank isOpen={isDataBankOpen} snippets={snippets} onLoad={c => {handleCodeChange(c); setIsDataBankOpen(false)}} onDelete={id => setSnippets(p => p.filter(s => s.id !== id))} onClose={() => setIsDataBankOpen(false)} />
            <AssetHub isOpen={isAssetHubOpen} onClose={() => setIsAssetHubOpen(false)} onImport={a => { handlePromptSubmit(`Integrate asset: ${a.name}`, a); setIsAssetHubOpen(false); }} />
            {(isDataBankOpen || isAssetHubOpen) && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-md" onClick={() => {setIsDataBankOpen(false); setIsAssetHubOpen(false);}} />}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
