// /StackFusionZiyiliuTop/backend/src/common/util/argon2.ts
import argon2 from "argon2";

/**
 * Hashes a plain‐text password using a secure Argon2 variant.
 */
export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
}

/**
 * Verifies a plain‐text password against a stored Argon2 hash.
 * Returns true if they match, false otherwise.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}