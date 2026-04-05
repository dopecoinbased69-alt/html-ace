import React, { useState, useMemo } from 'react';
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface PreviewFrameProps {
    code: string;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ code }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fullHtml = useMemo(() => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin: 0; overflow: hidden; font-family: sans-serif; background: #000; }
                    /* Scrollbar styling for inside iframe */
                    ::-webkit-scrollbar { width: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
                </style>
            </head>
            <body>
                ${code}
            </body>
            </html>
        `;
    }, [code, refreshKey]);

    return (
        <div className={`${isFullScreen ? 'fixed inset-0 z-[100] bg-[#02040a] p-4 md:p-6 flex flex-col' : 'flex flex-col h-full min-h-[300px]'} transition-all duration-200`}>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <div className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">
                        PREVIEW SECTION:/
                    </div>
                    <button 
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="text-slate-500 hover:text-highlightCyan transition-colors p-1"
                        title="HARD REFRESH PREVIEW"
                    >
                        <RefreshCw size={12} className={refreshKey > 0 ? "animate-spin-once" : ""} />
                    </button>
                </div>
                <button 
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="text-slate-500 hover:text-highlightCyan transition-colors p-1"
                    title={isFullScreen ? "EXIT FULL SCREEN" : "FULL SCREEN"}
                >
                    {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>
            <div className="flex-grow border border-slate-800 relative bg-darkPanel overflow-hidden shadow-2xl rounded-sm">
                <div className="w-full h-full bg-slate-950 relative z-10">
                     <iframe 
                        key={refreshKey}
                        srcDoc={fullHtml}
                        title="Live Preview"
                        className="w-full h-full border-none bg-transparent"
                        sandbox="allow-scripts allow-modals allow-same-origin"
                    />
                </div>
            </div>
        </div>
    );
};

export default PreviewFrame;