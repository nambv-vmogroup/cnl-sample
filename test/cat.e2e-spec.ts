import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CatModule } from '../src/modules/cat/cat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { dataSourceConfig } from '../src/config/typeorm.config';
describe('CatModule (e2e)', () => {
  let app: INestApplication;
  let container: StartedTestContainer;

  beforeAll(async () => {
    container = await new GenericContainer('postgres')
      .withEnvironment({
        POSTGRES_USER: process.env.DB_USERNAME,
        POSTGRES_PASSWORD: process.env.DB_PASSWORD,
        POSTGRES_DB: process.env.DB_NAME,
      })
      .withExposedPorts(5432)
      .start();

      dataSourceConfig.setOptions({
        host: container.getHost(),
        port: container.getMappedPort(5432),
      });
  
      await dataSourceConfig.initialize();
      await dataSourceConfig.runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CatModule,
        TypeOrmModule.forRoot(dataSourceConfig.options),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
    await dataSourceConfig.destroy();
  });

  it('/cats (GET)', () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .then((response) => {
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toEqual(0);
      });
  });

  it('/cats (POST)', () => {
    return request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'Tom', age: 3, description: 'a new cat' })
      .expect(201)
      .then((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toBe('Tom');
        expect(response.body.age).toBe(3);
      });
  });

  it('/cats (GET)', async () => {
    const catRepository = dataSourceConfig.getRepository('Cat');
    await catRepository.save({ name: 'Tom', age: 3, description: 'a new cat' });
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'Spike', age: 5, description: 'yet another cat' })
      .expect(201);
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .then((response) => {
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(2);
      });
  });
});