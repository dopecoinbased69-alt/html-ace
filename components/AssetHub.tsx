import React, { useState } from 'react';
import { Box, Image as ImageIcon, Sun, Search, Plus, Info, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { Asset } from '../types';
import { searchAssets } from '../services/geminiService';

interface AssetHubProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (asset: Asset) => void;
}

const FEATURED_ASSETS: Asset[] = [
    {
        id: 'robot-1',
        name: 'EXPRESSIVE ROBOT',
        type: 'model',
        url: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
        thumbnail: 'https://threejs.org/examples/textures/uv_grid_opengl.jpg',
        license: 'CC-BY',
        author: 'Three.js Samples'
    },
    {
        id: 'helmet-1',
        name: 'BATTLE HELMET',
        type: 'model',
        url: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
        thumbnail: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/Default_albedo.jpg',
        license: 'CC-BY',
        author: 'Three.js Samples'
    },
    {
        id: 'env-1',
        name: 'NEON CITY HDRI',
        type: 'hdri',
        url: 'https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.hdr',
        thumbnail: 'https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.jpg',
        license: 'CC0',
        author: 'Poly Haven'
    }
];

const AssetHub: React.FC<AssetHubProps> = ({ isOpen, onClose, onImport }) => {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'model' | 'texture' | 'hdri'>('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Asset[]>([]);

    if (!isOpen) return null;

    const handleGlobalSearch = async () => {
        if (!query.trim() || isSearching) return;
        setIsSearching(true);
        try {
            const results = await searchAssets(query);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const displayAssets = [...(searchResults.length > 0 ? searchResults : FEATURED_ASSETS)].filter(a => {
        const matchesFilter = filter === 'all' || a.type === filter;
        return matchesFilter;
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGlobalSearch();
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-[#02040a] border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="text-[24px] font-black italic text-highlightCyan tracking-tighter leading-none">ASSET HUB</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">AI-POWERED REPOSITORY</div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white uppercase text-xs font-bold tracking-widest border border-slate-800 px-2 py-1 hover:border-highlightCyan transition-colors">
                    [EXIT]
                </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="SEARCH GLOBAL DATABASE..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-900 border border-slate-800 py-2 pl-10 pr-4 text-xs font-mono text-highlightCyan focus:outline-none focus:border-highlightCyan transition-colors uppercase"
                        />
                    </div>
                    <button 
                        onClick={handleGlobalSearch}
                        disabled={isSearching || !query.trim()}
                        className="bg-highlightCyan/10 border border-highlightCyan/40 p-2 text-highlightCyan hover:bg-highlightCyan hover:text-black transition-all disabled:opacity-30 flex items-center justify-center"
                        title="Search with Intelligence"
                    >
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                </div>
                
                <div className="flex gap-1">
                    {(['all', 'model', 'texture', 'hdri'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-1 text-[9px] font-black uppercase tracking-tighter border transition-all ${
                                filter === f ? 'bg-highlightCyan text-black border-highlightCyan' : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Asset List */}
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {isSearching ? (
                    <div className="flex flex-col items-center justify-center h-48 text-highlightCyan animate-pulse">
                        <Loader2 size={32} className="animate-spin mb-4" />
                        <div className="text-[10px] font-mono tracking-widest uppercase">Scanning Global Networks...</div>
                    </div>
                ) : displayAssets.length === 0 ? (
                    <div className="text-slate-700 text-sm font-mono text-center mt-10 italic">
                        // NO ASSETS FOUND IN CACHE
                    </div>
                ) : (
                    displayAssets.map(asset => (
                        <div key={asset.id} className="border border-slate-800 bg-slate-900/40 group overflow-hidden hover:border-highlightCyan transition-all">
                            <div className="h-24 bg-black relative overflow-hidden">
                                <img 
                                    src={asset.thumbnail} 
                                    alt={asset.name} 
                                    onError={(e) => (e.currentTarget.src = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg')}
                                    className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity grayscale group-hover:grayscale-0"
                                />
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 text-[8px] font-black text-highlightCyan border border-highlightCyan/30 uppercase tracking-widest">
                                    {asset.type}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                                    {asset.type === 'model' && <Box size={14} className="text-highlightCyan" />}
                                    {asset.type === 'texture' && <ImageIcon size={14} className="text-highlightCyan" />}
                                    {asset.type === 'hdri' && <Sun size={14} className="text-highlightCyan" />}
                                    <span className="text-[12px] font-black text-white italic tracking-tighter truncate max-w-[150px]">{asset.name}</span>
                                </div>
                            </div>
                            
                            <div className="p-3">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-500 font-bold uppercase">Author</span>
                                        <span className="text-[10px] text-slate-300 font-mono truncate max-w-[120px]">{asset.author}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[8px] text-slate-500 font-bold uppercase">License</span>
                                        <span className="text-[10px] text-highlightCyan font-mono">{asset.license}</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => onImport(asset)}
                                    className="w-full bg-slate-800 hover:bg-highlightCyan hover:text-black text-highlightCyan text-[11px] font-black py-2 flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-lg active:scale-[0.98]"
                                >
                                    <Plus size={14} /> Import to Core
                                </button>
                                
                                <div className="mt-2 flex items-center justify-center gap-4 text-slate-600">
                                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="hover:text-highlightCyan transition-colors flex items-center gap-1">
                                        <ExternalLink size={10} /> <span className="text-[8px] font-bold uppercase tracking-widest">Source</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-6 border-t border-slate-800 pt-4">
                 <div className="text-[10px] text-slate-600 font-mono italic flex items-center gap-2 justify-center">
                    <span className="w-2 h-2 rounded-full bg-green-500/50" />
                    SEARCH MODE: INTELLIGENT GROUNDING ACTIVE
                 </div>
            </div>
        </div>
    );
};

export default AssetHub;