import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTictactoe1741794680754 implements MigrationInterface {
  name = 'AddTictactoe1741794680754';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "board" json NOT NULL, "playerX" character varying NOT NULL, "playerO" character varying, "winner" character varying, "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "games"`);
  }
}
