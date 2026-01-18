// ============================================
// auth.js - Gerenciamento Centralizado de Autenticação
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000';

async function fazerLogin(username, senha ) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, senha })
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao fazer login');
        }

        const dados = await response.json();
        localStorage.setItem('token', dados.access_token);
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
        console.log('✅ Login bem-sucedido!');
        return dados;
    } catch (error) {
        console.error('❌ Erro no login:', error);
        throw error;
    }
}

async function fazerCadastro(username, nome, senha, pergunta_seguranca, resposta_seguranca) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                nome,
                senha,
                pergunta_seguranca,
                resposta_seguranca
            })
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao cadastrar');
        }

        const dados = await response.json();
        localStorage.setItem('token', dados.access_token);
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
        console.log('✅ Cadastro bem-sucedido!');
        return dados;
    } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        throw error;
    }
}

async function recuperarSenha(username, resposta_seguranca, nova_senha) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/recuperar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                resposta_seguranca,
                nova_senha
            })
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao recuperar senha');
        }

        console.log('✅ Senha alterada com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao recuperar senha:', error);
        throw error;
    }
}

function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    console.log('✅ Logout realizado!');
    window.location.href = 'login.html';
}

function obterToken() {
    return localStorage.getItem('token');
}

function obterUsuarioAtual() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

function estaAutenticado() {
    return !!obterToken();
}

function verificarAutenticacao() {
    if (!estaAutenticado()) {
        console.log('⚠️ Usuário não autenticado. Redirecionando para login...');
        window.location.href = 'login.html';
    }
}

function redirecionarSeAutenticado() {
    if (estaAutenticado()) {
        console.log('✅ Usuário já autenticado. Redirecionando para dashboard...');
        window.location.href = 'index.html';
    }
}

async function fazerRequisicaoAutenticada(url, opcoes = {}) {
    const token = obterToken();
    
    if (!token) {
        throw new Error('Usuário não autenticado');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...opcoes.headers
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...opcoes,
        headers
    });

    if (response.status === 401) {
        fazerLogout();
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    return response;
}

function limparMensagem(elementoId) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.textContent = '';
        elemento.className = '';
    }
}

function exibirErro(elementoId, mensagem) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.textContent = `❌ ${mensagem}`;
        elemento.className = 'erro';
    }
    console.error('Erro:', mensagem);
}

function exibirSucesso(elementoId, mensagem) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.textContent = `✅ ${mensagem}`;
        elemento.className = 'sucesso';
    }
    console.log('Sucesso:', mensagem);
}

function desabilitarBotao(botaoId, desabilitar = true) {
    const botao = document.getElementById(botaoId);
    if (botao) {
        botao.disabled = desabilitar;
        if (desabilitar) {
            botao.textContent = '⏳ Aguarde...';
        }
    }
}

function habilitarBotao(botaoId, textoPadrao) {
    const botao = document.getElementById(botaoId);
    if (botao) {
        botao.disabled = false;
        botao.textContent = textoPadrao;
    }
}
