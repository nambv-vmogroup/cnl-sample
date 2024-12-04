import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtCat1733195754527 implements MigrationInterface {
  name = 'AddCreatedAtCat1733195754527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cat" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cat" DROP COLUMN "createdAt"`);
  }
}
