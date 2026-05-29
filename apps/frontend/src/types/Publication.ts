export interface PublicationRepo {
    platform: "github" | "huggingface";
    owner: string;
    name: string;
    type?: "dataset" | "model" | "code";
}

export interface Publication {
    active: boolean;
    type: "paper" | "misc" | "preprint" | "inproceedings";
    title: string;
    authors: string | string[];
    book?: string;
    year?: number;
    url: string;
    reviewed?: boolean;
    bibtex?: string;
    repo?: PublicationRepo[];
}
