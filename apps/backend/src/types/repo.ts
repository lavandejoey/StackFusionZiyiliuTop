// src/types/repo.ts

export interface RepoProps {
    platform: "github" | "huggingface";
    url: string;
    owner: string;
    name: string;
    description?: string;
    topics?: string[];
    language?: string;
    license?: string;
    stars?: number;
    forks?: number;
    issues?: number;
    likes?: number;
    downloads?: number;
    lastUpdated?: string | Date;
    previewImg?: string;
    visibility?: string;
    compact?: boolean;
    pinned?: boolean;
}

