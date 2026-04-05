import React, { useState } from 'react';
import { Microchip } from 'lucide-react';

interface PromptBarProps {
    onSubmit: (prompt: string) => void;
    isLoading: boolean;
}

const PromptBar: React.FC<PromptBarProps> = ({ onSubmit, isLoading }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = () => {
        if (!prompt.trim() || isLoading) return;
        onSubmit(prompt);
        setPrompt('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div>
            <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1">
                INTELLIGENCE:/
            </div>
            <div className="bg-promptTeal border-[2px] border-black p-3 md:p-4 flex items-center justify-between gap-4 transition-all focus-within:ring-2 focus-within:ring-highlightCyan">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    disabled={isLoading}
                    className="bg-transparent border-none outline-none text-black/60 text-[24px] md:text-[38px] font-black italic w-full uppercase tracking-tighter disabled:opacity-50"
                />
                <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-transparent border-[2px] border-black w-[45px] h-[45px] flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-black hover:border-white group transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-black leading-none group-hover:text-white">AI</span>
                        <Microchip size={18} className="text-black mt-0.5 group-hover:text-highlightCyan" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default PromptBar;