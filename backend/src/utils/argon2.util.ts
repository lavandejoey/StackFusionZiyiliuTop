// /StackFusionZiyiliuTop/backend/src/utils/argon2.util.ts
import argon2 from 'argon2'

/**
 * Hash a plain text password using Argon2
 * @param password - plain text password
 * @returns hashed password string
 */
async function hashPassword(password: string): Promise<string | undefined> {
    try {
        return await argon2.hash(password)
    } catch (error) {
        console.error('Error hashing password:', error)
        return undefined
    }
}

/**
 * Verify a plain text password against its hash
 * @param password - plain text password
 * @param hash - hashed password from database
 * @returns true if matched, false otherwise
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password)
    } catch (error) {
        console.error('Error verifying password:', error)
        return false
    }
}

export {hashPassword, verifyPassword}