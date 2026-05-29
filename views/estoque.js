let materiaisCache = [];
let materialSelecionadoId = null;

const API = "http://localhost:4000";

function mostrarMensagem(texto, tipo = "sucesso") {
  const mensagem = document.getElementById("mensagem");

  mensagem.innerText = texto;
  mensagem.className = tipo;

  setTimeout(() => {
    mensagem.innerText = "";
    mensagem.className = "";
  }, 3000);
}

async function cadastrarGondola() {
  const nome = document.getElementById("nomeGondola").value.trim();

  if (!nome) {
    mostrarMensagem("Informe o nome da gôndola.", "erro");
    return;
  }

  await fetch(`${API}/gondolas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ nome })
  });

  document.getElementById("nomeGondola").value = "";

  await carregarGondolas();

  mostrarMensagem("Gôndola cadastrada com sucesso.");
}

async function cadastrarMaterial() {
  const material = document.getElementById("material").value.trim();
  const cor = document.getElementById("cor").value.trim();
  const camisa = document.getElementById("camisa").value.trim();
  const renda = document.getElementById("renda").value.trim();
  const cor_renda = document.getElementById("cor_renda").value.trim();

  if (!material) {
    mostrarMensagem("Informe o nome do material.", "erro");
    return;
  }

  await fetch(`${API}/materiais`, {
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

  document.getElementById("material").value = "";
  document.getElementById("cor").value = "";
  document.getElementById("camisa").value = "";
  document.getElementById("renda").value = "";
  document.getElementById("cor_renda").value = "";

  await carregarMateriais();

  mostrarMensagem("Material cadastrado com sucesso.");
}

async function carregarMateriais() {
  const resposta = await fetch(`${API}/materiais`);
  const materiais = await resposta.json();

  materiaisCache = materiais;

  console.log("Materiais carregados:", materiaisCache);

  const select = document.getElementById("material_id");

  if (select) {
    select.innerHTML = `<option value="">Selecione o material</option>`;

    materiais.forEach((item) => {
      let descricao = item.material || "";

      if (item.cor) descricao += ` | ${item.cor}`;
      if (item.camisa) descricao += ` | Camisa ${item.camisa}`;
      if (item.renda) descricao += ` | Renda ${item.renda}`;
      if (item.cor_renda) descricao += ` | ${item.cor_renda}`;

      select.innerHTML += `
        <option value="${item.id}">
          ${descricao}
        </option>
      `;
    });
  }
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
      select.innerHTML += `
        <option value="${item.id}">
          ${item.nome}
        </option>
      `;
    }

    if (filtroGondola) {
      filtroGondola.innerHTML += `
        <option value="${item.nome}">
          ${item.nome}
        </option>
      `;
    }
  });
}

async function movimentarEstoque() {
  const material_id = document.getElementById("material_id").value;
  const gondola_id = document.getElementById("gondola_id").value;
  const tipo = document.getElementById("tipo").value;
  const quantidade = Number(document.getElementById("quantidade").value);

  if (!material_id || !gondola_id) {
    mostrarMensagem("Selecione o material e a gôndola.", "erro");
    return;
  }

  if (!quantidade || quantidade <= 0) {
    mostrarMensagem("Informe uma quantidade válida.", "erro");
    return;
  }

  const resposta = await fetch(`${API}/movimentar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      material_id,
      gondola_id,
      tipo,
      quantidade
    })
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    mostrarMensagem(dados.erro || "Erro ao movimentar estoque.", "erro");
    return;
  }

  document.getElementById("quantidade").value = "";

  await carregarEstoque();
  await carregarMovimentacoes();

  mostrarMensagem(dados.mensagem || "Movimentação realizada com sucesso.");
}

async function carregarEstoque() {
  const resposta = await fetch(`${API}/estoque`);
  const estoque = await resposta.json();

  const tabela = document.getElementById("tabelaEstoque");
  tabela.innerHTML = "";

  estoque.forEach((item) => {
    let descricao = item.material || "";

    if (item.cor) descricao += ` | ${item.cor}`;
    if (item.camisa) descricao += ` | Camisa ${item.camisa}`;
    if (item.renda) descricao += ` | Renda ${item.renda}`;
    if (item.cor_renda) descricao += ` | ${item.cor_renda}`;

    tabela.innerHTML += `
      <tr>
        <td>
          <details>
            <summary>${descricao}</summary>
            <div class="gondolas-detalhe">
              ${item.gondolas || "Sem gôndola"}
            </div>
          </details>
        </td>
        <td>${item.quantidade || 0}</td>
      </tr>
    `;
  });
}

async function carregarMovimentacoes() {
  const resposta = await fetch(`${API}/movimentacoes`);
  const movimentacoes = await resposta.json();

  const tabela = document.getElementById("tabelaMovimentacoes");

  tabela.innerHTML = "";

  movimentacoes.forEach((item) => {
    let descricao = item.material;

    if (item.cor) descricao += ` | ${item.cor}`;
    if (item.camisa) descricao += ` | Camisa ${item.camisa}`;
    if (item.renda) descricao += ` | Renda ${item.renda}`;
    if (item.cor_renda) descricao += ` | ${item.cor_renda}`;

    tabela.innerHTML += `
      <tr>
        <td>${item.tipo}</td>
        <td>${descricao}</td>
        <td>${item.gondola}</td>
        <td>${item.quantidade}</td>
        <td>${item.data_movimentacao}</td>
        <td>
          <button class="btn-excluir" onclick="desfazerMovimentacao(${item.id})">
            Desfazer
          </button>
        </td>
      </tr>
    `;
  });
}

async function desfazerMovimentacao(id) {
  const confirmar = confirm(
    "Tem certeza que deseja desfazer esta movimentação?"
  );

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

  mostrarMensagem(dados.mensagem || "Movimentação desfeita com sucesso.");
}

function buscarMaterialTransferencia() {
  const busca = document
    .getElementById("buscaTransferencia")
    .value
    .trim()
    .toLowerCase();

  const lista = document.getElementById("listaTransferencia");

  lista.innerHTML = "";

  if (!busca) {
    return;
  }

  const filtrados = materiaisCache.filter((item) => {
    const texto = [
      item.material,
      item.cor,
      item.camisa,
      item.renda,
      item.cor_renda
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return texto.includes(busca);
  });

  filtrados.forEach((item) => {
    let descricao = item.material || "";

    if (item.cor) descricao += ` | ${item.cor}`;
    if (item.camisa) descricao += ` | Camisa ${item.camisa}`;
    if (item.renda) descricao += ` | Renda ${item.renda}`;
    if (item.cor_renda) descricao += ` | ${item.cor_renda}`;

    lista.innerHTML += `
      <div 
        class="item-busca"
        onclick="selecionarMaterialTransferencia(${item.id}, '${descricao.replace(/'/g, "\\'")}')"
      >
        ${descricao}
      </div>
    `;
  });
}

async function selecionarMaterialTransferencia(id, descricao) {
  document.getElementById("transfer_material_id").value = id;
  document.getElementById("buscaTransferencia").value = descricao;
  document.getElementById("listaTransferencia").innerHTML = "";

  await carregarGondolasOrigemTransferencia(id);
  await carregarGondolasDestinoTransferencia();
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
    select.innerHTML += `
      <option value="${item.id}">
        ${item.nome}
      </option>
    `;
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

  mostrarMensagem(dados.mensagem);
}

function buscarMaterialTransferencia() {
  const busca = document
    .getElementById("buscaTransferencia")
    .value
    .trim()
    .toLowerCase();

  const lista = document.getElementById("listaTransferencia");

  lista.innerHTML = "";

  if (!busca) {
    return;
  }

  const filtrados = materiaisCache.filter((item) => {
    const texto = [
      item.material,
      item.cor,
      item.camisa,
      item.renda,
      item.cor_renda
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return texto.includes(busca);
  });

  filtrados.forEach((item) => {
    let descricao = item.material || "";

    if (item.cor) descricao += ` | ${item.cor}`;
    if (item.camisa) descricao += ` | Camisa ${item.camisa}`;
    if (item.renda) descricao += ` | Renda ${item.renda}`;
    if (item.cor_renda) descricao += ` | ${item.cor_renda}`;

    lista.innerHTML += `
      <div 
        class="item-busca"
        onclick="selecionarMaterialTransferencia(${item.id}, '${descricao.replace(/'/g, "\\'")}')"
      >
        ${descricao}
      </div>
    `;
  });
}

async function selecionarMaterialTransferencia(id, descricao) {
  document.getElementById("transfer_material_id").value = id;
  document.getElementById("buscaTransferencia").value = descricao;
  document.getElementById("listaTransferencia").innerHTML = "";

  await carregarGondolasOrigemTransferencia(id);
  await carregarGondolasDestinoTransferencia();
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
    select.innerHTML += `
      <option value="${item.id}">
        ${item.nome}
      </option>
    `;
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

  mostrarMensagem(dados.mensagem);
}


function filtrarTabela() {
  const filtroProduto = document
    .getElementById("filtroProduto")
    .value
    .toLowerCase();

  const filtroGondola = document
    .getElementById("filtroGondola")
    .value
    .toLowerCase();

  const linhas = document.querySelectorAll("#tabelaEstoque tr");

  linhas.forEach((linha) => {
    const textoLinha = linha.innerText.toLowerCase();
    const gondolasLinha = linha.children[1].innerText.toLowerCase();

    const produtoConfere = textoLinha.includes(filtroProduto);
    const gondolaConfere =
      !filtroGondola || gondolasLinha.includes(filtroGondola);

    linha.style.display =
      produtoConfere && gondolaConfere ? "" : "none";
  });
}

function buscarMaterialMovimentacao() {
  const busca = document
    .getElementById("buscaMaterial")
    .value
    .trim()
    .toLowerCase();

  console.log("Buscando:", busca);
  console.log("Cache:", materiaisCache);

  const lista = document.getElementById("listaMateriais");

  lista.innerHTML = "";

  if (!busca) {
    return;
  }

  const filtrados = materiaisCache.filter((item) => {
    const texto = [
      item.material,
      item.cor,
      item.camisa,
      item.renda,
      item.cor_renda
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return texto.includes(busca);
  });

  filtrados.forEach((item) => {
    let descricao = item.material || "";

    if (item.cor) descricao += ` | ${item.cor}`;
    if (item.camisa) descricao += ` | Camisa ${item.camisa}`;
    if (item.renda) descricao += ` | Renda ${item.renda}`;
    if (item.cor_renda) descricao += ` | ${item.cor_renda}`;

    lista.innerHTML += `
      <div 
        class="item-busca"
        onclick="selecionarMaterial(${item.id}, '${descricao.replace(/'/g, "\\'")}')"
      >
        ${descricao}
      </div>
    `;
  });
}

async function selecionarMaterial(id, descricao) {
  materialSelecionadoId = id;

  document.getElementById("material_id").value = id;
  document.getElementById("buscaMaterial").value = descricao;
  document.getElementById("listaMateriais").innerHTML = "";

  await atualizarGondolasMovimentacao();
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
    const encontrada = gondolasComEstoque.find(
      (item) => item.gondola_id === gondola.id
    );

    const textoEstoque = encontrada
      ? ` | Estoque: ${encontrada.quantidade}`
      : ` | Sem estoque`;

    select.innerHTML += `
      <option value="${gondola.id}">
        ${gondola.nome}${textoEstoque}
      </option>
    `;
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

  gondolas.forEach((item) => {
    select.innerHTML += `
      <option value="${item.gondola_id}">
        ${item.gondola} | Estoque: ${item.quantidade}
      </option>
    `;
  });
}

carregarMateriais();
carregarGondolas();
carregarEstoque();
carregarMovimentacoes();