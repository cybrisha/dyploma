import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * TwoFactorConfig model for optional 2FA
 * Supports TOTP (Time-based One-Time Password)
 */
const TwoFactorConfig = sequelize.define('TwoFactorConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id'
  },
  secret: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  backupCodes: {
    type: sequelize.getDialect() === 'postgres'
      ? DataTypes.ARRAY(DataTypes.STRING)
      : DataTypes.JSON,
    allowNull: true,
    field: 'backup_codes'
  }
}, {
  tableName: 'two_factor_configs',
  timestamps: true,
  underscored: true
});

export default TwoFactorConfig;

