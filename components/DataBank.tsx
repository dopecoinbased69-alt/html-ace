import React from 'react';
import { Trash2, FolderOpen, Save } from 'lucide-react';
import { Snippet } from '../types';

interface DataBankProps {
    isOpen: boolean;
    snippets: Snippet[];
    onLoad: (code: string) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

const DataBank: React.FC<DataBankProps> = ({ isOpen, snippets, onLoad, onDelete, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-[#02040a] border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div className="text-[20px] font-black italic text-highlightCyan tracking-tighter">DATA BANK</div>
                <button onClick={onClose} className="text-slate-500 hover:text-white uppercase text-xs font-bold tracking-widest">
                    [CLOSE]
                </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3">
                {snippets.length === 0 ? (
                    <div className="text-slate-600 text-sm font-mono text-center mt-10">
                        // MEMORY EMPTY
                    </div>
                ) : (
                    snippets.map(snippet => (
                        <div key={snippet.id} className="border border-slate-800 p-3 bg-slate-900/50 hover:border-highlightCyan group transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-300 text-sm truncate pr-2">{snippet.title}</h3>
                                <button 
                                    onClick={() => onDelete(snippet.id)}
                                    className="text-slate-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="text-[10px] text-slate-600 font-mono mb-3">
                                {new Date(snippet.timestamp).toLocaleDateString()}
                            </div>
                            <button 
                                onClick={() => onLoad(snippet.code)}
                                className="w-full bg-slate-800 hover:bg-highlightCyan hover:text-black text-highlightCyan text-xs font-bold py-2 px-2 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                            >
                                <FolderOpen size={12} /> Load Data
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-auto border-t border-slate-800 pt-4 text-center">
                 <div className="text-[10px] text-slate-700 font-mono">STORAGE CAPACITY: {snippets.length}/50</div>
            </div>
        </div>
    );
};

export default DataBank;