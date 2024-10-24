const mysql = require("mysql2");

class MySQL {
    constructor() {
        this.sql_connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        // Connect test
        this.sql_connection.connect(function (err) {
            if (err) {
                console.error('Error connecting to MySQL: ' + err.stack);
                return;
            }
            console.log("Connected to MySQL");
        });
    }
    // General query function (asynchronous)
    query(sql, params) {
        try {
            return new Promise((resolve, reject) => {
                this.sql_connection.query(sql, params, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
        catch (error) {
            console.error('Error querying MySQL:', error);
        }
    }
}

module.exports = new MySQL();