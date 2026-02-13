-- AlterTable
ALTER TABLE "User" ADD COLUMN "clienteId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_clienteId_key" ON "User"("clienteId");
