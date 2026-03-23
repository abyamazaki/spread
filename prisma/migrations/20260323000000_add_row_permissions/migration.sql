-- AlterTable: Add lockedColumns to sheets
ALTER TABLE "spread_sheets" ADD COLUMN "locked_columns" JSONB NOT NULL DEFAULT '[]';

-- AlterTable: Add rowManagerId to rows
ALTER TABLE "spread_rows" ADD COLUMN "row_manager_id" TEXT;

-- AddForeignKey
ALTER TABLE "spread_rows" ADD CONSTRAINT "spread_rows_row_manager_id_fkey" FOREIGN KEY ("row_manager_id") REFERENCES "spread_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
