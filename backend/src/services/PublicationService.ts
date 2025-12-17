import { Publication } from "@src/types/publication";
import logger from "jet-logger";
import PUBLICATIONS_CONFIG from "@config/publish.json";

// Ensure the imported JSON is typed to avoid unsafe-any usage
const PUBLICATIONS: Publication[] = PUBLICATIONS_CONFIG as unknown as Publication[];

/**
 * Get all active publications from config
 */
export function getPublications(): Publication[] {
    try {
        // Filter to only active publications
        const activePublications = PUBLICATIONS.filter((pub: Publication) => pub.active);
        logger.info(
            `Loaded ${activePublications.length} active publications from config`,
        );
        return activePublications;
    } catch (error: unknown) {
        logger.err(`Failed to load publications: ${String(error)}`);
        throw error;
    }
}

/**
 * Get publications by type
 */
export function getPublicationsByType(type: string): Publication[] {
    try {
        const publications = getPublications();
        return publications.filter((pub: Publication) => pub.type === type);
    } catch (error: unknown) {
        logger.err(`Failed to filter publications by type: ${String(error)}`);
        throw error;
    }
}
