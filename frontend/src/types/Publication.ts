export interface PublicationRepo {
    platform: "github" | "huggingface";
    owner: string;
    name: string;
    type?: "dataset" | "model" | "code";
}

export interface Publication {
    active: boolean;
    type: "paper" | "misc" | "preprint";
    title: string;
    authors: string | string[];
    url: string;
    repo?: PublicationRepo[];
}
