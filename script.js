class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = preco;
        this.quantidade = quantidade;
    }
}

const listaDeProdutos = [];
let indiceEdicao = null; // null indica "Modo Cadastro", número indica "Modo Edição"[cite: 6]

// Persistência com localStorage
const CHAVE_STORAGE = "sistema_estoque_produtos";

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

formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    // 1. Sanitização e Captura de Dados
    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);

    // 2. Guard Clause: Validação de Nome
    if (!nome) {
        alert("Por favor, informe um nome válido para o produto.");
        return;
    }

    // 3. Guard Clause: Validação de Limites Numéricos
    if (isNaN(preco) || preco <= 0 || isNaN(quantidade) || quantidade <= 0) {
        alert("O preço e a quantidade devem ser valores numéricos maiores que zero.");
        return;
    }

    const novoProduto = new Produto(nome, preco, quantidade);

    // 4. Lógica de Inclusão vs Atualização (Update)
    if (indiceEdicao === null) {
        // Modo Inclusão
        listaDeProdutos.push(novoProduto);
    } else {
        // Modo Edição (Update)
        listaDeProdutos[indiceEdicao] = novoProduto;
        indiceEdicao = null;
        document.querySelector(".btn-primary").textContent = "Adicionar Produto";
    }

    salvarNoLocalStorage();
    renderizarTabela();
    formProduto.reset();
    document.getElementById("nome").focus();
});

function prepararEdicao(index) {
    const produto = listaDeProdutos[index];

    // Preenche os campos do formulário com os dados existentes
    document.getElementById("nome").value = produto.nome;
    document.getElementById("preco").value = produto.preco;
    document.getElementById("quantidade").value = produto.quantidade;

    // Transfere o estado para Modo Edição e atualiza a interface
    indiceEdicao = index;
    document.querySelector(".btn-primary").textContent = "Salvar Alterações";
    document.getElementById("nome").focus();
}

function removerProduto(index) {
    listaDeProdutos.splice(index, 1);

    // Se o item que está sendo editado for removido, cancela a edição
    if (indiceEdicao === index) {
        indiceEdicao = null;
        document.querySelector(".btn-primary").textContent = "Adicionar Produto";
        formProduto.reset();
    } else if (indiceEdicao > index) {
        indiceEdicao--;
    }

    salvarNoLocalStorage();
    renderizarTabela();
}


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

function renderizarTabela() {
    const tbody = document.querySelector("#tabela-produtos tbody");
    tbody.innerHTML = "";

    let valorTotalEstoque = 0;
    

    listaDeProdutos.forEach((produto, index) => {
        const subtotal = produto.preco * produto.quantidade;
        valorTotalEstoque += subtotal;

        const tr = document.createElement("tr");

        // Desafio: Adicionar botão de Editar vinculado à função prepararEdicao(index)
        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${subtotal.toFixed(2)}</td>
            <td>
                <button class="btn-editar" onclick="prepararEdicao(${index})">Editar</button>
                <button class="btn-remover" onclick="removerProduto(${index})">Excluir</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    atualizarResumo(valorTotalEstoque);
}

function atualizarResumo(total) {
    const totalEstoqueElemento = document.getElementById("total-estoque");
    totalEstoqueElemento.textContent = `Total em Estoque: R$ ${total.toFixed(2)}`;
}

// Inicialização: Restaura os dados do localStorage e renderiza a tela ao abrir
carregarDoLocalStorage();
renderizarTabela();