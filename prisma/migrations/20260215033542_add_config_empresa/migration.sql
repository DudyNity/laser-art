-- CreateTable
CREATE TABLE "ConfigEmpresa" (
    "id" TEXT NOT NULL DEFAULT 'config',
    "nome" TEXT NOT NULL DEFAULT 'LaserArt',
    "tagline" TEXT NOT NULL DEFAULT 'CORTE A LASER',
    "telefone" TEXT NOT NULL DEFAULT '(47) 99999-9999',
    "email" TEXT NOT NULL DEFAULT 'contato@laserart.com',
    "cnpj" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigEmpresa_pkey" PRIMARY KEY ("id")
);
