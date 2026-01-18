// ============================================
// detalhe-script.js - Lógica da página de detalhes do cliente
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('Página de detalhes carregada');
    verificarAutenticacao();

    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');

    if (!clienteId) {
        document.body.innerHTML = "<h1>❌ Erro: ID do cliente não fornecido.</h1>";
        return;
    }

    // Carrega dados do usuário
    const usuario = obterUsuarioAtual();
    if (usuario) {
        document.getElementById('nome-usuario').textContent = `Olá, ${usuario.nome}`;
    }

    // Carrega informações do cliente
    buscarInfoCliente(clienteId);
    buscarSessoesCliente(clienteId);
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
        document.getElementById('info-cliente').innerHTML = 
            `<p>❌ ${error.message}</p>`;
    }
}

function exibirInfoCliente(cliente) {
    const infoContainer = document.getElementById('info-cliente');
    const dataNascimento = new Date(cliente.data_nascimento + 'T00:00:00')
        .toLocaleDateString('pt-BR');

    infoContainer.innerHTML = `
        <div class="cliente-info-card">
            <h3>${cliente.nome_completo}</h3>
            <p><strong>Código:</strong> ${cliente.codigo_cliente}</p>
            <p><strong>E-mail:</strong> ${cliente.email}</p>
            <p><strong>Telefone:</strong> ${cliente.telefone}</p>
            <p><strong>Data de Nascimento:</strong> ${dataNascimento}</p>
            <p><strong>Endereço:</strong> ${cliente.endereco || 'Não informado'}</p>
            <p><strong>Status:</strong> ${cliente.status}</p>
        </div>
    `;

    // Atualiza título da página
    document.title = `${cliente.nome_completo} - Prontuário Eletrônico`;
}

// ============================================
// FUNÇÕES DE ATENDIMENTOS (antes chamadas de SESSÕES)
// ============================================

async function buscarSessoesCliente(clienteId) {
    try {
        const response = await fazerRequisicaoAutenticada(`/clientes/${clienteId}/atendimentos/`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar atendimentos');
        }

        const sessoes = await response.json();
        exibirSessoes(sessoes);
    } catch (error) {
        console.error('Erro ao buscar atendimentos:', error);
        document.getElementById('lista-sessoes').innerHTML = 
            `<li>❌ ${error.message}</li>`;
    }
}

function exibirSessoes(sessoes) {
    const lista = document.getElementById('lista-sessoes');
    lista.innerHTML = '';

    if (sessoes.length === 0) {
        lista.innerHTML = '<li>Nenhuma sessão registrada.</li>';
        return;
    }

    sessoes.forEach(sessao => {
        const dataSessao = new Date(sessao.data_atendimento + 'T00:00:00')
            .toLocaleDateString('pt-BR');
        
        const item = document.createElement('li');
        item.className = 'sessao-item';
        item.innerHTML = `
            <div class="sessao-header">
                <strong>📅 ${dataSessao}</strong>
                <span class="duracao">⏱️ ${sessao.duracao_minutos} min</span>
            </div>
            <p class="sessao-conteudo">${sessao.conteudo}</p>
        `;
        lista.appendChild(item);
    });
}

async function handleAdicionarSessao(event, clienteId) {
    event.preventDefault();

    // Extrai apenas a data (sem a hora)
    const dataInput = document.getElementById('data_sessao').value;
    const dataSomente = new Date(dataInput).toISOString().split('T')[0];

    const dadosSessao = {
        data_atendimento: dataSomente,
        conteudo: document.getElementById('conteudo_sessao').value,
        duracao_minutos: parseInt(document.getElementById('duracao_minutos').value) || 50
    };

    try {
        desabilitarBotao('btn-registrar-sessao');
        limparMensagem('mensagem-status-sessao');

        const response = await fazerRequisicaoAutenticada(`/clientes/${clienteId}/atendimentos/`, {
            method: 'POST',
            body: JSON.stringify(dadosSessao)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.detail || 'Erro ao registrar sessão');
        }

        exibirSucesso('mensagem-status-sessao', 'Atendimento registrado com sucesso!');
        document.getElementById('form-nova-sessao').reset();

        // Recarrega lista de atendimentos após 1 segundo
        setTimeout(() => {
            buscarSessoesCliente(clienteId);
        }, 1000);

    } catch (error) {
        exibirErro('mensagem-status-sessao', error.message);
    } finally {
        habilitarBotao('btn-registrar-sessao', 'Registrar Sessão');
    }
}
