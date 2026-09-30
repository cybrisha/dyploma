import dotenv from 'dotenv';
import sequelize, { testConnection, syncDatabase } from '../config/database.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import '../models/index.js';

dotenv.config({ quiet: true });

/**
 * Seed script to populate database with initial data
 */
const seed = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    // Sync database
    await syncDatabase(false);

    // Create roles
    console.log('📝 Creating roles...');
    const roles = [
      { name: 'admin', description: 'Full system access' },
      { name: 'operator', description: 'Operator access' },
      { name: 'viewer', description: 'Read-only access' }
    ];

    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });
      console.log(`${created ? '✅ Created' : '⏭️  Exists'}: Role ${role.name}`);
    }

    // Create default users
    console.log('👤 Creating default users...');
    
    const defaultUsers = [
      {
        login: 'admin',
        password: 'Admin123!',
        name: 'System Administrator',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active'
      },
      {
        login: 'operator',
        password: 'Operator123!',
        name: 'System Operator',
        email: 'operator@example.com',
        role: 'operator',
        status: 'active'
      },
      {
        login: 'viewer',
        password: 'Viewer123!',
        name: 'System Viewer',
        email: 'viewer@example.com',
        role: 'viewer',
        status: 'active'
      }
    ];

    for (const userData of defaultUsers) {
      const [user, created] = await User.findOrCreate({
        where: { login: userData.login },
        defaults: {
          ...userData,
          passwordHash: userData.password // Will be hashed by hook
        }
      });
      console.log(`${created ? '✅ Created' : '⏭️  Exists'}: User ${user.login} (${user.role})`);
    }

    console.log('✅ Database seed completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Admin:   login=admin, password=Admin123!');
    console.log('   Operator: login=operator, password=Operator123!');
    console.log('   Viewer:  login=viewer, password=Viewer123!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seed();

