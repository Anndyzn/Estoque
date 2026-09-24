let materiaisCache = [];
let estoqueCache = [];
let materialSelecionadoId = null;
let ultimaMovimentacao = null;
let ajusteMaterialId = null;
let ajusteGondolas = [];

const API = "";

function abrirAba(id) {
  document.querySelectorAll(".aba-painel").forEach((painel) => {
    painel.classList.toggle("ativo", painel.id === id);
  });

  document.querySelectorAll(".aba").forEach((aba) => {
    aba.classList.toggle("ativa", aba.dataset.destino === id);
  });
}

function mostrarMensagem(texto, tipo = "sucesso") {
  const mensagem = document.getElementById("mensagem");

  mensagem.innerText = texto;
  mensagem.className = tipo;

  setTimeout(() => {
    mensagem.innerText = "";
    mensagem.className = "";
  }, 3000);
}

function montarDescricao(item) {
  let descricao = item.material || "";

  if (item.cor) descricao += ` | ${item.cor}`;
  if (item.camisa) descricao += ` | Camisa ${item.camisa}`;
  if (item.renda) descricao += ` | Renda ${item.renda}`;
  if (item.cor_renda) descricao += ` | ${item.cor_renda}`;

  return descricao;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function materialDuplicado(material) {
  const alvo = [
    material.material,
    material.cor,
    material.camisa,
    material.renda,
    material.cor_renda
  ].map(normalizarTexto).join("|");

  return materiaisCache.find((item) => {
    const atual = [
      item.material,
      item.cor,
      item.camisa,
      item.renda,
      item.cor_renda
    ].map(normalizarTexto).join("|");

    return atual === alvo;
  });
}

function textoBuscaMaterial(item) {
  return [
    item.material,
    item.cor,
    item.camisa,
    item.renda,
    item.cor_renda
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function escaparParametro(texto) {
  return String(texto).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function escaparAtributo(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function atualizarResumo() {
  return;
}

function definirQuantidade(valor) {
  document.getElementById("quantidade").value = valor;
  document.getElementById("quantidade").focus();
}

function somarQuantidade(valor) {
  const campo = document.getElementById("quantidade");
  campo.value = Number(campo.value || 0) + valor;
  campo.focus();
}

function definirQuantidadeTransferencia(valor) {
  document.getElementById("quantidade_transferencia").value = valor;
  document.getElementById("quantidade_transferencia").focus();
}

function somarQuantidadeTransferencia(valor) {
  const campo = document.getElementById("quantidade_transferencia");
  campo.value = Number(campo.value || 0) + valor;
  campo.focus();
}

function formatarRendaCm(valor) {
  const renda = valor.trim();

  if (!renda) {
    return "";
  }

  if (/\bcm$/i.test(renda)) {
    return renda.replace(/\bcm$/i, "CM");
  }

  return `${renda} CM`;
}

function limparMovimentacao() {
  materialSelecionadoId = null;
  document.getElementById("material_id").value = "";
  document.getElementById("buscaMaterial").value = "";
  document.getElementById("quantidade").value = "";
  document.getElementById("listaMateriais").innerHTML = "";
  document.getElementById("detalheMaterial").innerText =
    "Selecione um material para ver o saldo por gôndola.";
  carregarGondolas();
}

function limparTransferencia() {
  document.getElementById("transfer_material_id").value = "";
  document.getElementById("buscaTransferencia").value = "";
  document.getElementById("listaTransferencia").innerHTML = "";
  document.getElementById("gondola_origem").innerHTML = `<option value="">Origem</option>`;
  document.getElementById("gondola_destino").innerHTML = `<option value="">Destino</option>`;
  document.getElementById("quantidade_transferencia").value = "";
  document.getElementById("buscaTransferencia").focus();
}

function atualizarBotaoRepetirMovimentacao() {
  const botao = document.getElementById("btnRepetirMovimentacao");

  if (!botao) {
    return;
  }

  botao.disabled = !ultimaMovimentacao;
}

async function cadastrarGondola() {
  const nome = normalizarTexto(document.getElementById("nomeGondola").value);

  if (!nome) {
    mostrarMensagem("Informe o nome da gôndola.", "erro");
    return;
  }

  const resposta = await fetch(`${API}/gondolas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ nome })
  });

  if (!resposta.ok) {
    const dados = await resposta.json();
    mostrarMensagem(dados.erro || "Erro ao cadastrar gôndola.", "erro");
    return;
  }

  document.getElementById("nomeGondola").value = "";
  await carregarGondolas();
  mostrarMensagem("Gôndola cadastrada com sucesso.");
}

async function cadastrarMaterial() {
  const material = normalizarTexto(document.getElementById("material").value);
  const cor = normalizarTexto(document.getElementById("cor").value);
  const camisa = normalizarTexto(document.getElementById("camisa").value);
  const renda = normalizarTexto(formatarRendaCm(document.getElementById("renda").value));
  const cor_renda = normalizarTexto(document.getElementById("cor_renda").value);

  if (!material) {
    mostrarMensagem("Informe o nome do material.", "erro");
    return;
  }

  const duplicado = materialDuplicado({ material, cor, camisa, renda, cor_renda });

  if (duplicado) {
    mostrarMensagem("Este material já está cadastrado com os mesmos detalhes.", "erro");
    return;
  }

  const resposta = await fetch(`${API}/materiais`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      material,
      cor,
      camisa,
      renda,
      cor_renda
    })
  });

  if (!resposta.ok) {
    const dados = await resposta.json();
    mostrarMensagem(dados.erro || "Erro ao cadastrar material.", "erro");
    return;
  }

  ["material", "cor", "camisa", "renda", "cor_renda"].forEach((id) => {
    document.getElementById(id).value = "";
  });

  await carregarMateriais();
  mostrarMensagem("Material cadastrado com sucesso.");
}

async function carregarMateriais() {
  const resposta = await fetch(`${API}/materiais`);
  materiaisCache = await resposta.json();
  atualizarResumo();
}

async function carregarGondolas() {
  const resposta = await fetch(`${API}/gondolas`);
  const gondolas = await resposta.json();

  const select = document.getElementById("gondola_id");
  const filtroGondola = document.getElementById("filtroGondola");

  if (select) {
    select.innerHTML = `<option value="">Selecione a gôndola</option>`;
  }

  if (filtroGondola) {
    filtroGondola.innerHTML = `<option value="">Todas as gôndolas</option>`;
  }

  gondolas.forEach((item) => {
    if (select) {
      select.innerHTML += `<option value="${item.id}">${item.nome}</option>`;
    }

    if (filtroGondola) {
      filtroGondola.innerHTML += `<option value="${item.nome}">${item.nome}</option>`;
    }
  });
}

async function movimentarEstoque() {
  const material_id = document.getElementById("material_id").value;
  const gondola_id = document.getElementById("gondola_id").value;
  const tipo = document.getElementById("tipo").value;
  const quantidade = Number(document.getElementById("quantidade").value);
  const materialDescricao = document.getElementById("buscaMaterial").value;

  if (!material_id || !gondola_id) {
    mostrarMensagem("Selecione o material e a gôndola.", "erro");
    return;
  }

  if (!quantidade || quantidade <= 0) {
    mostrarMensagem("Informe uma quantidade válida.", "erro");
    return;
  }

  const movimentacao = {
    material_id,
    materialDescricao,
    gondola_id,
    tipo,
    quantidade
  };

  const resposta = await fetch(`${API}/movimentar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(movimentacao)
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(dados.erro || "Erro ao movimentar estoque.", "erro");
    return;
  }

  document.getElementById("quantidade").value = "";
  ultimaMovimentacao = movimentacao;
  localStorage.setItem("ultimaMovimentacao", JSON.stringify(ultimaMovimentacao));
  atualizarBotaoRepetirMovimentacao();

  await carregarEstoque();
  await carregarMovimentacoes();
  await atualizarGondolasMovimentacao();
  await mostrarDetalheMaterial(material_id);

  document.getElementById("quantidade").focus();

  mostrarMensagem(dados.mensagem || "Movimentação realizada com sucesso.");
}

async function repetirUltimaMovimentacao() {
  if (!ultimaMovimentacao) {
    mostrarMensagem("Nenhuma movimentação para repetir.", "erro");
    return;
  }

  materialSelecionadoId = Number(ultimaMovimentacao.material_id);
  document.getElementById("material_id").value = ultimaMovimentacao.material_id;
  document.getElementById("buscaMaterial").value = ultimaMovimentacao.materialDescricao;
  document.getElementById("tipo").value = ultimaMovimentacao.tipo;
  document.getElementById("quantidade").value = ultimaMovimentacao.quantidade;

  await atualizarGondolasMovimentacao();
  document.getElementById("gondola_id").value = ultimaMovimentacao.gondola_id;
  await movimentarEstoque();
}

async function carregarEstoque() {
  const resposta = await fetch(`${API}/estoque`);
  estoqueCache = await resposta.json();

  const tabela = document.getElementById("tabelaEstoque");
  tabela.innerHTML = "";

  if (estoqueCache.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="2" class="estado-vazio">Nenhum item com saldo no estoque.</td>
      </tr>
    `;
    atualizarResumo();
    return;
  }

  estoqueCache.forEach((item) => {
    const descricao = montarDescricao(item);
    const gondolasTexto = item.gondolas || "";

    tabela.innerHTML += `
      <tr data-gondolas="${escaparAtributo(gondolasTexto.toLowerCase())}">
        <td>
          <details>
            <summary>${descricao}</summary>
            <div class="gondolas-detalhe">
              <span>${gondolasTexto || "Sem gôndola"}</span>
              <button
                class="btn-acao-item"
                type="button"
                onclick="prepararMovimentacaoDoEstoque(${item.material_id}, '${escaparParametro(descricao)}')"
              >
                Movimentar
              </button>
              <button
                class="btn-acao-item btn-ajustar"
                type="button"
                onclick="abrirAjusteEstoque(${item.material_id}, '${escaparParametro(descricao)}')"
              >
                Arrumar
              </button>
            </div>
          </details>
        </td>
        <td>${item.quantidade || 0}</td>
      </tr>
    `;
  });

  atualizarResumo();
}

async function prepararMovimentacaoDoEstoque(materialId, descricao) {
  abrirAba("movimentacao");
  materialSelecionadoId = materialId;

  document.getElementById("material_id").value = materialId;
  document.getElementById("buscaMaterial").value = descricao;
  document.getElementById("listaMateriais").innerHTML = "";
  document.getElementById("quantidade").value = "";

  await atualizarGondolasMovimentacao();
  await mostrarDetalheMaterial(materialId);

  document.getElementById("quantidade").focus();
}

async function abrirAjusteEstoque(materialId, descricao) {
  ajusteMaterialId = materialId;
  document.getElementById("ajusteDescricao").innerText = descricao;
  document.getElementById("ajuste_quantidade_atual").value = "";
  document.getElementById("ajuste_quantidade_correta").value = "";

  const resposta = await fetch(`${API}/estoque/material/${materialId}/gondolas`);
  ajusteGondolas = await resposta.json();

  const select = document.getElementById("ajuste_gondola_id");
  select.innerHTML = `<option value="">Selecione</option>`;

  ajusteGondolas.forEach((item) => {
    select.innerHTML += `
      <option value="${item.gondola_id}">
        ${item.gondola} | Atual: ${item.quantidade}
      </option>
    `;
  });

  document.getElementById("modalAjuste").hidden = false;
  select.focus();
}

function fecharAjusteEstoque() {
  document.getElementById("modalAjuste").hidden = true;
  ajusteMaterialId = null;
  ajusteGondolas = [];
}

function atualizarQuantidadeAtualAjuste() {
  const gondolaId = Number(document.getElementById("ajuste_gondola_id").value);
  const encontrada = ajusteGondolas.find((item) => Number(item.gondola_id) === gondolaId);
  const quantidadeAtual = encontrada ? Number(encontrada.quantidade || 0) : "";

  document.getElementById("ajuste_quantidade_atual").value = quantidadeAtual;
  document.getElementById("ajuste_quantidade_correta").value = quantidadeAtual;
  document.getElementById("ajuste_quantidade_correta").focus();
}

async function salvarAjusteEstoque() {
  const gondola_id = document.getElementById("ajuste_gondola_id").value;
  const quantidade_correta = Number(document.getElementById("ajuste_quantidade_correta").value);

  if (!ajusteMaterialId || !gondola_id) {
    mostrarMensagem("Selecione a gôndola para ajustar.", "erro");
    return;
  }

  if (Number.isNaN(quantidade_correta) || quantidade_correta < 0) {
    mostrarMensagem("Informe uma quantidade correta válida.", "erro");
    return;
  }

  const resposta = await fetch(`${API}/ajustar-estoque`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      material_id: ajusteMaterialId,
      gondola_id,
      quantidade_correta
    })
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(dados.erro || "Erro ao ajustar estoque.", "erro");
    return;
  }

  fecharAjusteEstoque();
  await carregarEstoque();
  await carregarMovimentacoes();

  if (materialSelecionadoId) {
    await atualizarGondolasMovimentacao();
    await mostrarDetalheMaterial(materialSelecionadoId);
  }

  mostrarMensagem(dados.mensagem || "Estoque ajustado com sucesso.");
}

async function carregarMovimentacoes() {
  const resposta = await fetch(`${API}/movimentacoes`);
  const movimentacoes = await resposta.json();

  const tabela = document.getElementById("tabelaMovimentacoes");
  tabela.innerHTML = "";

  if (movimentacoes.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6" class="estado-vazio">Nenhuma movimentação registrada.</td>
      </tr>
    `;
    return;
  }

  movimentacoes.forEach((item) => {
    tabela.innerHTML += `
      <tr>
        <td><span class="tipo-mov tipo-${item.tipo.toLowerCase()}">${item.tipo}</span></td>
        <td>${montarDescricao(item)}</td>
        <td>${item.gondola}</td>
        <td>${item.quantidade}</td>
        <td>${item.data_movimentacao}</td>
        <td>
          <button class="btn-excluir" type="button" onclick="desfazerMovimentacao(${item.id})">
            Desfazer
          </button>
        </td>
      </tr>
    `;
  });
}

async function desfazerMovimentacao(id) {
  const confirmar = confirm("Tem certeza que deseja desfazer esta movimentação?");

  if (!confirmar) {
    return;
  }

  const resposta = await fetch(`${API}/movimentacoes/${id}`, {
    method: "DELETE"
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(dados.erro || "Erro ao desfazer movimentação.", "erro");
    return;
  }

  await carregarEstoque();
  await carregarMovimentacoes();

  if (materialSelecionadoId) {
    await atualizarGondolasMovimentacao();
    await mostrarDetalheMaterial(materialSelecionadoId);
  }

  mostrarMensagem(dados.mensagem || "Movimentação desfeita com sucesso.");
}

function renderizarListaBusca(listaId, itens, callback) {
  const lista = document.getElementById(listaId);
  lista.innerHTML = "";

  if (itens.length === 0) {
    lista.innerHTML = `<div class="item-busca sem-resultado">Nenhum material encontrado</div>`;
    return;
  }

  itens.slice(0, 20).forEach((item) => {
    const descricao = montarDescricao(item);
    lista.innerHTML += `
      <button
        type="button"
        class="item-busca"
        onclick="${callback}(${item.id}, '${escaparParametro(descricao)}')"
      >
        ${descricao}
      </button>
    `;
  });
}

function buscarMaterialMovimentacao() {
  const busca = document.getElementById("buscaMaterial").value.trim().toLowerCase();
  const lista = document.getElementById("listaMateriais");

  lista.innerHTML = "";

  if (!busca) {
    return;
  }

  const filtrados = materiaisCache.filter((item) => textoBuscaMaterial(item).includes(busca));
  renderizarListaBusca("listaMateriais", filtrados, "selecionarMaterial");
}

async function selecionarMaterial(id, descricao) {
  materialSelecionadoId = id;

  document.getElementById("material_id").value = id;
  document.getElementById("buscaMaterial").value = descricao;
  document.getElementById("listaMateriais").innerHTML = "";

  await atualizarGondolasMovimentacao();
  await mostrarDetalheMaterial(id);
  document.getElementById("quantidade").focus();
}

async function mostrarDetalheMaterial(materialId) {
  const resposta = await fetch(`${API}/estoque/material/${materialId}/gondolas`);
  const gondolas = await resposta.json();
  const detalhe = document.getElementById("detalheMaterial");

  if (gondolas.length === 0) {
    detalhe.innerHTML = `
      <strong>Saldo atual</strong>
      <span>Este material ainda não possui saldo em nenhuma gôndola.</span>
    `;
    return;
  }

  const total = gondolas.reduce((soma, item) => soma + Number(item.quantidade || 0), 0);

  detalhe.innerHTML = `
    <strong>Saldo atual: ${total}</strong>
    <div class="chips-gondolas">
      ${gondolas.map((item) => `<span>${item.gondola}: ${item.quantidade}</span>`).join("")}
    </div>
  `;
}

async function atualizarGondolasMovimentacao() {
  if (!materialSelecionadoId) {
    await carregarGondolas();
    return;
  }

  const tipo = document.getElementById("tipo").value;

  if (tipo === "ENTRADA") {
    await carregarGondolasEntrada(materialSelecionadoId);
  } else {
    await carregarGondolasDoMaterial(materialSelecionadoId);
  }
}

async function carregarGondolasEntrada(materialId) {
  const respostaTodas = await fetch(`${API}/gondolas`);
  const todasGondolas = await respostaTodas.json();

  const respostaEstoque = await fetch(`${API}/estoque/material/${materialId}/gondolas`);
  const gondolasComEstoque = await respostaEstoque.json();

  const select = document.getElementById("gondola_id");
  select.innerHTML = `<option value="">Selecione a gôndola</option>`;

  todasGondolas.forEach((gondola) => {
    const encontrada = gondolasComEstoque.find((item) => item.gondola_id === gondola.id);
    const textoEstoque = encontrada ? ` | Estoque: ${encontrada.quantidade}` : " | Sem estoque";

    select.innerHTML += `<option value="${gondola.id}">${gondola.nome}${textoEstoque}</option>`;
  });
}

async function carregarGondolasDoMaterial(materialId) {
  const resposta = await fetch(`${API}/estoque/material/${materialId}/gondolas`);
  const gondolas = await resposta.json();

  const select = document.getElementById("gondola_id");
  select.innerHTML = "";

  if (gondolas.length === 0) {
    select.innerHTML = `<option value="">Sem estoque em gôndola</option>`;
    return;
  }

  select.innerHTML = `<option value="">Selecione a gôndola</option>`;

  gondolas.forEach((item) => {
    select.innerHTML += `
      <option value="${item.gondola_id}">
        ${item.gondola} | Estoque: ${item.quantidade}
      </option>
    `;
  });
}

function buscarMaterialTransferencia() {
  const busca = document.getElementById("buscaTransferencia").value.trim().toLowerCase();
  const lista = document.getElementById("listaTransferencia");

  lista.innerHTML = "";

  if (!busca) {
    return;
  }

  const filtrados = materiaisCache.filter((item) => textoBuscaMaterial(item).includes(busca));
  renderizarListaBusca("listaTransferencia", filtrados, "selecionarMaterialTransferencia");
}

async function selecionarMaterialTransferencia(id, descricao) {
  document.getElementById("transfer_material_id").value = id;
  document.getElementById("buscaTransferencia").value = descricao;
  document.getElementById("listaTransferencia").innerHTML = "";

  await carregarGondolasOrigemTransferencia(id);
  await carregarGondolasDestinoTransferencia();
  document.getElementById("quantidade_transferencia").focus();
}

async function carregarGondolasOrigemTransferencia(materialId) {
  const resposta = await fetch(`${API}/estoque/material/${materialId}/gondolas`);
  const gondolas = await resposta.json();

  const select = document.getElementById("gondola_origem");
  select.innerHTML = `<option value="">Origem</option>`;

  gondolas.forEach((item) => {
    select.innerHTML += `
      <option value="${item.gondola_id}">
        ${item.gondola} | Estoque: ${item.quantidade}
      </option>
    `;
  });
}

async function carregarGondolasDestinoTransferencia() {
  const resposta = await fetch(`${API}/gondolas`);
  const gondolas = await resposta.json();

  const select = document.getElementById("gondola_destino");
  select.innerHTML = `<option value="">Destino</option>`;

  gondolas.forEach((item) => {
    select.innerHTML += `<option value="${item.id}">${item.nome}</option>`;
  });
}

async function transferirEstoque() {
  const material_id = document.getElementById("transfer_material_id").value;
  const gondola_origem_id = document.getElementById("gondola_origem").value;
  const gondola_destino_id = document.getElementById("gondola_destino").value;
  const quantidade = Number(document.getElementById("quantidade_transferencia").value);

  if (!material_id || !gondola_origem_id || !gondola_destino_id) {
    mostrarMensagem("Selecione material, origem e destino.", "erro");
    return;
  }

  if (!quantidade || quantidade <= 0) {
    mostrarMensagem("Informe uma quantidade válida.", "erro");
    return;
  }

  const resposta = await fetch(`${API}/transferir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      material_id,
      gondola_origem_id,
      gondola_destino_id,
      quantidade
    })
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(dados.erro || "Erro ao transferir estoque.", "erro");
    return;
  }

  document.getElementById("quantidade_transferencia").value = "";

  await carregarEstoque();
  await carregarMovimentacoes();
  await carregarGondolasOrigemTransferencia(material_id);

  document.getElementById("quantidade_transferencia").focus();

  mostrarMensagem(dados.mensagem || "Transferência realizada com sucesso.");
}

function filtrarTabela() {
  const filtroProduto = document.getElementById("filtroProduto").value.toLowerCase();
  const filtroGondola = document.getElementById("filtroGondola").value.toLowerCase();
  const linhas = document.querySelectorAll("#tabelaEstoque tr");

  linhas.forEach((linha) => {
    const textoLinha = linha.innerText.toLowerCase();
    const textoGondolas = linha.dataset.gondolas || "";
    const produtoConfere = textoLinha.includes(filtroProduto);
    const gondolaConfere = !filtroGondola || textoGondolas.includes(`${filtroGondola}:`);

    linha.style.display = produtoConfere && gondolaConfere ? "" : "none";
  });
}

async function selecionarPrimeiroMaterial(campoBuscaId, callback) {
  const busca = document.getElementById(campoBuscaId).value.trim().toLowerCase();

  if (!busca) {
    return;
  }

  const primeiro = materiaisCache.find((item) => textoBuscaMaterial(item).includes(busca));

  if (!primeiro) {
    mostrarMensagem("Nenhum material encontrado.", "erro");
    return;
  }

  await callback(primeiro.id, montarDescricao(primeiro));
}

function configurarAtalhosTeclado() {
  document.getElementById("buscaMaterial").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      selecionarPrimeiroMaterial("buscaMaterial", selecionarMaterial);
    }
  });

  document.getElementById("quantidade").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      movimentarEstoque();
    }
  });

  document.getElementById("buscaTransferencia").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      selecionarPrimeiroMaterial("buscaTransferencia", selecionarMaterialTransferencia);
    }
  });

  document.getElementById("quantidade_transferencia").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      transferirEstoque();
    }
  });

  document.getElementById("ajuste_quantidade_correta").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      salvarAjusteEstoque();
    }
  });

  ["material", "cor", "camisa", "renda", "cor_renda", "nomeGondola"].forEach((id) => {
    document.getElementById(id).addEventListener("input", (event) => {
      const inicio = event.target.selectionStart;
      const fim = event.target.selectionEnd;
      event.target.value = event.target.value.toUpperCase();
      event.target.setSelectionRange(inicio, fim);
    });
  });
}

function carregarUltimaMovimentacao() {
  try {
    ultimaMovimentacao = JSON.parse(localStorage.getItem("ultimaMovimentacao"));
  } catch {
    ultimaMovimentacao = null;
  }

  atualizarBotaoRepetirMovimentacao();
}

async function iniciar() {
  configurarAtalhosTeclado();
  carregarUltimaMovimentacao();
  await carregarMateriais();
  await carregarGondolas();
  await carregarEstoque();
  await carregarMovimentacoes();
}

iniciar();
