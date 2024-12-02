import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1733108230322 implements MigrationInterface {
    name = 'Initial1733108230322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cat" ("id" SERIAL NOT NULL, "name" character varying(500) NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_7704d5c2c0250e4256935ae31b4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "cat"`);
    }

}
