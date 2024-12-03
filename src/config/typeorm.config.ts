
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Dynamically load the environment file from the config folder
const envFilePath = path.join(
  __dirname,
  `../../config/${process.env.NODE_ENV || 'development'}.env`
);

// Load environment variables
dotenv.config({ path: envFilePath });
const baseConfig = {
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
};

// Export configuration for NestJS
export const typeOrmConfig = {
  ...baseConfig,
  synchronize: false,
  migrationsRun: false, // Enable in tests if needed
};

// Export configuration for TypeORM CLI
export const dataSourceConfig = new DataSource(baseConfig as DataSourceOptions)