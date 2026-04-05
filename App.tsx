import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import PreviewFrame from './components/PreviewFrame';
import PromptBar from './components/PromptBar';
import DataBank from './components/DataBank';
import AssetHub from './components/AssetHub';
import { generateCode } from './services/geminiService';
import { Snippet, Asset, Interaction } from './types';
import { Save, RotateCcw, RotateCw, Database, Download, Package, Upload, Link } from 'lucide-react';

const App: React.FC = () => {
    const [history, setHistory] = useState<string[]>(['']);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [interactionHistory, setInteractionHistory] = useState<Interaction[]>([]);
    
    const [modelType, setModelType] = useState('gemini-3-flash-preview');
    const [isLoading, setIsLoading] = useState(false);
    const [isDataBankOpen, setIsDataBankOpen] = useState(false);
    const [isAssetHubOpen, setIsAssetHubOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [snippets, setSnippets] = useState<Snippet[]>([]);

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

    const handleUndo = () => currentIndex > 0 && setCurrentIndex(prev => prev - 1);
    const handleRedo = () => currentIndex < history.length - 1 && setCurrentIndex(prev => prev + 1);

    const handlePromptSubmit = async (prompt: string, assetToInject?: Asset) => {
        setIsLoading(true);
        const newInteraction: Interaction = { prompt, timestamp: Date.now() };
        setInteractionHistory(prev => [...prev, newInteraction]);

        try {
            let enhancedPrompt = prompt;
            if (assetToInject) {
                enhancedPrompt = `Integrate this asset: ${assetToInject.name} from ${assetToInject.url}. ${prompt}`;
            }
            
            const generatedCode = await generateCode(enhancedPrompt, currentCode, modelType, interactionHistory);
            handleCodeChange(generatedCode);
        } catch (error) {
            alert("COMMUNICATION ERROR: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHtmlUpload = (event: React.ChangeEvent<HTMLInputElement> | File) => {
        const file = event instanceof File ? event : event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const newContent = e.target?.result as string;
            
            // If there's existing code, we ask AI to merge them instead of just replacing
            if (currentCode && currentCode.trim().length > 0) {
                const mergePrompt = `FUSION TASK: I have dropped a new HTML file. Please intelligently merge its functionality, styles, and scripts into the existing code below. Ensure there are no conflicts and maintain the current scene's integrity.\n\nDROPPED CONTENT:\n${newContent}`;
                await handlePromptSubmit(mergePrompt);
            } else {
                handleCodeChange(newContent);
            }
        };
        reader.readAsText(file);
        if (!(event instanceof File) && fileInputRef.current) fileInputRef.current.value = '';
    };

    // Drag and Drop Handlers
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.html')) {
            handleHtmlUpload(file);
        } else {
            alert("SYSTEM REJECTION: ONLY .HTML FILES ARE COMPATIBLE FOR NEURAL LINK.");
        }
    };

    const handleImportAsset = async (asset: Asset) => {
        setIsAssetHubOpen(false);
        const prompt = asset.localData 
            ? `Load this local model data from the 'LOCAL_OBJ_DATA' variable using OBJLoader.`
            : `Add the ${asset.name} 3D model to the scene.`;
        
        await handlePromptSubmit(prompt, asset);
    };

    return (
        <div 
            className={`min-h-screen p-4 md:p-6 flex flex-col font-sans max-w-[1600px] mx-auto transition-all duration-300 ${isDragging ? 'scale-[0.99] grayscale-[0.5]' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="fixed inset-0 z-[200] bg-highlightCyan/10 backdrop-blur-sm border-[8px] border-dashed border-highlightCyan pointer-events-none flex flex-col items-center justify-center animate-pulse">
                    <Link size={80} className="text-highlightCyan mb-4" />
                    <div className="text-[40px] font-black italic text-highlightCyan tracking-tighter uppercase">Neural Link Ready</div>
                    <div className="text-sm font-bold text-white tracking-[0.3em] uppercase opacity-70">Drop HTML to Integrate</div>
                </div>
            )}

            <Header 
                onOpenSettings={() => (window as any).aistudio?.openSelectKey?.()} 
                modelType={modelType}
                onModelChange={setModelType}
            />

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                <div className="flex flex-col gap-4">
                    <CodeEditor code={currentCode} onChange={handleCodeChange} isLoading={isLoading} />
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mr-2">CONTROLS:/</div>
                        <button onClick={handleUndo} disabled={currentIndex === 0} className="bg-slate-900 border border-slate-700 text-slate-400 p-2 hover:text-highlightCyan hover:border-highlightCyan disabled:opacity-30"><RotateCcw size={16} /></button>
                        <button onClick={handleRedo} disabled={currentIndex === history.length - 1} className="bg-slate-900 border border-slate-700 text-slate-400 p-2 hover:text-highlightCyan hover:border-highlightCyan disabled:opacity-30"><RotateCw size={16} /></button>
                        <div className="h-4 w-px bg-slate-800 mx-1 md:mx-2" />
                        <button onClick={() => {
                            const title = prompt("LABEL:");
                            if(title) setSnippets(prev => [{id: Date.now().toString(), title, code: currentCode, timestamp: Date.now()}, ...prev])
                        }} className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-2 text-xs font-bold hover:text-highlightCyan hover:border-highlightCyan"><Save size={14} /></button>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-2 text-xs font-bold hover:text-highlightCyan hover:border-highlightCyan" title="Manually Import HTML"><Upload size={14} /></button>
                        <input type="file" ref={fileInputRef} onChange={handleHtmlUpload} accept=".html" className="hidden" />
                        <div className="flex gap-2 ml-auto">
                            <button onClick={() => setIsAssetHubOpen(true)} className="bg-slate-950 border border-highlightCyan/30 text-highlightCyan/70 px-3 py-2 text-xs font-black hover:text-highlightCyan hover:border-highlightCyan italic"><Package size={14} /> ASSET HUB</button>
                            <button onClick={() => setIsDataBankOpen(true)} className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-2 text-xs font-bold hover:text-highlightCyan hover:border-highlightCyan"><Database size={14} /> DATA BANK</button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6 h-full">
                    <PromptBar onSubmit={handlePromptSubmit} isLoading={isLoading} />
                    <PreviewFrame code={currentCode} />
                </div>
            </div>

            <DataBank isOpen={isDataBankOpen} snippets={snippets} onLoad={c => {handleCodeChange(c); setIsDataBankOpen(false)}} onDelete={id => setSnippets(prev => prev.filter(s => s.id !== id))} onClose={() => setIsDataBankOpen(false)} />
            <AssetHub isOpen={isAssetHubOpen} onClose={() => setIsAssetHubOpen(false)} onImport={handleImportAsset} />
            {(isDataBankOpen || isAssetHubOpen) && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-md" onClick={() => {setIsDataBankOpen(false); setIsAssetHubOpen(false);}} />}
        </div>
    );
};

export default App;