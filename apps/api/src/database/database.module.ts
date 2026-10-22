import { Global, Module } from '@nestjs/common';
import { loadEnv } from '../env.js';
import { createDb } from './database.js';

export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => createDb(loadEnv().DATABASE_URL),
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
