/*
  Warnings:

  - You are about to drop the column `orcamento` on the `Pedido` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orcamentoId]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orcamentoId` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "orcamento",
ADD COLUMN     "orcamentoId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Pendente';

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_orcamentoId_key" ON "Pedido"("orcamentoId");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
