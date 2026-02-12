import bcrypt from "bcryptjs";

const senha = "admin123";
const hash = await bcrypt.hash(senha, 10);


console.log("Senha:", senha);
console.log("Hash:", hash);