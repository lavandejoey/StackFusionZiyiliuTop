// src/types/User.ts

/**
 * Represents a user in the system.
 */
export interface UserModel {
    uuid: string;
    email: string;
    first_name?: string;
    last_name?: string;
    v2_iter_id: number;
    status: UserStatusValue; // "active" | "inactive"
    created_at: Date;
    updated_at: Date;
}

/**
 * Possible states for a user’s account.
 */
export const UserStatus = {
    ACTIVE: "active",
    INACTIVE: "inactive",
} as const;

export type UserStatusKey = keyof typeof UserStatus;       // "ACTIVE" | "INACTIVE"
export type UserStatusValue = typeof UserStatus[UserStatusKey]; // "active" | "inactive"

/**
 * Roles that can be assigned to a user.
 */
export const UserRole = {
    ADMIN: 1,
    USER_MANAGER: 2,
    USER_FRIEND: 3,
    USER_GUEST: 4,
} as const;

// => 1 | 2 | 3 | 4
export type UserRole = typeof UserRole[keyof typeof UserRole];
