import React, { useEffect, useState } from 'react';
import { Cpu, ChevronDown, Zap } from 'lucide-react';

interface HeaderProps {
    onOpenSettings?: () => void;
    modelType: string;
    onModelChange: (model: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, modelType, onModelChange }) => {
    const [interactionCount, setInteractionCount] = useState(0);

    useEffect(() => {
        const checkMemory = () => {
            const memory = localStorage.getItem('html-ai-session-memory');
            if (memory) {
                setInteractionCount(JSON.parse(memory).interactionCount);
            }
        };
        checkMemory();
        window.addEventListener('storage', checkMemory);
        return () => window.removeEventListener('storage', checkMemory);
    }, []);

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
                        onClick={onOpenSettings}
                        className="border-2 border-slate-800 p-1 bg-transparent w-[45px] h-[45px] relative group hover:border-highlightCyan transition-colors cursor-pointer ml-auto flex items-center justify-center shadow-lg"
                        title="Configure API Key"
                    >
                        <div className="absolute top-1/2 -left-[20px] w-[20px] h-[2px] bg-slate-800 group-hover:bg-highlightCyan transition-colors" />
                        <div className="w-full h-full border border-slate-900 flex flex-col items-center justify-center text-[8px] font-bold text-slate-900 bg-slate-800/20 group-hover:bg-highlightCyan/10">
                            <span className="text-slate-400 group-hover:text-highlightCyan">KEY</span>
                            <Cpu size={14} className="text-slate-600 group-hover:text-highlightCyan mt-0.5" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-darkPanel shadow-[0_0_5px_#22c55e]" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;