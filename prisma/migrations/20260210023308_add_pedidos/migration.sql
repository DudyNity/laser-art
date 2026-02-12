-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "orcamento" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataEntrega" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);
