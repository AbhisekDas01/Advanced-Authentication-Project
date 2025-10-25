import pool from '../configs/db.config.js';

async function createTables() {
    try {
        console.log('🚀 Creating database tables...');

        // User table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                image TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                two_factor_enabled BOOLEAN DEFAULT FALSE,
                role TEXT,
                banned BOOLEAN DEFAULT FALSE,
                ban_reason TEXT,
                ban_expires TIMESTAMP,
                favorite_number INTEGER NOT NULL
            );
        `);
        console.log('✅ User table created');

        // Session table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "session" (
                id TEXT PRIMARY KEY,
                expires_at TIMESTAMP NOT NULL,
                token TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                ip_address TEXT,
                user_agent TEXT,
                user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                impersonated_by TEXT
            );
        `);
        console.log('✅ Session table created');

        // Account table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "account" (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                access_token TEXT,
                refresh_token TEXT,
                id_token TEXT,
                access_token_expires_at TIMESTAMP,
                refresh_token_expires_at TIMESTAMP,
                scope TEXT,
                password TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ Account table created');

        // Verification table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "verification" (
                id TEXT PRIMARY KEY,
                identifier TEXT NOT NULL,
                value TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ Verification table created');

        // Two Factor table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "two_factor" (
                id TEXT PRIMARY KEY,
                secret TEXT NOT NULL,
                backup_codes TEXT NOT NULL,
                user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Two Factor table created');

        // Passkey table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "passkey" (
                id TEXT PRIMARY KEY,
                name TEXT,
                public_key TEXT NOT NULL,
                user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                credential_id TEXT NOT NULL,
                counter INTEGER NOT NULL,
                device_type TEXT NOT NULL,
                backed_up BOOLEAN NOT NULL,
                transports TEXT,
                created_at TIMESTAMP,
                aaguid TEXT
            );
        `);
        console.log('✅ Passkey table created');

        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id);
            CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);
            CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"(user_id);
            CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier);
            CREATE INDEX IF NOT EXISTS idx_two_factor_user_id ON "two_factor"(user_id);
            CREATE INDEX IF NOT EXISTS idx_passkey_user_id ON "passkey"(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
        `);
        console.log('✅ Indexes created');

        console.log('\n🎉 All tables created successfully!');

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    } finally {
        await pool.end();
        process.exit(0);
    }
}

export default createTables;
