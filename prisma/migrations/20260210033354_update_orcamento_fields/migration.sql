/*
  Warnings:

  - You are about to drop the column `valor` on the `Orcamento` table. All the data in the column will be lost.
  - Added the required column `subtotal` to the `Orcamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valorFinal` to the `Orcamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Orcamento" DROP COLUMN "valor",
ADD COLUMN     "gastosAdicionais" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "itensDetalhados" TEXT,
ADD COLUMN     "margemLucro" DOUBLE PRECISION NOT NULL DEFAULT 30,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "valorFinal" DOUBLE PRECISION NOT NULL;
