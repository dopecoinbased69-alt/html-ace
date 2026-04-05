import React, { useRef } from 'react';

interface CodeEditorProps {
    code: string;
    onChange: (newCode: string) => void;
    isLoading?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, isLoading }) => {
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

            // Need to set selection after render
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }, 0);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-[400px] relative">
            <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1 flex justify-between">
                <span>CODE EDITOR:/</span>
                {isLoading && <span className="text-highlightCyan animate-pulse">WRITING...</span>}
            </div>
            
            <div className="flex-grow border border-slate-800 relative bg-darkPanel overflow-hidden rounded-sm group">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-grid-pattern bg-[length:25px_25px] opacity-100 pointer-events-none" />
                
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    className="w-full h-full bg-transparent text-highlightCyan font-mono text-sm p-5 resize-none border-none outline-none relative z-10 placeholder-slate-700 leading-relaxed"
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-highlightCyan text-xs tracking-widest">
                         <div className="animate-pulse">SYNTHESIZING_CORE...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;