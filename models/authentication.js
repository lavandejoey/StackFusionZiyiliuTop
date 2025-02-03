// models/authentication.js
const db = require("../packages/mysql2Config");
const {hashPassword, verifyPassword} = require("../packages/argon2");
const {v4: uuidv4, validate: uuidValidate} = require("uuid");

// Enums
const UserRole = {
    ADMIN: {id: 1, name: "admin", description: "Administrator"},
    USER_MANAGER: {id: 2, name: "user_manager", description: "User Manager"},
    USER_FRIEND: {id: 3, name: "user_friend", description: "User Friend"},
    USER_GUEST: {id: 4, name: "user_guest", description: "User Guest"}
};
const UserStatus = {
    ACTIVE: "active",
    INACTIVE: "inactive",
}

class User {
    // Constructor: initialize the object with or without the uuid or email or both
    constructor(uuid = null, email = null) {
        this.uuid = uuid;
        this.email = email;
    }

    // Fetch user data from database with case-insensitive email query
    async fetchUser() {
        let sql_select = "";
        let params = [];

        if (this.uuid) {
            if (!uuidValidate(this.uuid)) {
                console.error("Invalid UUID format");
                return false;
            }
            sql_select = "SELECT * FROM user WHERE uuid = ?";
            params = [this.uuid];
        } else if (this.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.email)) {
                console.error("Invalid email format");
                return false;
            }
            sql_select = "SELECT * FROM user WHERE LOWER(email) = LOWER(?)";  // Case-insensitive query
            params = [this.email];
        } else {
            return;
        }

        try {
            const result = await db.query(sql_select, params);
            if (result.length > 0) {
                this.uuid = result[0].uuid;
                this.email = result[0].email;
                this.password_hash = result[0].password_hash;
                this.first_name = result[0].first_name;
                this.last_name = result[0].last_name;
                this.v2_iter_id = result[0].v2_iter_id;
                this.status = result[0].status;
                this.created_at = result[0].created_at;
                this.updated_at = result[0].updated_at;
            } else {
                console.log("User not found for email:", this.email);
                return false;
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            return false;
        }
    }

    // Create a new user
    async createUser(uuid, email, password, first_name, last_name, v2_iter_id) {
        // Check if all required fields are provided
        if (!email || !password) {
            console.error("Email and password are required for creating a new user");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error("Invalid email format");
            return false;
        }

        if (password.length < 6) {
            console.error("Password is too short");
            return false;
        }

        try {
            this.uuid = uuid || uuidv4();
            this.email = email;
            this.password_hash = await hashPassword(password);
            this.first_name = first_name || '';
            this.last_name = last_name || '';
            this.v2_iter_id = v2_iter_id || Math.floor(Math.random() * 100);
            this.status = UserStatus.INACTIVE;
            const sql_insert = "INSERT INTO user (uuid, email, password_hash, first_name, last_name, v2_iter_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
            const params = [this.uuid, this.email, this.password_hash, this.first_name, this.last_name, this.v2_iter_id, this.status];
            await db.query(sql_insert, params);
        } catch (error) {
            console.error("Error creating user:", error);
            return false;
        }
    }

    // Authenticate user
    async authenticateUser(password) {
        try {
            return await verifyPassword(password, this.password_hash);
        } catch (error) {
            console.error("Error authenticating user:", error);
            return false;
        }
    }

    // Check if user is an admin
    async isAdmin() {
        try {
            const sql_select = "SELECT * FROM user_role_mapping WHERE user_uuid = ? AND role_id = ?";
            const params = [this.uuid, UserRole.ADMIN.id];
            const result = await db.query(sql_select, params);
            return result.length > 0;  // Simply return boolean
        } catch (error) {
            console.error("Error checking user role:", error);
            return false;
        }
    }
    async isUserManager() {
        try {
            const sql_select = "SELECT * FROM user_role_mapping WHERE user_uuid = ? AND role_id = ?";
            const params = [this.uuid, UserRole.USER_MANAGER.id];
            const result = await db.query(sql_select, params);
            return result.length > 0;  // Simply return boolean
        } catch (error) {
            console.error("Error checking user role:", error);
            return false;
        }
    }

    // Update user status
    async updateUserStatus(status) {
        if (![UserStatus.ACTIVE, UserStatus.INACTIVE].includes(status)) {
            console.error("Invalid status");
            return false;
        }
        try {
            const sql_update = "UPDATE user SET status = ? WHERE uuid = ?";
            const params = [status, this.uuid];
            await db.query(sql_update, params);
            this.status = status;
            return true;
        } catch (error) {
            console.error("Error updating user status:", error);
            return false;
        }
    }

    // Update user data with new values
    async updateUser(email, old_password, new_password, first_name, last_name, v2_iter_id) {
        try {
            const authenticated = await verifyPassword(old_password, this.password_hash);
            if (!authenticated) {
                console.error("Old password is incorrect");
                return false;
            }

            const updates = [];
            const params = [];

            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    console.error("Invalid email format");
                    return false;
                }
                updates.push("email = ?");
                params.push(email);
            }
            if (new_password) {
                if (new_password.length < 6) {
                    console.error("Password is too short");
                    return false;
                }
                const new_password_hash = await hashPassword(new_password);
                updates.push("password_hash = ?");
                params.push(new_password_hash);
            }
            if (first_name) {
                updates.push("first_name = ?");
                params.push(first_name);
            }
            if (last_name) {
                updates.push("last_name = ?");
                params.push(last_name);
            }
            if (v2_iter_id) {
                updates.push("v2_iter_id = ?");
                params.push(v2_iter_id);
            }

            if (updates.length === 0) {
                console.error("At least one field is required for updating user data");
                return false;
            }

            const sql_update = `UPDATE user
                                SET ${updates.join(", ")}
                                WHERE uuid = ?`;
            params.push(this.uuid);

            await db.query(sql_update, params);
            await this.fetchUser();  // Refresh user data after update
            console.log("User data updated:", this);
            return true;

        } catch (error) {
            console.error("Error updating user data:", error);
            return false;
        }
    }
}

module.exports = {User, UserRole, UserStatus};

