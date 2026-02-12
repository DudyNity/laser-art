<script lang="ts">
    import { enhance } from '$app/forms';
    
    export let form;
</script>

<div class="container">
    <img src="/Logo.png" alt="Logo" class="logo"/>
    
    <form method="POST" use:enhance>
        <div class="field">
            <label for="username">Usuário</label>
            <input 
                type="text" 
                id="username" 
                name="username" 
                required 
            />
        </div>
        
        <div class="field">
            <label for="password">Senha</label>
            <input 
                type="password" 
                id="password" 
                name="password" 
                required 
            />
        </div>
        
        {#if form?.error}
            <p class="error">{form.error}</p>
        {/if}
        
        <button type="submit">Entrar</button>
    </form>
</div>

<style>
/* Reset e base */
:global(html, body) {
	margin: 0;
	padding: 0;
	width: 100%;
	height: 100%;
}

/* Fundo escuro com partículas sutis */
:global(body) {
	display: flex;
	align-items: center;
	justify-content: center;
	background: radial-gradient(ellipse at top, #2d2d2d, #1a1a1a);
	font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* Card glassmorphism escuro */
.container {
	width: 100%;
	max-width: 420px;
	padding: 40px;
	
	background: rgba(30, 30, 30, 0.6);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	
	border-radius: 24px;
	border: 1px solid rgba(255, 191, 145, 0.2);
	
	box-shadow:
		0 20px 60px rgba(0, 0, 0, 0.5),
		inset 0 1px 0 rgba(255, 191, 145, 0.1);
}

/* Logo */
.logo {
	display: block;
	margin: 0 auto 40px;
	width: 100%;
	max-width: 280px;
	height: auto;
	object-fit: contain;
	filter: drop-shadow(0 8px 24px rgba(255, 154, 82, 0.3));
}

/* Form centralizado */
form {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}

/* Campos */
.field {
	width: 100%;
	max-width: 100%;
	margin-bottom: 24px;
}

/* Label */
label {
	display: block;
	margin-bottom: 8px;
	font-size: 0.9rem;
	font-weight: 500;
	color: #e0e0e0;
	text-align: left;
}

/* Input */
input {
	width: 100%;
	padding: 14px 16px;
	box-sizing: border-box;
	
	background: rgba(40, 40, 40, 0.8);
	border: 1px solid rgba(255, 191, 145, 0.2);
	border-radius: 12px;
	
	font-size: 0.95rem;
	color: #ffffff;
	
	transition: all 0.3s ease;
}

input::placeholder {
	color: #999;
}

input:focus {
	outline: none;
	border-color: #ffbf91;
	background: rgba(50, 50, 50, 0.9);
	box-shadow: 0 0 0 3px rgba(255, 191, 145, 0.15);
}

/* Botão */
button {
	width: 100%;
	margin-top: 12px;
	padding: 14px;
	
	background: linear-gradient(135deg, #ff9a52, #ffbf91);
	color: #1a1a1a;
	
	border: none;
	border-radius: 12px;
	
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	
	box-shadow: 0 4px 16px rgba(255, 154, 82, 0.3);
	transition: all 0.2s ease;
}

button:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(255, 154, 82, 0.5);
}

button:active {
	transform: translateY(0);
	box-shadow: 0 4px 12px rgba(255, 154, 82, 0.4);
}

/* Erro */
.error {
	width: 100%;
	margin-top: 12px;
	padding: 10px;
	text-align: center;
	font-size: 0.9rem;
	color: #ff6b6b;
	background: rgba(255, 107, 107, 0.1);
	border-radius: 8px;
	border: 1px solid rgba(255, 107, 107, 0.2);
	box-sizing: border-box;
}
</style>