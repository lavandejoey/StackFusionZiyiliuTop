export function parseAuthors(input: string | string[]): string[] {
    if (Array.isArray(input)) return input.map((s) => s.trim()).filter(Boolean);
    if (!input) return [];
    // Normalize common separators: replace ' and ' with a comma, then split on commas
    const normalized = input.replace(/\band\b/gi, ",");
    return normalized
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

export function formatAuthorsForDisplay(input: string | string[], max = 6): string {
    const list = parseAuthors(input);
    if (list.length === 0) return "";
    if (list.length <= max) return list.join(", ");
    const short = list.slice(0, max).join(", ");
    return `${short}, et al.`;
}

export default { parseAuthors, formatAuthorsForDisplay };
