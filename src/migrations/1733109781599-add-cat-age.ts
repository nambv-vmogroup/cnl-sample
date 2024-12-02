import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatAge1733109781599 implements MigrationInterface {
    name = 'AddCatAge1733109781599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cat" ADD "age" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cat" DROP COLUMN "age"`);
    }

}
