import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

const migrationsDir = path.join(__dirname, '../../migrations');

interface MigrationRecord {
  filename: string;
  executed_at: Date;
}

const initMigrationsTable = async (): Promise<void> => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

const getExecutedMigrations = async (): Promise<string[]> => {
  const [rows] = await pool.execute('SELECT filename FROM migrations ORDER BY id');
  return (rows as MigrationRecord[]).map(r => r.filename);
};

const executeMigration = async (filename: string, sql: string): Promise<void> => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Split SQL by semicolon to handle multiple statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await connection.execute(statement);
    }
    
    await connection.execute(
      'INSERT INTO migrations (filename) VALUES (?)',
      [filename]
    );
    
    await connection.commit();
    console.log(`✓ Executed: ${filename}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const runMigrations = async (): Promise<void> => {
  try {
    await initMigrationsTable();
    
    const executedMigrations = await getExecutedMigrations();
    
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log('Running migrations...\n');
    
    for (const file of files) {
      if (executedMigrations.includes(file)) {
        console.log(`✓ Skipped (already executed): ${file}`);
        continue;
      }
      
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await executeMigration(file, sql);
    }
    
    console.log('\n✓ All migrations completed');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();
