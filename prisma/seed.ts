import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
    adapter: null as any
});

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