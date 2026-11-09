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

// Evento de Submissão do Formulário (Cadastro / Edição)
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);

    if (!nome) {
        alert("Por favor, informe um nome válido para o produto.");
        return;
    }

    if (isNaN(preco) || preco <= 0 || isNaN(quantidade) || quantidade <= 0) {
        alert("O preço e a quantidade devem ser valores numéricos maiores que zero.");
        return;
    }

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

// Evento de Digitação Dinâmica (V4)
if (campoBusca) {
    campoBusca.addEventListener("input", () => {
        renderizarTabela();
    });
}

// Função intermediária para filtrar produtos com .filter(), .toLowerCase() e .includes() (V4)
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

function removerProduto(indexReal) {
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
}

if (botaoLimparTabela) {
    botaoLimparTabela.addEventListener("click", () => {
        if (confirm("Tem certeza que deseja limpar todos os produtos?")) {
            listaDeProdutos.length = 0;
            indiceEdicao = null;
            document.querySelector(".btn-primary").textContent = "Adicionar Produto";
            salvarNoLocalStorage();
            renderizarTabela();
            formProduto.reset();
        }
    });
}

function renderizarTabela() {
    const tbody = document.querySelector("#tabela-produtos tbody");
    const mensagemVazia = document.getElementById("mensagem-vazia");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    // Obtém os produtos filtrados pela pesquisa atual (V4)
    const produtosFiltrados = obterProdutosFiltrados();

    // Controle de exibição da mensagem caso nenhum item seja encontrado
    if (produtosFiltrados.length === 0) {
        if (mensagemVazia) mensagemVazia.style.display = "block";
    } else {
        if (mensagemVazia) mensagemVazia.style.display = "none";
    }

    produtosFiltrados.forEach((produto) => {
        // Encontra o índice real correspondente no array principal `listaDeProdutos`
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
                <button class="btn-remover" onclick="removerProduto(${indexReal})">Excluir</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Métricas Reativas usando .reduce() considerando unicamente os itens visíveis na tela (V4)
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