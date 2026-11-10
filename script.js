class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = preco;
        this.quantidade = quantidade;
    }
}

const listaDeProdutos = [];
let indiceEdicao = null; // null indica "Modo Cadastro", número indica "Modo Edição"
const CHAVE_STORAGE = "sistema_estoque_produtos";

// Instância do Modal do Bootstrap para controle via JS
let meuModalConfirmacao;

window.addEventListener('DOMContentLoaded', () => {
    meuModalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
});

// Persistência com localStorage
function salvarNoLocalStorage() {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaDeProdutos));
}

function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    if (dadosSalvos) {
        const produtosObjetos = JSON.parse(dadosSalvos);
        produtosObjetos.forEach((p) => {
            const produtoInstanciado = new Produto(p.nome, p.preco, p.quantidade);
            listaDeProdutos.push(produtoInstanciado);
        });
    }
}

const formProduto = document.getElementById("produto-form");
const botaoLimparTabela = document.getElementById("limpar-tabela");
const campoBusca = document.getElementById("campo-busca");
const divMensagemErro = document.getElementById("mensagem-erro");

// Função para exibir mensagens inline no formulário (Substitui os alerts)
function mostrarErroInline(mensagem) {
    if (divMensagemErro) {
        divMensagemErro.textContent = mensagem;
        divMensagemErro.classList.remove("d-none");
        // Oculta após 4 segundos automaticamente
        setTimeout(() => {
            divMensagemErro.classList.add("d-none");
        }, 4000);
    }
}

// Evento de Submissão do Formulário (Cadastro / Edição)
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);

    if (!nome) {
        mostrarErroInline("Por favor, informe um nome válido para o produto.");
        return;
    }

    if (isNaN(preco) || preco <= 0 || isNaN(quantidade) || quantidade <= 0) {
        mostrarErroInline("O preço e a quantidade devem ser valores numéricos maiores que zero.");
        return;
    }

    // Oculta erro caso esteja visível
    divMensagemErro.classList.add("d-none");

    const novoProduto = new Produto(nome, preco, quantidade);

    if (indiceEdicao === null) {
        listaDeProdutos.push(novoProduto);
    } else {
        listaDeProdutos[indiceEdicao] = novoProduto;
        indiceEdicao = null;
        document.querySelector(".btn-primary").textContent = "Adicionar Produto";
    }

    salvarNoLocalStorage();
    renderizarTabela();
    formProduto.reset();
    document.getElementById("nome").focus();
});

// Evento de Digitação Dinâmica
if (campoBusca) {
    campoBusca.addEventListener("input", () => {
        renderizarTabela();
    });
}

// Função intermediária para filtrar produtos com .filter(), .toLowerCase() e .includes()
function obterProdutosFiltrados() {
    const termoBusca = campoBusca ? campoBusca.value.toLowerCase().trim() : "";
    
    return listaDeProdutos.filter(produto => 
        produto.nome.toLowerCase().includes(termoBusca)
    );
}

function prepararEdicao(indexReal) {
    const produto = listaDeProdutos[indexReal];

    document.getElementById("nome").value = produto.nome;
    document.getElementById("preco").value = produto.preco;
    document.getElementById("quantidade").value = produto.quantidade;

    indiceEdicao = indexReal;
    document.querySelector(".btn-primary").textContent = "Salvar Alterações";
    document.getElementById("nome").focus();
}

// Remoção assíncrona usando o Modal de Confirmação customizado
function solicitarRemocao(indexReal) {
    const textoModal = document.getElementById("modal-confirmacao-texto");
    const btnConfirmar = document.getElementById("btn-modal-confirmar");

    textoModal.textContent = `Tem certeza que deseja excluir o produto "${listaDeProdutos[indexReal].nome}"?`;
    
    // Substitui o evento de clique do botão confirmar para esta ação específica
    btnConfirmar.onclick = function () {
        listaDeProdutos.splice(indexReal, 1);

        if (indiceEdicao === indexReal) {
            indiceEdicao = null;
            document.querySelector(".btn-primary").textContent = "Adicionar Produto";
            formProduto.reset();
        } else if (indiceEdicao > indexReal) {
            indiceEdicao--;
        }

        salvarNoLocalStorage();
        renderizarTabela();
        meuModalConfirmacao.hide();
    };

    meuModalConfirmacao.show();
}

if (botaoLimparTabela) {
    botaoLimparTabela.addEventListener("click", () => {
        const textoModal = document.getElementById("modal-confirmacao-texto");
        const btnConfirmar = document.getElementById("btn-modal-confirmar");

        textoModal.textContent = "Tem certeza que deseja limpar todos os produtos do estoque?";
        
        btnConfirmar.onclick = function () {
            listaDeProdutos.length = 0;
            indiceEdicao = null;
            document.querySelector(".btn-primary").textContent = "Adicionar Produto";
            salvarNoLocalStorage();
            renderizarTabela();
            formProduto.reset();
            meuModalConfirmacao.hide();
        };

        meuModalConfirmacao.show();
    });
}

function renderizarTabela() {
    const tbody = document.querySelector("#tabela-produtos tbody");
    const mensagemVazia = document.getElementById("mensagem-vazia");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    const produtosFiltrados = obterProdutosFiltrados();

    if (produtosFiltrados.length === 0) {
        if (mensagemVazia) mensagemVazia.style.display = "block";
    } else {
        if (mensagemVazia) mensagemVazia.style.display = "none";
    }

    produtosFiltrados.forEach((produto) => {
        const indexReal = listaDeProdutos.indexOf(produto);
        const subtotal = produto.preco * produto.quantidade;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${subtotal.toFixed(2)}</td>
            <td>
                <button class="btn-editar" onclick="prepararEdicao(${indexReal})">Editar</button>
                <button class="btn-remover" onclick="solicitarRemocao(${indexReal})">Excluir</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    const valorTotalEstoque = produtosFiltrados.reduce((total, p) => total + (p.preco * p.quantidade), 0);
    atualizarResumo(valorTotalEstoque);
}

function atualizarResumo(total) {
    const totalEstoqueElemento = document.getElementById("total-estoque");
    if (totalEstoqueElemento) {
        totalEstoqueElemento.textContent = `Total em Estoque: R$ ${total.toFixed(2)}`;
    }
}

// Inicialização
carregarDoLocalStorage();
renderizarTabela();