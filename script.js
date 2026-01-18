// ===== CONFIGURAÇÃO =====
const API_URL = 'http://127.0.0.1:8000';
let tokenAtual = null;
let usuarioAtual = null;
let clienteSelecionado = null;

// ===== FUNÇÕES DE UTILIDADE =====

// Mostrar/Ocultar abas no login
function mostrarAba(abaId) {
    // Ocultar todas as abas
    document.querySelectorAll('.aba').forEach(aba => {
        aba.classList.remove('active');
    });

    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar aba selecionada
    document.getElementById(abaId).classList.add('active');

    // Marcar botão como ativo
    event.target.classList.add('active');
}

// Mostrar/Ocultar seções no dashboard
function mostrarSecao(secaoId) {
    // Ocultar todas as seções
    document.querySelectorAll('.secao').forEach(secao => {
        secao.classList.remove('active');
    });

    // Remover classe active de todos os botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar seção selecionada
    document.getElementById(secaoId).classList.add('active');

    // Marcar botão como ativo
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Carregar dados se necessário
    if (secaoId === 'clientes') {
        carregarClientes();
    }
}

// Mostrar mensagem
function mostrarMensagem(elementoId, mensagem, tipo = 'info') {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.textContent = mensagem;
        elemento.className = `mensagem ${tipo}`;
    }
}

// Fazer requisição à API
async function fazerRequisicao(endpoint, metodo = 'GET', dados = null) {
    const opcoes = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Adicionar token se existir
    if (tokenAtual) {
        opcoes.headers['Authorization'] = `Bearer ${tokenAtual}`;
    }

    // Adicionar corpo se for POST/PUT
    if (dados) {
        opcoes.body = JSON.stringify(dados);
    }

    try {
        const resposta = await fetch(`${API_URL}${endpoint}`, opcoes);
        const dados_resposta = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados_resposta.detail || 'Erro na requisição');
        }

        return dados_resposta;
    } catch (erro) {
        console.error('Erro:', erro);
        throw erro;
    }
}

// ===== AUTENTICAÇÃO =====

// Fazer login
async function fazerLogin(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const senha = document.getElementById('login-senha').value;

    try {
        const resposta = await fazerRequisicao('/auth/login', 'POST', {
            username: username,
            senha: senha
        });

        tokenAtual = resposta.access_token;
        usuarioAtual = resposta.usuario;

        // Salvar no localStorage para persistência
        localStorage.setItem('token', tokenAtual);
        localStorage.setItem('usuario', JSON.stringify(usuarioAtual));

        // Ir para dashboard
        mostrarDashboard();
    } catch (erro) {
        mostrarMensagem('login-mensagem', `Erro: ${erro.message}`, 'erro');
    }
}

// Fazer cadastro
async function fazerCadastro(event) {
    event.preventDefault();

    const nome = document.getElementById('cadastro-nome').value;
    const username = document.getElementById('cadastro-username').value;
    const senha = document.getElementById('cadastro-senha').value;
    const pergunta = document.getElementById('cadastro-pergunta').value;
    const resposta = document.getElementById('cadastro-resposta').value;

    if (senha.length < 6) {
        mostrarMensagem('cadastro-mensagem', 'Senha deve ter no mínimo 6 caracteres', 'erro');
        return;
    }

    try {
        const resposta_api = await fazerRequisicao('/auth/cadastro', 'POST', {
            nome: nome,
            username: username,
            senha: senha,
            pergunta_seguranca: pergunta,
            resposta_seguranca: resposta
        });

        mostrarMensagem('cadastro-mensagem', 'Conta criada com sucesso! Faça login para continuar.', 'sucesso');

        // Limpar formulário
        document.querySelector('.form-cliente').reset();

        // Voltar para aba de login após 2 segundos
        setTimeout(() => {
            document.querySelector('.tab-btn').click();
        }, 2000);
    } catch (erro) {
        mostrarMensagem('cadastro-mensagem', `Erro: ${erro.message}`, 'erro');
    }
}

// Recuperar senha
async function recuperarSenha(event) {
    event.preventDefault();

    const username = document.getElementById('recuperacao-username').value;
    const resposta = document.getElementById('recuperacao-resposta').value;
    const novaSenha = document.getElementById('recuperacao-nova-senha').value;

    if (novaSenha.length < 6) {
        mostrarMensagem('recuperacao-mensagem', 'Nova senha deve ter no mínimo 6 caracteres', 'erro');
        return;
    }

    try {
        await fazerRequisicao('/auth/recuperar-senha', 'POST', {
            username: username,
            resposta_seguranca: resposta,
            nova_senha: novaSenha
        });

        mostrarMensagem('recuperacao-mensagem', 'Senha redefinida com sucesso! Faça login com sua nova senha.', 'sucesso');

        // Limpar formulário
        document.querySelectorAll('#recuperacao input').forEach(input => input.value = '');

        // Voltar para aba de login
        setTimeout(() => {
            document.querySelector('.tab-btn').click();
        }, 2000);
    } catch (erro) {
        mostrarMensagem('recuperacao-mensagem', `Erro: ${erro.message}`, 'erro');
    }
}

// Fazer logout
function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        tokenAtual = null;
        usuarioAtual = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        mostrarLogin();
    }
}

function confirmarLogout() {
    fazerLogout();
}

// ===== NAVEGAÇÃO ENTRE TELAS =====

// Mostrar tela de login
function mostrarLogin() {
    document.body.innerHTML = `
        <div id="login-page"></div>
    `;
    // Recarregar página para voltar ao login.html
    window.location.href = 'login.html';
}

// Mostrar dashboard
function mostrarDashboard() {
    // Atualizar informações do usuário
    document.getElementById('usuario-nome').textContent = `Bem-vindo, ${usuarioAtual.nome}!`;
    document.getElementById('config-username').textContent = usuarioAtual.username;
    document.getElementById('config-nome').textContent = usuarioAtual.nome;
    document.getElementById('config-data').textContent = new Date(usuarioAtual.data_criacao).toLocaleDateString('pt-BR');

    // Mostrar seção de clientes
    mostrarSecao('clientes');
}

// ===== GERENCIAMENTO DE CLIENTES =====

// Carregar lista de clientes
async function carregarClientes() {
    try {
        const resposta = await fazerRequisicao('/clientes/');
        const clientes = resposta;

        const listaElement = document.getElementById('lista-clientes');

        if (clientes.length === 0) {
            listaElement.innerHTML = '<p class="carregando">Nenhum cliente cadastrado ainda.</p>';
            return;
        }

        listaElement.innerHTML = clientes.map(cliente => `
            <div class="cliente-card" onclick="abrirDetalhesCliente(${cliente.id})">
                <h3>${cliente.nome_completo}</h3>
                <p><strong>Email:</strong> ${cliente.email}</p>
                <p><strong>Telefone:</strong> ${cliente.telefone}</p>
                <p><strong>Status:</strong> ${cliente.status}</p>
            </div>
        `).join('');
    } catch (erro) {
        document.getElementById('lista-clientes').innerHTML = `<p class="carregando">Erro ao carregar clientes: ${erro.message}</p>`;
    }
}

// Filtrar clientes
function filtrarClientes() {
    const busca = document.getElementById('busca-cliente').value.toLowerCase();
    const cards = document.querySelectorAll('.cliente-card');

    cards.forEach(card => {
        const nome = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = nome.includes(busca) ? 'block' : 'none';
    });
}

// Cadastrar novo cliente
async function cadastrarCliente(event) {
    event.preventDefault();

    const nome = document.getElementById('cliente-nome').value;
    const email = document.getElementById('cliente-email').value;
    const telefone = document.getElementById('cliente-telefone').value;
    const dataNasc = document.getElementById('cliente-data-nasc').value;
    const endereco = document.getElementById('cliente-endereco').value;

    try {
        const resposta = await fazerRequisicao('/clientes/', 'POST', {
            nome_completo: nome,
            email: email,
            telefone: telefone,
            data_nascimento: dataNasc,
            endereco: endereco
        });

        mostrarMensagem('cadastro-cliente-mensagem', 'Cliente cadastrado com sucesso!', 'sucesso');

        // Limpar formulário
        document.querySelector('.form').reset();

        // Recarregar lista
        setTimeout(() => {
            mostrarSecao('clientes');
        }, 1500);
    } catch (erro) {
        mostrarMensagem('cadastro-cliente-mensagem', `Erro: ${erro.message}`, 'erro');
    }
}

// Abrir detalhes do cliente
async function abrirDetalhesCliente(clienteId) {
    try {
        const resposta = await fazerRequisicao(`/clientes/${clienteId}/`);
        clienteSelecionado = resposta;

        // Preencher informações
        document.getElementById('detalhes-nome').textContent = resposta.nome_completo;
        document.getElementById('detalhes-codigo').textContent = resposta.codigo_cliente;
        document.getElementById('detalhes-email').textContent = resposta.email;
        document.getElementById('detalhes-telefone').textContent = resposta.telefone;
        document.getElementById('detalhes-data-nasc').textContent = new Date(resposta.data_nascimento).toLocaleDateString('pt-BR');
        document.getElementById('detalhes-endereco').textContent = resposta.endereco || '-';

        // Carregar atendimentos
        carregarAtendimentos(clienteId);

        // Mostrar seção de detalhes
        mostrarSecao('detalhes-cliente');
    } catch (erro) {
        alert(`Erro ao carregar cliente: ${erro.message}`);
    }
}

// ===== GERENCIAMENTO DE ATENDIMENTOS =====

// Carregar atendimentos de um cliente
async function carregarAtendimentos(clienteId) {
    try {
        const resposta = await fazerRequisicao(`/clientes/${clienteId}/atendimentos/`);
        const atendimentos = resposta;

        const listaElement = document.getElementById('lista-atendimentos');

        if (atendimentos.length === 0) {
            listaElement.innerHTML = '<p class="carregando">Nenhum atendimento registrado.</p>';
            return;
        }

        listaElement.innerHTML = atendimentos.map(atendimento => `
            <div class="atendimento-item">
                <h4>${new Date(atendimento.data_atendimento).toLocaleDateString('pt-BR')} - ${atendimento.duracao_minutos}min</h4>
                <p>${atendimento.conteudo}</p>
                <p style="color: #999; font-size: 12px;">Registrado em: ${new Date(atendimento.data_registro).toLocaleDateString('pt-BR')}</p>
            </div>
        `).join('');
    } catch (erro) {
        document.getElementById('lista-atendimentos').innerHTML = `<p class="carregando">Erro ao carregar atendimentos</p>`;
    }
}

// Salvar atendimento
async function salvarAtendimento() {
    if (!clienteSelecionado) {
        alert('Nenhum cliente selecionado');
        return;
    }

    const data = document.getElementById('atendimento-data').value;
    const duracao = document.getElementById('atendimento-duracao').value;
    const conteudo = document.getElementById('atendimento-conteudo').value;

    if (!data || !duracao || !conteudo) {
        mostrarMensagem('atendimento-mensagem', 'Preencha todos os campos', 'erro');
        return;
    }

    try {
        await fazerRequisicao(`/clientes/${clienteSelecionado.id}/atendimentos/`, 'POST', {
            data_atendimento: new Date(data).toISOString(),
            duracao_minutos: parseInt(duracao),
            conteudo: conteudo
        });

        mostrarMensagem('atendimento-mensagem', 'Atendimento registrado com sucesso!', 'sucesso');

        // Limpar formulário
        document.getElementById('atendimento-data').value = '';
        document.getElementById('atendimento-duracao').value = '50';
        document.getElementById('atendimento-conteudo').value = '';

        // Recarregar atendimentos
        setTimeout(() => {
            carregarAtendimentos(clienteSelecionado.id);
        }, 1000);
    } catch (erro) {
        mostrarMensagem('atendimento-mensagem', `Erro: ${erro.message}`, 'erro');
    }
}

// ===== BACKUP =====

function fazerBackup() {
    alert('Funcionalidade de backup será implementada em breve!');
}

// ===== INICIALIZAÇÃO =====

// Verificar se há token salvo ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    const tokenSalvo = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('usuario');

    if (tokenSalvo && usuarioSalvo) {
        tokenAtual = tokenSalvo;
        usuarioAtual = JSON.parse(usuarioSalvo);
        mostrarDashboard();
    }
});