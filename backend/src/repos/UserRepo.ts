// /StackFusionZiyiliuTop/backend/src/repos/UserRepo.ts
import {
    UserModel,
    UserRoleEnum,
    UserRow,
    UserRoleMappingRow,
    PasswordRow, UserCreateModel,
} from "@src/types/users";
import {verifyPassword} from "@src/common/util/argon2";
import {default as dbClient} from "@src/common/util/mysql2Config";

interface UserRepo {
    /******************** User ********************/
    // Check account information
    findUserByEmail(email: string): Promise<UserModel | null>;

    // Check account information by UUID
    findUserByUuid(uuid: string): Promise<UserModel | null>;

    // Check if the password matches
    matchUserPassword(uuid: string, password: string): Promise<boolean>;

    // Register/Initialize the administrator account
    insertUser(user: UserCreateModel, passwordHash: string): Promise<void>;

    // Modify password
    updateUserPassword(uuid: string, newHash: string): Promise<void>;

    // Administrator page view user
    listUsers(offset: number, limit: number): Promise<UserModel[]>;

    /******************** Role ********************/
    // Pull out all roles of this user
    listRolesByUserUuid(uuid: string): Promise<UserRoleEnum[]>;

    /******************** Mapping ********************/
    // Associate a role with a user
    attachRoleToUser(uuid: string, role: UserRoleEnum): Promise<void>;

    // Disassociate a role from a user
    detachRoleFromUser(uuid: string, role: UserRoleEnum): Promise<void>;
}

class MySQLUserRepo implements UserRepo {
    /******************** User ********************/
    public async findUserByEmail(email: string): Promise<UserModel | null> {
        const [rows] = await dbClient.query<UserRow[]>(
            `SELECT uuid,
                    email,
                    first_name,
                    last_name,
                    v2_iter_id,
                    status,
                    created_at,
                    updated_at
             FROM user
             WHERE email = ?
             LIMIT 1`,
            [email],
        );
        return rows.length ? (rows[0] as UserModel) : null;
    }

    public async findUserByUuid(uuid: string): Promise<UserModel | null> {
        const [rows] = await dbClient.query<UserRow[]>(
            `SELECT uuid,
                    email,
                    first_name,
                    last_name,
                    v2_iter_id,
                    status,
                    created_at,
                    updated_at
             FROM user
             WHERE uuid = ?
             LIMIT 1`,
            [uuid],
        );
        return rows.length ? (rows[0] as UserModel) : null;
    }

    public async matchUserPassword(uuid: string, password: string): Promise<boolean> {
        const [rows] = await dbClient.query<PasswordRow[]>(
            `SELECT password_hash
             FROM user
             WHERE uuid = ?
             LIMIT 1`,
            [uuid],
        );
        if (rows.length === 0) {
            // dummy verify to normalize timing
            await verifyPassword(
                "$argon2i$v=19$m=65536,t=3,p=1$dummySalt$dummyHash",
                password,
            );
            return false;
        }
        return verifyPassword(rows[0].password_hash, password);
    }

    public async insertUser(user: UserCreateModel, passwordHash: string): Promise<void> {
        await dbClient.execute(
            `INSERT INTO user
             (uuid, email, first_name, last_name,
              password_hash, v2_iter_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                user.uuid,
                user.email,
                user.first_name ?? null,
                user.last_name ?? null,
                passwordHash,
                user.v2_iter_id!,
            ],
        );
    }

    // Modify password
    public async updateUserPassword(uuid: string, newHash: string): Promise<void> {
        await dbClient.execute(
            `UPDATE user
             SET password_hash = ?
             WHERE uuid = ?`,
            [newHash, uuid],
        );
    }

    // Administrator page view user
    public async listUsers(offset: number, limit: number): Promise<UserModel[]> {
        const [rows] = await dbClient.query<UserRow[]>(
            `SELECT uuid,
                    email,
                    first_name,
                    last_name,
                    v2_iter_id,
                    status,
                    created_at,
                    updated_at
             FROM user
             ORDER BY status DESC, created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset],
        );
        return rows as UserModel[];
    }

    /******************** Role ********************/
    // Pull out all roles of this user
    public async listRolesByUserUuid(uuid: string): Promise<UserRoleEnum[]> {
        const [rows] = await dbClient.query<UserRoleMappingRow[]>(
            `SELECT role_id
             FROM user_role_mapping
             WHERE user_uuid = ?`,
            [uuid],
        );
        return rows.map(row => row.role_id);
    }

    /******************** Mapping ********************/
    // Associate a role with a user
    public async attachRoleToUser(uuid: string, role: UserRoleEnum): Promise<void> {
        await dbClient.execute(
            `INSERT INTO user_role_mapping (user_uuid, role_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE role_id = ?`,
            [uuid, role, role],
        );
    }

    // Disassociate a role from a user
    public async detachRoleFromUser(uuid: string, role: UserRoleEnum): Promise<void> {
        await dbClient.execute(
            `DELETE
             FROM user_role_mapping
             WHERE user_uuid = ?
               AND role_id = ?`,
            [uuid, role],
        );
    }
}

export default new MySQLUserRepo();