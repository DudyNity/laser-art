import { prisma } from "$lib/server/prisma";
import bcrypt from "bcryptjs";
import { fail,redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import path from "path";

export const actions = {
    default: async ({ request, cookies }) => {
        
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');
        const rememberMe = data.get('rememberMe') === 'on';
        
        if (!username || !password) {
            return fail(400, { error: 'Preencha todos os campos' });
        }
        
        const user = await prisma.user.findUnique({
            where: { username: username.toString() }
        });
        
        if (!user) {
            return fail(400, { error: 'Usuário ou senha incorretos' });
        }
        
        const validPassword = await bcrypt.compare(
            password.toString(),
            user.password
        );
        
        if (!validPassword) {
            return fail(400, { error: 'Usuário ou senha incorretos' });
        }
        
        cookies.set('session', user.id, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7
        });
        
        throw redirect(303, '/');
    }
} satisfies Actions;