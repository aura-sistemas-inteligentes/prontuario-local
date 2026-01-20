// ============================================
// login-script.js - Lógica da página de login
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('Página de login carregada');
    redirecionarSeAutenticado();
});

function mostrarAba(nomeAba) {
    const abas = document.querySelectorAll('.aba');
    abas.forEach(aba => aba.classList.remove('active'));

    const botoes = document.querySelectorAll('.tab-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    const abaAtiva = document.getElementById(nomeAba);
    if (abaAtiva) {
        abaAtiva.classList.add('active');
    }

    event.target.classList.add('active');

    // Limpa mensagens
    if (nomeAba === 'login') {
        limparMensagem('login-mensagem');
    } else if (nomeAba === 'cadastro') {
        limparMensagem('cadastro-mensagem');
    } else if (nomeAba === 'recuperacao') {
        limparMensagem('recuperacao-mensagem');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const senha = document.getElementById('login-senha').value;

    try {
        desabilitarBotao('btn-login');
        limparMensagem('login-mensagem');

        console.log('Tentando fazer login com:', username);
        
        const dados = await fazerLogin(username, senha);
        console.log('Login bem-sucedido:', dados);
        exibirSucesso('login-mensagem', `Bem-vindo, ${dados.usuario.nome}!`);

        setTimeout(() => {
            console.log('Redirecionando para index.html');
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Erro no login:', error);
        exibirErro('login-mensagem', error.message);
    } finally {
        habilitarBotao('btn-login', 'Entrar');
    }
}

async function handleCadastro(event) {
    event.preventDefault();

    const nome = document.getElementById('cadastro-nome').value;
    const username = document.getElementById('cadastro-username').value;
    const senha = document.getElementById('cadastro-senha').value;
    const pergunta = document.getElementById('cadastro-pergunta').value;
    const resposta = document.getElementById('cadastro-resposta').value;

    try {
        desabilitarBotao('btn-cadastro');
        limparMensagem('cadastro-mensagem');

        if (senha.length < 6) {
            throw new Error('Senha deve ter no mínimo 6 caracteres');
        }

        console.log('Tentando cadastrar:', username);
        
        await fazerCadastro(nome, username, senha, pergunta, resposta);
        console.log('Cadastro bem-sucedido');
        exibirSucesso('cadastro-mensagem', 'Conta criada com sucesso! Faça login agora.');

        setTimeout(() => {
            mostrarAba('login');
            document.getElementById('form-login').reset();
        }, 2000);

    } catch (error) {
        console.error('Erro no cadastro:', error);
        exibirErro('cadastro-mensagem', error.message);
    } finally {
        habilitarBotao('btn-cadastro', 'Criar Conta');
    }
}

async function handleRecuperarSenha(event) {
    event.preventDefault();

    const username = document.getElementById('recuperar-username').value;
    const resposta = document.getElementById('recuperar-resposta').value;
    const novaSenha = document.getElementById('recuperar-nova-senha').value;

    try {
        desabilitarBotao('btn-recuperar');
        limparMensagem('recuperacao-mensagem');

        if (novaSenha.length < 6) {
            throw new Error('Nova senha deve ter no mínimo 6 caracteres');
        }

        console.log('Tentando recuperar senha para:', username);
        
        await recuperarSenha(username, resposta, novaSenha);
        console.log('Senha alterada com sucesso');
        exibirSucesso('recuperacao-mensagem', 'Senha alterada com sucesso! Faça login com sua nova senha.');

        setTimeout(() => {
            mostrarAba('login');
            document.getElementById('form-login').reset();
        }, 2000);

    } catch (error) {
        console.error('Erro ao recuperar senha:', error);
        exibirErro('recuperacao-mensagem', error.message);
    } finally {
        habilitarBotao('btn-recuperar', 'Alterar Senha');
    }
}
