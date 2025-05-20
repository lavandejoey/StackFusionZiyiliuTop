// /StackFusionZiyiliuTop/backend/src/models/useRole.model.ts
import {RowDataPacket} from "mysql2/promise"
import dbClient from "@/utils/mysql2Config.util"

// Role mapping row
export interface UserRoleMappingRow extends RowDataPacket {
    id: number,
    role_name: string,
    description: string
}

// Enum definitions
export enum UserRoleEnum {
    ADMIN = 1,
    USER_MANAGER = 2,
    USER_FRIEND = 3,
    USER_GUEST = 4
}

export class UserRoleModel {
    id: number
    role_name: string
    description: string

    constructor(id: number, role_name: string, description: string) {
        this.id = id
        this.role_name = role_name
        this.description = description
    }

    static async fetchAllRoles(): Promise<UserRoleMappingRow[]> {
        try {
            const [rows] = await dbClient.query<UserRoleMappingRow[]>("SELECT * FROM user_role")
            return rows
        } catch (error) {
            console.error("Error fetching roles:", error)
            return []
        }
    }
}

