import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Database configuration using Sequelize ORM
 * Supports PostgreSQL, MySQL, and SQLite
 */
const dialect = process.env.DB_DIALECT || 'postgres';

const sequelizeOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
};

if (dialect === 'sqlite') {
  sequelizeOptions.storage = process.env.DB_STORAGE || './backend/dev.sqlite';
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'auth_system_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  sequelizeOptions
);

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

/**
 * Sync database models (use migrations in production)
 */
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Database synchronization failed:', error.message);
    return false;
  }
};

export default sequelize;

