// /StackFusionZiyiliuTop/backend/src/utils/mysql2Config.util.ts
import mysql, {Pool, PoolConnection, RowDataPacket, ResultSetHeader, FieldPacket} from 'mysql2/promise'

class MySQL {
    private pool: Pool

    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST as string,
            user: process.env.DB_USER as string,
            password: process.env.DB_PASSWORD as string,
            database: process.env.DB_NAME as string,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        })

        // Verify pool connectivity
        this.pool.getConnection()
            .then((connection: PoolConnection) => {
                console.log("Connected to MySQL")
                connection.release()
            })
            .catch(err => {
                console.error('Error connecting to MySQL:', err)
            })
    }

    // For SELECT queries
    async query<T extends RowDataPacket[]>(sql: string, params?: any[]): Promise<[T, FieldPacket[]]> {
        return this.pool.query<T>(sql, params);
    }

    // For INSERT / UPDATE / DELETE queries
    async execute(sql: string, params?: any[]): Promise<[ResultSetHeader, FieldPacket[]]> {
        return this.pool.execute<ResultSetHeader>(sql, params);
    }

    async close(): Promise<void> {
        await this.pool.end()
        console.log("MySQL pool closed")
    }
}

export default new MySQL()
