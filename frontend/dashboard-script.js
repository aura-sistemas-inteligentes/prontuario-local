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
        document.getElementById('config-username').textContent = usuario.username;
        document.getElementById('config-nome').textContent = usuario.nome;
        
        if (usuario.data_criacao) {
            const dataCriacao = new Date(usuario.data_criacao);
            const dataFormatada = dataCriacao.toLocaleDateString('pt-BR');
            document.getElementById('config-data').textContent = dataFormatada;
        }
    }

    // NÃO carrega clientes automaticamente
    // Carrega aniversariantes automaticamente
    buscarAniversariantes();
});

// ============================================
// FUNÇÕES DE NAVEGAÇÃO
// ============================================

function mostrarSecao(secaoId, event) {
    if (event) {
        event.preventDefault();
    }
    
    const secoes = document.querySelectorAll('.secao');
    secoes.forEach(secao => secao.classList.remove('active'));

    const botoes = document.querySelectorAll('.nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    const secaoAtiva = document.getElementById(secaoId);
    if (secaoAtiva) {
        secaoAtiva.classList.add('active');
    }

    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// ============================================
// FUNÇÕES DE CLIENTES
// ============================================

async function buscarClientes() {
    try {
        document.getElementById('status-clientes').textContent = '⏳ Carregando clientes...';
        
        const response = await fazerRequisicaoAutenticada('/clientes/');
        
        if (!response.ok) {
            throw new Error('Erro ao buscar clientes');
        }

        const clientes = await response.json();
        document.getElementById('status-clientes').textContent = '';
        exibirClientes(clientes);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        document.getElementById('status-clientes').textContent = `❌ ${error.message}`;
    }
}

function exibirClientes(clientes) {
    const lista = document.getElementById('lista-clientes');
    lista.innerHTML = '';

    if (clientes.length === 0) {
        lista.innerHTML = '<p>Nenhum cliente cadastrado ainda.</p>';
        return;
    }

    clientes.forEach(cliente => {
        const card = document.createElement('div');
        card.className = 'cliente-card';
        card.onclick = () => window.location.href = `detalhe.html?id=${cliente.id}`;
        
        card.innerHTML = `
            <h3>${cliente.nome_completo}</h3>
            <p><strong>Código:</strong> ${cliente.codigo_cliente}</p>
            <p><strong>Email:</strong> ${cliente.email}</p>
            <p><strong>Telefone:</strong> ${cliente.telefone}</p>
        `;
        
        lista.appendChild(card);
    });
}

function filtrarClientes() {
    const busca = document.getElementById('busca-cliente').value.toLowerCase().trim();
    
    if (busca.length === 0) {
        // Se limpou a busca, limpa a lista
        document.getElementById('lista-clientes').innerHTML = '';
        return;
    }
    
    if (busca.length < 3) {
        // Não busca com menos de 3 caracteres
        return;
    }
    
    const cards = document.querySelectorAll('.cliente-card');
    
    if (cards.length === 0) {
        // Se não tem clientes carregados, carrega ao digitar
        buscarClientes();
        return;
    }

    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        if (texto.includes(busca)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
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
            mostrarSecao('clientes');
        }, 1500);

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
            const erro = await response.json();
            console.error('❌ Erro completo:', JSON.stringify(erro, null, 2));
            
            // Se for array de erros (validação)
            if (Array.isArray(erro.detail)) {
                const mensagens = erro.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
                throw new Error(`Erro de validação: ${mensagens}`);
            }
            
            throw new Error(erro.detail || `Erro ${response.status}`);
        }

        const aniversariantes = await response.json();
        exibirAniversariantes(aniversariantes);
    } catch (error) {
        console.error('❌ Erro ao buscar aniversariantes:', error.message);
    }
}



function exibirAniversariantes(aniversariantes) {
    const lista = document.getElementById('lista-aniversariantes');
    lista.innerHTML = '';

    if (aniversariantes.length === 0) {
        lista.innerHTML = '<p>Nenhum aniversariante nos próximos 30 dias.</p>';
        return;
    }

    aniversariantes.forEach(cliente => {
        const diaAniversario = new Date(cliente.data_nascimento + 'T00:00:00').getDate();
        const item = document.createElement('div');
        item.className = 'cliente-card';
        
        item.innerHTML = `
            <h3>${cliente.nome_completo}</h3>
            <p><strong>Aniversário:</strong> Dia ${diaAniversario}</p>
        `;
        
        lista.appendChild(item);
    });
}
