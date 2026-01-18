// ============================================
// login-script.js - Lógica da página de login
// ============================================

// Redireciona para dashboard se já estiver autenticado
window.addEventListener('DOMContentLoaded', () => {
    console.log('Página de login carregada');
    redirecionarSeAutenticado();
});

// ============================================
// FUNÇÕES DE NAVEGAÇÃO ENTRE ABAS
// ============================================

function mostrarAba(nomeAba) {
    // Esconde todas as abas
    const abas = document.querySelectorAll('.tab-content');
    abas.forEach(aba => aba.classList.remove('active'));

    // Remove classe active de todos os botões
    const botoes = document.querySelectorAll('.tab-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    // Mostra a aba selecionada
    const abaAtiva = document.getElementById(`aba-${nomeAba}`);
    if (abaAtiva) {
        abaAtiva.classList.add('active');
    }

    // Marca o botão como ativo
    event.target.classList.add('active');

    // Limpa mensagens
    limparMensagem(`mensagem-${nomeAba}`);
}

// ============================================
// HANDLER DE LOGIN
// ============================================

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const senha = document.getElementById('login-senha').value;
    const btnLogin = document.getElementById('btn-login');

    try {
        desabilitarBotao('btn-login');
        limparMensagem('mensagem-login');

        // Faz login
        const dados = await fazerLogin(username, senha);

        exibirSucesso('mensagem-login', `Bem-vindo, ${dados.usuario.nome}!`);

        // Aguarda 1 segundo e redireciona
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        exibirErro('mensagem-login', error.message);
        habilitarBotao('btn-login', 'Entrar');
    }
}

// ============================================
// HANDLER DE CADASTRO
// ============================================

async function handleCadastro(event) {
    event.preventDefault();

    const username = document.getElementById('cadastro-username').value;
    const nome = document.getElementById('cadastro-nome').value;
    const senha = document.getElementById('cadastro-senha').value;
    const pergunta = document.getElementById('cadastro-pergunta').value;
    const resposta = document.getElementById('cadastro-resposta').value;

    try {
        desabilitarBotao('btn-cadastro');
        limparMensagem('mensagem-cadastro');

        // Valida senha
        if (senha.length < 6) {
            throw new Error('Senha deve ter no mínimo 6 caracteres');
        }

        // Faz cadastro
        const dados = await fazerCadastro(username, nome, senha, pergunta, resposta);

        exibirSucesso('mensagem-cadastro', `Conta criada com sucesso! Bem-vindo, ${dados.usuario.nome}!`);

        // Aguarda 1 segundo e redireciona
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        exibirErro('mensagem-cadastro', error.message);
        habilitarBotao('btn-cadastro', 'Criar Conta');
    }
}

// ============================================
// HANDLER DE RECUPERAÇÃO DE SENHA
// ============================================

async function handleRecuperarSenha(event) {
    event.preventDefault();

    const username = document.getElementById('recuperar-username').value;
    const resposta = document.getElementById('recuperar-resposta').value;
    const novaSenha = document.getElementById('recuperar-nova-senha').value;

    try {
        desabilitarBotao('btn-recuperar');
        limparMensagem('mensagem-recuperar');

        // Valida senha
        if (novaSenha.length < 6) {
            throw new Error('Nova senha deve ter no mínimo 6 caracteres');
        }

        // Recupera senha
        await recuperarSenha(username, resposta, novaSenha);

        exibirSucesso('mensagem-recuperar', 'Senha alterada com sucesso! Faça login com sua nova senha.');

        // Aguarda 2 segundos e volta para login
        setTimeout(() => {
            mostrarAba('login');
            document.getElementById('form-login').reset();
        }, 2000);

    } catch (error) {
        exibirErro('mensagem-recuperar', error.message);
        habilitarBotao('btn-recuperar', 'Alterar Senha');
    }
}
