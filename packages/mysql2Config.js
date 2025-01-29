const mysql = require("mysql2");

class MySQL {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Verify pool connectivity
        this.pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error connecting to MySQL:', err);
                return;
            }
            console.log("Connected to MySQL");
            connection.release();
        });
    }

    async query(sql, params) {
        try {
            const [results] = await this.pool.promise().query(sql, params);
            return results;
        } catch (error) {
            console.error('Error querying MySQL:', error);
            throw error; // Re-throw to allow proper error handling in callers
        }
    }
}

module.exports = new MySQL();
