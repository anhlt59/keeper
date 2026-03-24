-- CreateTable
CREATE TABLE "AssetAttributeValue" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "values" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetAttributeValue_assetId_key" ON "AssetAttributeValue"("assetId");

-- CreateIndex
CREATE INDEX "AssetAttributeValue_assetId_idx" ON "AssetAttributeValue"("assetId");

-- AddForeignKey
ALTER TABLE "AssetAttributeValue" ADD CONSTRAINT "AssetAttributeValue_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
