-- Migration: Converter precoM2 (R$/m²) para precoMm2 (R$/mm²)

-- Etapa 1: Criar coluna temporária com os valores convertidos
ALTER TABLE "Material" ADD COLUMN "precoMm2" DOUBLE PRECISION;

-- Etapa 2: Copiar valores convertidos (dividir por 1.000.000)
-- 1 m² = 1.000.000 mm²
UPDATE "Material" SET "precoMm2" = "precoM2" / 1000000.0;

-- Etapa 3: Tornar a nova coluna obrigatória (NOT NULL)
ALTER TABLE "Material" ALTER COLUMN "precoMm2" SET NOT NULL;

-- Etapa 4: Remover a coluna antiga
ALTER TABLE "Material" DROP COLUMN "precoM2";