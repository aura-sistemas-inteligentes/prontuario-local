// ============================================
// dashboard-script.js - Lógica do dashboard
// ============================================

// Verifica autenticação ao carregar página
window.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard carregado');
    verificarAutenticacao();
    
    // Carrega dados do usuário
    const usuario = obterUsuarioAtual();
    if (usuario) {
        document.getElementById('nome-usuario').textContent = `Olá, ${usuario.nome}`;
    }

    // Carrega dados do dashboard
    buscarClientes();
    buscarAniversariantes();
});

// ============================================
// FUNÇÕES DE CLIENTES
// ============================================

async function buscarClientes() {
    try {
        const response = await fazerRequisicaoAutenticada('/clientes/');
        
        if (!response.ok) {
            throw new Error('Erro ao buscar clientes');
        }

        const clientes = await response.json();
        exibirClientes(clientes);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        document.getElementById('lista-clientes').innerHTML = 
            `<li>❌ Erro ao carregar clientes: ${error.message}</li>`;
    }
}

function exibirClientes(clientes) {
    const lista = document.getElementById('lista-clientes');
    lista.innerHTML = '';

    if (clientes.length === 0) {
        lista.innerHTML = '<li>Nenhum cliente cadastrado ainda.</li>';
        return;
    }

    clientes.forEach(cliente => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `detalhe.html?id=${cliente.id}`;
        link.textContent = `(${cliente.codigo_cliente}) - ${cliente.nome_completo}`;
        item.appendChild(link);
        lista.appendChild(item);
    });
}

async function handleCadastroCliente(event) {
    event.preventDefault();

    const dadosCliente = {
        nome_completo: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        data_nascimento: document.getElementById('data_nascimento').value,
        endereco: document.getElementById('endereco').value || null
    };

    try {
        desabilitarBotao('btn-cadastro-cliente');
        limparMensagem('mensagem-status');

        const response = await fazerRequisicaoAutenticada('/clientes/', {
            method: 'POST',
            body: JSON.stringify(dadosCliente)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao cadastrar cliente');
        }

        const novoCliente = await response.json();
        exibirSucesso('mensagem-status', 
            `Cliente '${novoCliente.nome_completo}' cadastrado com sucesso!`);

        document.getElementById('form-cadastro-cliente').reset();
        
        // Recarrega lista de clientes após 1 segundo
        setTimeout(() => {
            buscarClientes();
        }, 1000);

    } catch (error) {
        exibirErro('mensagem-status', error.message);
    } finally {
        habilitarBotao('btn-cadastro-cliente', 'Cadastrar Cliente');
    }
}

// ============================================
// FUNÇÕES DE ANIVERSARIANTES
// ============================================

async function buscarAniversariantes() {
    try {
        const response = await fazerRequisicaoAutenticada('/clientes/aniversariantes-proximos-30-dias/');
        
        if (!response.ok) {
            throw new Error('Erro ao buscar aniversariantes');
        }

        const aniversariantes = await response.json();
        exibirAniversariantes(aniversariantes);
    } catch (error) {
        console.error('Erro ao buscar aniversariantes:', error);
        document.getElementById('lista-aniversariantes').innerHTML = 
            `<li>❌ Erro ao carregar: ${error.message}</li>`;
    }
}

function exibirAniversariantes(aniversariantes) {
    const lista = document.getElementById('lista-aniversariantes');
    lista.innerHTML = '';

    if (aniversariantes.length === 0) {
        lista.innerHTML = '<li>Nenhum aniversariante nos próximos 30 dias.</li>';
        return;
    }

    aniversariantes.forEach(cliente => {
        const diaAniversario = new Date(cliente.data_nascimento + 'T00:00:00').getDate();
        const item = document.createElement('li');
        item.textContent = `Dia ${diaAniversario} - ${cliente.nome_completo}`;
        lista.appendChild(item);
    });
}
function mostrarSecao(secaoId) {
    const secoes = document.querySelectorAll('.secao');
    secoes.forEach(secao => secao.classList.remove('active'));

    const botoes = document.querySelectorAll('.nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    const secaoAtiva = document.getElementById(secaoId);
    if (secaoAtiva) {
        secaoAtiva.classList.add('active');
    }

    event.target.classList.add('active');
}
