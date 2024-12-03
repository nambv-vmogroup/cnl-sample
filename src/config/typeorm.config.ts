
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Dynamically load the environment file from the config folder
const isCompiled = path.extname(__filename) === '.js';
const filePath = isCompiled ? `../../../config/${process.env.NODE_ENV || 'development'}.env` 
  : `../../config/${process.env.NODE_ENV || 'development'}.env`
const envFilePath = path.join(__dirname, filePath);

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
  // migraionsRun: true
};
// Export configuration for NestJS
export const typeOrmConfig = {
  ...baseConfig,
  synchronize: false,
};

// Export configuration for TypeORM CLI
export const dataSourceConfig = new DataSource(baseConfig as DataSourceOptions)