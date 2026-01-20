// ============================================
// detalhe-script.js - Lógica da página de detalhes
// ============================================

let clienteIdGlobal = null;

window.addEventListener('DOMContentLoaded', () => {
    console.log('Página de detalhes carregada');
    verificarAutenticacao();

    // Extrai ID do cliente da URL
    const params = new URLSearchParams(window.location.search);
    clienteIdGlobal = params.get('id');

    if (!clienteIdGlobal) {
        document.body.innerHTML = "<h1>❌ Erro: ID do cliente não fornecido.</h1>";
        return;
    }

    // Carrega dados do usuário
    const usuario = obterUsuarioAtual();
    if (usuario) {
        document.getElementById('usuario-nome').textContent = `Olá, ${usuario.nome}`;
    }

    // Carrega informações do cliente
    buscarInfoCliente(clienteIdGlobal);
    
    // Carrega atendimentos automaticamente
    buscarAtendimentos();
});

// ============================================
// FUNÇÕES DE CLIENTE
// ============================================

async function buscarInfoCliente(clienteId) {
    try {
        const response = await fazerRequisicaoAutenticada(`/clientes/${clienteId}/`);
        
        if (!response.ok) {
            throw new Error('Cliente não encontrado');
        }

        const cliente = await response.json();
        exibirInfoCliente(cliente);
    } catch (error) {
        console.error('Erro ao buscar info do cliente:', error);
        document.getElementById('cliente-nome').textContent = `❌ ${error.message}`;
    }
}

function exibirInfoCliente(cliente) {
    document.getElementById('cliente-nome').textContent = cliente.nome_completo;
    document.getElementById('cliente-codigo').textContent = cliente.codigo_cliente;
    document.getElementById('cliente-email').textContent = cliente.email;
    document.getElementById('cliente-telefone').textContent = cliente.telefone;
    document.getElementById('cliente-data-nasc').textContent = new Date(cliente.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR');
    document.getElementById('cliente-endereco').textContent = cliente.endereco || 'Não informado';
}

// ============================================
// FUNÇÕES DE ATENDIMENTOS
// ============================================

async function buscarAtendimentos() {
    try {
        const lista = document.getElementById('lista-atendimentos');
        lista.innerHTML = '<p class="carregando">⏳ Carregando atendimentos...</p>';

        const response = await fazerRequisicaoAutenticada(`/clientes/${clienteIdGlobal}/atendimentos/`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar atendimentos');
        }

        const atendimentos = await response.json();
        exibirAtendimentos(atendimentos);
    } catch (error) {
        console.error('Erro ao buscar atendimentos:', error);
        document.getElementById('lista-atendimentos').innerHTML = 
            `<p>❌ ${error.message}</p>`;
    }
}

function exibirAtendimentos(atendimentos) {
    const lista = document.getElementById('lista-atendimentos');
    lista.innerHTML = '';

    if (atendimentos.length === 0) {
        lista.innerHTML = '<p>Nenhum atendimento registrado.</p>';
        return;
    }

    atendimentos.forEach(atendimento => {
        const div = document.createElement('div');
        div.className = 'atendimento-item';
        
        const data = new Date(atendimento.data_atendimento + 'T00:00:00').toLocaleDateString('pt-BR');
        
        div.innerHTML = `
            <div class="atendimento-header">
                <strong>📅 ${data}</strong>
                <span class="duracao">${atendimento.duracao_minutos} min</span>
            </div>
            <div class="atendimento-conteudo">
                ${atendimento.conteudo}
            </div>
        `;
        
        lista.appendChild(div);
    });
}

async function handleSalvarAtendimento(event) {
    event.preventDefault();

    const data = document.getElementById('data-atendimento').value;
    const duracao = document.getElementById('duracao-minutos').value;
    const conteudo = document.getElementById('conteudo-atendimento').value;

    if (!data || !duracao || !conteudo) {
        exibirErro('mensagem-atendimento', 'Preencha todos os campos!');
        return;
    }

    // Extrai apenas a data (sem a hora)
    const dataSomente = new Date(data).toISOString().split('T')[0];

    const dadosAtendimento = {
        data_atendimento: dataSomente,
        conteudo: conteudo,
        duracao_minutos: parseInt(duracao)
    };

    console.log('Enviando atendimento:', dadosAtendimento);

    try {
        desabilitarBotao('btn-salvar-atendimento');

        const response = await fazerRequisicaoAutenticada(`/clientes/${clienteIdGlobal}/atendimentos/`, {
            method: 'POST',
            body: JSON.stringify(dadosAtendimento)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao registrar atendimento');
        }

        exibirSucesso('mensagem-atendimento', 'Atendimento registrado com sucesso!');
        
        // Limpa formulário
        document.getElementById('form-atendimento').reset();
        
        // Recarrega lista de atendimentos
        setTimeout(() => {
            buscarAtendimentos();
        }, 1000);

    } catch (error) {
        exibirErro('mensagem-atendimento', error.message);
    } finally {
        habilitarBotao('btn-salvar-atendimento', 'Salvar Atendimento');
    }
}

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
