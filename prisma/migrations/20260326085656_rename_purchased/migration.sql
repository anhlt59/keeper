/*
  Warnings:

  - The values [PURCHASED,IN_USE] on the enum `AssetStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssetStatus_new" AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED', 'DISPOSED');
ALTER TABLE "public"."Asset" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Asset" ALTER COLUMN "status" TYPE "AssetStatus_new" USING ("status"::text::"AssetStatus_new");
ALTER TABLE "AssetEvent" ALTER COLUMN "fromStatus" TYPE "AssetStatus_new" USING ("fromStatus"::text::"AssetStatus_new");
ALTER TABLE "AssetEvent" ALTER COLUMN "toStatus" TYPE "AssetStatus_new" USING ("toStatus"::text::"AssetStatus_new");
ALTER TYPE "AssetStatus" RENAME TO "AssetStatus_old";
ALTER TYPE "AssetStatus_new" RENAME TO "AssetStatus";
DROP TYPE "public"."AssetStatus_old";
ALTER TABLE "Asset" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterTable
ALTER TABLE "Asset" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
