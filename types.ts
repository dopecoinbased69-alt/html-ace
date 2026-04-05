export interface Snippet {
    id: string;
    title: string;
    code: string;
    timestamp: number;
}

export interface Interaction {
    prompt: string;
    timestamp: number;
}

export interface SessionMemory {
    preferences: string[];
    interactionCount: number;
}

export interface Asset {
    id: string;
    name: string;
    type: 'model' | 'texture' | 'hdri';
    url: string;
    thumbnail: string;
    license: string;
    author: string;
    localData?: string;
}

export interface GenerationResult {
    code: string;
    error?: string;
}