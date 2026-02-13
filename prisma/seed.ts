import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.upsert({
        where: { username: 'admin'},
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
        }
})

console.log("Usuario criado!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());