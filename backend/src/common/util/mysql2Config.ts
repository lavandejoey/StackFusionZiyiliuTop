// /StackFusionZiyiliuTop/backend/src/common/util/mysql2Config.ts
import mysql, {
    Pool,
    PoolConnection,
    RowDataPacket,
    ResultSetHeader,
    FieldPacket,
} from "mysql2/promise";
import {
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USER,
} from "@src/common/constants/ENV";
import logger from "jet-logger";

class MySQL {
    private pool: Pool;

    public constructor() {
        this.pool = mysql.createPool({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            port: DB_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // Verify pool connectivity
        this.pool
            .getConnection()
            .then((connection: PoolConnection) => {
                logger.warn("Connected to MySQL");
                connection.release();
            })
            .catch((err: unknown) => {
                logger.err(`Error connecting to MySQL: 
                ${err instanceof Error ? err.message : "Unknown error"}`);
            });
    }

    // For SELECT queries
    public async query<T extends RowDataPacket[]>(
        sql: string,
        params?: unknown[],
    ): Promise<[T, FieldPacket[]]> {
        return this.pool.query<T>(sql, params);
    }

    // For INSERT / UPDATE / DELETE queries
    public async execute(
        sql: string,
        params?: unknown[],
    ): Promise<[ResultSetHeader, FieldPacket[]]> {
        return this.pool.execute<ResultSetHeader>(sql, params);
    }

    public async close(): Promise<void> {
        await this.pool.end();
        logger.warn("MySQL pool closed");
    }
}

export default new MySQL();
