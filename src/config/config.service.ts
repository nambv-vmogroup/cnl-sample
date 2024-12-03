import { Inject, Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as Joi from 'joi';

import { CONFIG_OPTIONS } from './constants';
import { ConfigOptions, EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject(CONFIG_OPTIONS) options: ConfigOptions) {
    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    const isCompiled = path.extname(__filename) === '.js';
    const envFile = path.resolve(__dirname, isCompiled ? '../../../': '../../', options.folder, filePath);
    const config = dotenv.parse(fs.readFileSync(envFile));
    this.envConfig = this.validate(config);
  }

  get(key: string): string {
    return this.envConfig[key];
  }

  validate(env: EnvConfig): EnvConfig {
    const joiSchema: Joi.ObjectSchema = Joi.object({
      DB_HOST: Joi.string().required(),
      DB_PORT: Joi.number().default(5432),
      DB_USERNAME: Joi.string().required(),
      DB_PASSWORD: Joi.string().required(),
      DB_NAME: Joi.string().required(),
      DB_TYPE: Joi.string().required(),
    });

    const { error, value } = joiSchema.validate(env);
    if (error) {
      throw new Error(`Config validation invalid: ${error.message}`);
    }
    return value;
  }
}
