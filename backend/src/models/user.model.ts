// /StackFusionZiyiliuTop/backend/src/models/user.model.ts
import {v4 as uuid4, validate as uuidValidate} from 'uuid'
import dbClient from "utils/mysql2Config.util"
import {RowDataPacket} from 'mysql2/promise'
import {hashPassword, verifyPassword} from 'utils/argon2.util'
import {UserRoleEnum, UserRoleMappingRow, UserRoleModel} from "models/useRole.model"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

enum UserStatusEnum {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}


// Interfaces for User Record and Role Mapping
interface UserRow extends RowDataPacket {
    uuid: string
    email: string
    password_hash: string
    first_name: string
    last_name: string
    v2_iter_id: number
    status: UserStatusEnum
    created_at: Date
    updated_at: Date
}

class UserModel {
    uuid: string | null
    email: string | null
    password_hash?: string
    first_name?: string
    last_name?: string
    v2_iter_id?: number
    status?: UserStatusEnum
    created_at?: Date
    updated_at?: Date
    roles: UserRoleModel[]

    constructor(uuid: string | null = null, email: string | null = null) {
        this.uuid = uuid
        this.email = email
        this.roles = []
    }

    static async fetchAllUsers(): Promise<UserRow[]> {
        try {
            const [rows] = await dbClient.query<UserRow[]>('SELECT * FROM user')
            return rows
        } catch (error) {
            console.error('Error fetching users:', error)
            return []
        }
    }

    async fetchUser(): Promise<UserModel | null> {
        let sql: string = ''
        let params: string[] = []

        if (this.uuid) {
            if (!uuidValidate(this.uuid)) {
                console.error('Invalid UUID format')
                return null
            }
            sql = 'SELECT * FROM user WHERE uuid = ?'
            params = [this.uuid]
        } else if (this.email) {
            if (!emailRegex.test(this.email)) {
                console.error('Invalid email format')
                return null
            }
            sql = 'SELECT * FROM user WHERE LOWER(email) = LOWER(?)'
            params = [this.email]
        } else {
            return null
        }

        try {
            const [rows] = await dbClient.query<UserRow[]>(sql, params)
            if (rows.length === 0) {
                console.log('User not found')
                return null
            }

            const user = rows[0]
            this.uuid = user.uuid
            this.email = user.email
            this.password_hash = user.password_hash
            this.first_name = user.first_name
            this.last_name = user.last_name
            this.v2_iter_id = user.v2_iter_id
            this.status = user.status
            this.created_at = user.created_at
            this.updated_at = user.updated_at

            const user_role_sql: string = "SELECT role_id FROM user_role_mapping WHERE user_uuid = ?"
            // role_id list by query user-role relation table
            const user_role_ids = await dbClient.query(user_role_sql, [this.uuid]);
            // query role table by role_id list
            const role_sql: string = "SELECT id, role_name, description FROM user_role WHERE id = ?"
            for (let i = 0; i < user_role_ids[0].length; i++) {
                const role_id = user_role_ids[0][i].role_id;
                const [role_rows] = await dbClient.query<UserRoleMappingRow[]>(role_sql, [role_id]);
                if (role_rows.length === 0) {
                    console.log('Role not found')
                    return null
                }
                const role = role_rows[0]
                this.roles.push(new UserRoleModel(role.id, role.role_name, role.description))
            }

            return this
        } catch (error) {
            console.error('Error fetching user:', error)
            return null
        }
    }

    async createUser(
        uuid?: string,
        email?: string,
        password?: string,
        first_name?: string,
        last_name?: string,
        v2_iter_id?: number
    ): Promise<UserModel | null> {
        if (!email || !password) {
            console.error('Email and password are required for creating a new user')
            return null
        }

        if (!emailRegex.test(email)) {
            console.error('Invalid email format')
            return null
        }

        if (password.length < 6) {
            console.error('Password is too short')
            return null
        }

        try {
            this.uuid = uuid || uuid4()
            this.email = email
            this.password_hash = await hashPassword(password)
            this.first_name = first_name || ''
            this.last_name = last_name || ''
            this.v2_iter_id = v2_iter_id || Math.floor(Math.random() * 100)
            this.status = UserStatusEnum.INACTIVE

            const sql = 'INSERT INTO user (uuid, email, password_hash, first_name, last_name, v2_iter_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
            const params = [this.uuid, this.email, this.password_hash, this.first_name, this.last_name, this.v2_iter_id, this.status]

            await dbClient.query(sql, params)
            return this
        } catch (error) {
            console.error('Error creating user:', error)
            return null
        }
    }

    async authenticateUser(password: string): Promise<boolean> {
        if (!this.password_hash) return false

        try {
            const authenticated = await verifyPassword(password, this.password_hash)

            if (authenticated) {
                const sql = 'UPDATE user SET updated_at = NOW() WHERE uuid = ?'
                await dbClient.query(sql, [this.uuid])
            }

            return authenticated
        } catch (error) {
            console.error('Error authenticating user:', error)
            return false
        }
    }

    isLocked(): boolean {
        return this.status === UserStatusEnum.INACTIVE
    }

    isAdmin(): boolean {
        return this.roles.map(role => role.id).includes(UserRoleEnum.ADMIN)
    }

    isUserManager(): boolean {
        return this.roles.map(role => role.id).includes(UserRoleEnum.USER_MANAGER)
    }

    isUserFriend(): boolean {
        return this.roles.map(role => role.id).includes(UserRoleEnum.USER_FRIEND)
    }

    isUserGuest(): boolean {
        return this.roles.map(role => role.id).includes(UserRoleEnum.USER_GUEST)
    }

    async updateUserStatus(status: UserStatusEnum): Promise<boolean> {
        if (!Object.values(UserStatusEnum).includes(status)) {
            console.error('Invalid status')
            return false
        }

        try {
            const sql = 'UPDATE user SET status = ? WHERE uuid = ?'
            await dbClient.query(sql, [status, this.uuid])
            this.status = status
            return true
        } catch (error) {
            console.error('Error updating user status:', error)
            return false
        }
    }

    async updateUser(
        email?: string,
        old_password?: string,
        new_password?: string,
        first_name?: string,
        last_name?: string,
        v2_iter_id?: number
    ): Promise<UserModel | null> {
        if (!old_password || !await verifyPassword(old_password, this.password_hash || '')) {
            console.error('Old password is incorrect or missing')
            return null
        }

        const updates: string[] = []
        const params: any[] = []

        if (email) {
            if (!emailRegex.test(email)) {
                console.error('Invalid email format')
                return null
            }
            updates.push('email = ?')
            params.push(email)
        }

        if (new_password) {
            if (new_password.length < 6) {
                console.error('Password is too short')
                return null
            }
            const new_password_hash = await hashPassword(new_password)
            updates.push('password_hash = ?')
            params.push(new_password_hash)
        }

        if (first_name) {
            updates.push('first_name = ?')
            params.push(first_name)
        }

        if (last_name) {
            updates.push('last_name = ?')
            params.push(last_name)
        }

        if (typeof v2_iter_id === 'number') {
            updates.push('v2_iter_id = ?')
            params.push(v2_iter_id)
        }

        if (updates.length === 0) {
            console.error('Nothing to update')
            return null
        }

        try {
            const sql = `UPDATE user
                         SET ${updates.join(', ')}
                         WHERE uuid = ?`
            params.push(this.uuid)

            await dbClient.query(sql, params)
            await this.fetchUser() // refresh user data
            return this
        } catch (error) {
            console.error('Error updating user:', error)
            return null
        }
    }
}

export {UserStatusEnum, UserModel, UserRow}
