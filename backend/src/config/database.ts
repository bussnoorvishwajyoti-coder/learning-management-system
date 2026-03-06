import mysql from 'mysql2/promise';
import { env } from './env';

export const createPool = () => {
  return mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DB_SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
};

export const pool = createPool();

export type Pool = mysql.Pool;
export type Connection = mysql.PoolConnection;
export type ResultSet = [mysql.ResultSetHeader, mysql.FieldPacket[]];
export type RowData = mysql.RowDataPacket[];

export const query = async <T = mysql.RowDataPacket[]>(
  sql: string,
  values?: any[]
): Promise<T> => {
  const [rows] = await pool.execute(sql, values);
  return rows as T;
};

export const transaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
