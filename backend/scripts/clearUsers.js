import dotenv from 'dotenv';
import sequelize, { testConnection } from '../config/database.js';
import User from '../models/User.js';
import TwoFactorConfig from '../models/TwoFactorConfig.js';
import LogEntry from '../models/LogEntry.js';
import '../models/index.js';

dotenv.config({ quiet: true });

/**
 * Script to delete all users and their related configurations
 * This will delete:
 * - All TwoFactorConfig records
 * - All LogEntry records
 * - All User records
 */
const clearUsers = async () => {
  try {
    console.log('🗑️  Starting user cleanup...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    // Get counts before deletion
    const userCount = await User.count();
    const twoFactorCount = await TwoFactorConfig.count();
    const logEntryCount = await LogEntry.count();

    console.log(`\n📊 Current database state:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   TwoFactorConfigs: ${twoFactorCount}`);
    console.log(`   LogEntries: ${logEntryCount}`);

    if (userCount === 0 && twoFactorCount === 0 && logEntryCount === 0) {
      console.log('\n✅ Database is already empty. Nothing to delete.');
      await sequelize.close();
      process.exit(0);
    }

    // Delete in order to respect foreign key constraints
    console.log('\n🗑️  Deleting records...');

    // 1. Delete TwoFactorConfig records first (references users)
    if (twoFactorCount > 0) {
      const deletedTwoFactor = await TwoFactorConfig.destroy({
        where: {},
        truncate: false
      });
      console.log(`   ✅ Deleted ${deletedTwoFactor} TwoFactorConfig record(s)`);
    }

    // 2. Delete LogEntry records (references users)
    if (logEntryCount > 0) {
      const deletedLogs = await LogEntry.destroy({
        where: {},
        truncate: false
      });
      console.log(`   ✅ Deleted ${deletedLogs} LogEntry record(s)`);
    }

    // 3. Delete User records
    if (userCount > 0) {
      const deletedUsers = await User.destroy({
        where: {},
        truncate: false
      });
      console.log(`   ✅ Deleted ${deletedUsers} User record(s)`);
    }

    // Verify deletion
    const remainingUsers = await User.count();
    const remainingTwoFactor = await TwoFactorConfig.count();
    const remainingLogs = await LogEntry.count();

    console.log('\n✅ User cleanup completed successfully!');
    console.log(`\n📊 Remaining records:`);
    console.log(`   Users: ${remainingUsers}`);
    console.log(`   TwoFactorConfigs: ${remainingTwoFactor}`);
    console.log(`   LogEntries: ${remainingLogs}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

clearUsers();

