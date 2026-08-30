// src/services/offlineDatabase.ts
import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

const DATABASE_NAME = 'betmundial_offline.db';
const DATABASE_VERSION = '1.1';
const DATABASE_DISPLAY_NAME = 'betMundial Offline Database';
const DATABASE_SIZE = 200000;

let database: SQLite.SQLiteDatabase | null = null;

// Initialize database
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    try {
        if (database) {
            console.log('[DB] Database already initialized');
            return database;
        }

        console.log('[DB] Opening database...');
        database = await SQLite.openDatabase(
            DATABASE_NAME,
            DATABASE_VERSION,
            DATABASE_DISPLAY_NAME,
            DATABASE_SIZE
        );

        console.log('[DB] Database opened successfully');
        await createTables();
        return database;
    } catch (error) {
        console.error('[DB] Error initializing database:', error);
        throw error;
    }
};

// Create tables
const createTables = async () => {
    try {
        if (!database) throw new Error('Database not initialized');

        console.log('[DB] Creating tables...');

        // Settings table for storing user preferences and offline login credentials
        await database.executeSql(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                offline_phone_number TEXT,
                offline_password TEXT,
                offline_token TEXT,
                offline_user_data TEXT,
                offline_credentials_updated_at TEXT,
                updated_at TEXT NOT NULL
            );
        `);

        console.log('[DB] Settings table created/verified');

        // Verify and add offline credential columns if they don't exist
        const requiredColumns = [
            'offline_phone_number',
            'offline_password',
            'offline_token',
            'offline_user_data',
            'offline_credentials_updated_at'
        ];

        for (const columnName of requiredColumns) {
            try {
                // Check if column exists
                const checkResult = await database.executeSql(`
                    PRAGMA table_info(settings)
                `);

                const columnExists = checkResult[0].rows.raw().some((col: any) => col.name === columnName);

                if (!columnExists) {
                    console.log(`[DB] Adding missing column: ${columnName}`);
                    await database.executeSql(`ALTER TABLE settings ADD COLUMN ${columnName} TEXT`);
                    console.log(`[DB] Successfully added column ${columnName}`);
                } else {
                    console.log(`[DB] Column ${columnName} already exists`);
                }
            } catch (error: any) {
                console.warn(`[DB] Error checking/adding column ${columnName}:`, error?.message || error);
            }
        }

        console.log('[DB] Tables created successfully');
    } catch (error) {
        console.error('[DB] Error creating tables:', error);
        throw error;
    }
};

// Close database
export const closeDatabase = async () => {
    try {
        if (database) {
            await database.close();
            database = null;
            console.log('[DB] Database closed');
        }
    } catch (error) {
        console.error('[DB] Error closing database:', error);
    }
};

// Legacy stub kept for SyncContext compatibility. The offline-collection
// feature (milk/produce collection sync) has been removed from this app;
// this always reports nothing pending so existing callers keep working.
export const getUnsyncedCollections = async (): Promise<any[]> => {
    return [];
};

// Offline Credentials Management
export interface OfflineCredentials {
    phone_number: string;
    password: string;
    token: string;
    user_data: any;
    stored_at: string;
}

// Store offline credentials in SQLite
export const saveOfflineCredentials = async (data: OfflineCredentials): Promise<void> => {
    try {
        console.log('[DB] Initializing database for credential storage...');
        const db = database || await initDatabase();
        console.log('[DB] Database ready, saving offline credentials for:', data.phone_number);

        // Check if we have any existing settings records
        console.log('[DB] Checking existing records...');
        const existingRecords = await db.executeSql('SELECT COUNT(*) as count FROM settings');
        const recordCount = existingRecords[0].rows.item(0).count;
        console.log('[DB] Found', recordCount, 'existing records');

        if (recordCount === 0) {
            // No records exist, insert new one
            console.log('[DB] No existing records, inserting new credentials...');
            await db.executeSql(`
                INSERT INTO settings (
                    offline_phone_number,
                    offline_password,
                    offline_token,
                    offline_user_data,
                    offline_credentials_updated_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                data.phone_number,
                data.password,
                data.token,
                JSON.stringify(data.user_data),
                data.stored_at,
                new Date().toISOString()
            ]);
            console.log('[DB] Insert completed');
        } else {
            // Records exist, update the first one
            console.log('[DB] Updating existing record with credentials...');
            await db.executeSql(`
                UPDATE settings
                SET offline_phone_number = ?,
                    offline_password = ?,
                    offline_token = ?,
                    offline_user_data = ?,
                    offline_credentials_updated_at = ?,
                    updated_at = ?
                WHERE id = (SELECT MIN(id) FROM settings)
            `, [
                data.phone_number,
                data.password,
                data.token,
                JSON.stringify(data.user_data),
                data.stored_at,
                new Date().toISOString()
            ]);
            console.log('[DB] Update completed');
        }

        console.log('[DB] Offline credentials saved successfully');

        // Verify the save worked
        const verifyResult = await db.executeSql(`
            SELECT offline_phone_number, offline_credentials_updated_at
            FROM settings
            WHERE offline_phone_number IS NOT NULL
            ORDER BY offline_credentials_updated_at DESC
            LIMIT 1
        `);
        console.log('[DB] Verification query result:', verifyResult[0].rows.length, 'rows found');
        if (verifyResult[0].rows.length > 0) {
            console.log('[DB] Verification: phone =', verifyResult[0].rows.item(0).offline_phone_number);
        }

    } catch (error) {
        console.error('[DB] Error saving offline credentials:', error);
        throw error;
    }
};

// Get offline credentials from SQLite
export const getOfflineCredentials = async (): Promise<OfflineCredentials | null> => {
    try {
        console.log('[DB] Getting offline credentials...');
        const db = database || await initDatabase();

        // First check if table exists and has the right structure
        console.log('[DB] Checking table structure...');
        const tableCheck = await db.executeSql(`
            SELECT sql FROM sqlite_master
            WHERE type='table' AND name='settings'
        `);
        if (tableCheck[0].rows.length > 0) {
            console.log('[DB] Settings table exists');
        } else {
            console.log('[DB] Settings table does NOT exist');
        }

        const result = await db.executeSql(`
            SELECT offline_phone_number, offline_password, offline_token, offline_user_data, offline_credentials_updated_at
            FROM settings
            WHERE offline_phone_number IS NOT NULL
            ORDER BY offline_credentials_updated_at DESC
            LIMIT 1
        `);

        console.log('[DB] Query result:', result[0].rows.length, 'rows found');

        if (result[0].rows.length > 0) {
            const row = result[0].rows.item(0);
            console.log('[DB] Found credentials for:', row.offline_phone_number);
            console.log('[DB] Token exists:', !!row.offline_token);
            return {
                phone_number: row.offline_phone_number,
                password: row.offline_password,
                token: row.offline_token,
                user_data: JSON.parse(row.offline_user_data || '{}'),
                stored_at: row.offline_credentials_updated_at
            };
        }

        console.log('[DB] No offline credentials found');
        return null;
    } catch (error) {
        console.error('[DB] Error getting offline credentials:', error);
        return null;
    }
};

// Check if offline credentials exist
export const hasOfflineCredentials = async (): Promise<boolean> => {
    try {
        const credentials = await getOfflineCredentials();
        return credentials !== null;
    } catch (error) {
        console.error('[DB] Error checking offline credentials:', error);
        return false;
    }
};

// Validate offline login against stored credentials
export const validateOfflineCredentials = async (phoneNumber: string, password: string): Promise<{ valid: boolean; userData?: any; token?: string }> => {
    try {
        const credentials = await getOfflineCredentials();

        if (!credentials) {
            return { valid: false };
        }

        // Check if credentials are not too old (30 days)
        const storedAt = new Date(credentials.stored_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - storedAt.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > (30 * 24)) {
            console.log('[DB] Offline credentials are too old');
            return { valid: false };
        }

        // Validate phone number and password
        const isValid = credentials.phone_number === phoneNumber && credentials.password === password;

        if (isValid) {
            return {
                valid: true,
                userData: credentials.user_data,
                token: credentials.token
            };
        }

        return { valid: false };
    } catch (error) {
        console.error('[DB] Error validating offline credentials:', error);
        return { valid: false };
    }
};

// Clear offline credentials (used during logout)
export const clearOfflineCredentials = async (): Promise<void> => {
    try {
        const db = database || await initDatabase();

        await db.executeSql('UPDATE settings SET offline_phone_number = NULL, offline_password = NULL, offline_token = NULL, offline_user_data = NULL, offline_credentials_updated_at = NULL');

        console.log('[DB] Offline credentials cleared');
    } catch (error) {
        console.error('[DB] Error clearing offline credentials:', error);
        throw error;
    }
};

// Debug function to check database state
export const debugDatabaseState = async (): Promise<void> => {
    try {
        console.log('[DB] === DATABASE DEBUG INFO ===');
        const db = database || await initDatabase();

        // Check if settings table exists
        const tableCheck = await db.executeSql(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='settings'
        `);
        console.log('[DB] Settings table exists:', tableCheck[0].rows.length > 0);

        // Check table structure
        const structureCheck = await db.executeSql('PRAGMA table_info(settings)');
        console.log('[DB] Table structure:', structureCheck[0].rows.length, 'columns');

        // List all columns
        structureCheck[0].rows.raw().forEach((col: any) => {
            console.log(`[DB] Column: ${col.name} (${col.type})`);
        });

        // Check for any settings records
        const recordsCheck = await db.executeSql('SELECT COUNT(*) as count FROM settings');
        const recordCount = recordsCheck[0].rows.item(0).count;
        console.log('[DB] Total settings records:', recordCount);

        // Check for offline credentials
        const offlineCheck = await db.executeSql(`
            SELECT COUNT(*) as count
            FROM settings
            WHERE offline_phone_number IS NOT NULL
        `);
        const offlineCount = offlineCheck[0].rows.item(0).count;
        console.log('[DB] Records with offline credentials:', offlineCount);

        if (offlineCount > 0) {
            const offlineData = await db.executeSql(`
                SELECT offline_phone_number, offline_credentials_updated_at
                FROM settings
                WHERE offline_phone_number IS NOT NULL
                ORDER BY offline_credentials_updated_at DESC
                LIMIT 1
            `);
            const row = offlineData[0].rows.item(0);
            console.log('[DB] Latest offline credentials for:', row.offline_phone_number, 'at', row.offline_credentials_updated_at);
        }

        console.log('[DB] === END DATABASE DEBUG ===');
    } catch (error) {
        console.error('[DB] Error in debug function:', error);
    }
};
