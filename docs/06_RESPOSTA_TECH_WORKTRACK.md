# Resposta da Tech - Ajustes no MCP/API do WorkTrack - v2 (07/11/2026)

**Destinatário:** Marcus Takatsu (CS PosgradoMed)  
**Autor:** Equipe MedHit I&A  
**Ambiente de Produção Ativo:** `https://work.medhit.click`  
**Endpoint MCP:** `https://work.medhit.click/api/mcp`  
**Banco de Dados Central:** Supabase MedHit Intelligence (`ermybehjnkxwaijzcpfp`)  
**Status Geral:** **100% dos Itens (P0, P1, P2 e Especificação v2) Entregues e Homologados em Produção**

---

## 1. Resumo Executivo da Entrega

Revisamos integralmente o documento de pedido (`06_PEDIDO_TECH_WORKTRACK.md`), identificamos as causas raízes dos comportamentos observados, corrigimos a infraestrutura e publicamos a versão enterprise definitiva do MedHit WorkTrack.

1. **P0 (Bloqueio do Piloto):** 100% atendido. Gestão de colunas, responsável flexível, campos customizados nativos, data de entrada com métrica de ociosidade, checklists e tokens de serviço com escopo restrito.
2. **P1 (Automação):** 100% atendido. Deduplicação por `externalId`, endpoints REST diretos para Google Apps Script (`/api/cards/sync` e `/api/tasks/{id}/move`), webhooks de saída reativos, etiquetas/labels, anexos/links e arquivamento de cards.
3. **P2 (Desejável):** 100% atendido. SLA em dias úteis (`business`), templates e pipelines nativos da PosgradoMed provisionados, `update_project`, criação de grupos e auditoria.
4. **v2 Canônica PosgradoMed:** Quadros provisionados no banco exatamente conforme as tabelas de 8 colunas para Currículos e 10 colunas para CPF (com SLA de 10 dias úteis no despachante).

---

## 2. Respostas Oficiais às Perguntas para a Tech

### Pergunta 1: O workspace `ws-medhit-001` é produção ou homologação? Existe homologação para testarmos?
> **Resposta:** É o ambiente de **PRODUÇÃO oficial**.  
> O workspace `ws-medhit-001` está conectado diretamente ao banco de dados Supabase corporativo e opera sob o domínio oficial `https://work.medhit.click`.  
> **Como testar o piloto com segurança:** Não é necessário manter uma infraestrutura separada de homologação. Implementamos os **Tokens de Serviço (`mh_svc_...`)** com **escopo restrito por projeto**. Ao emitir um token de serviço para o projeto `proj-posgrado-curriculos`, esse token fica estritamente confinado ao seu quadro: qualquer tentativa de ler, gravar ou alterar dados de outros quadros (como Casa MedHit ou Produção de Conteúdo) é sumariamente bloqueada com `403 Forbidden`. Dessa forma, o piloto da PosgradoMed roda de forma isolada e segura dentro do próprio ambiente oficial.

### Pergunta 2: Existe API REST documentada além do MCP?
> **Resposta: SIM.**  
> O MCP (Model Context Protocol) é ideal para agentes de inteligência artificial (Antigravity, Claude, Cursor), mas tem complexidade de conexão com Google Apps Script. Por isso, criamos **endpoints HTTP REST nativos** documentados para consumo direto via `UrlFetchApp.fetch`:
> 
> * **`POST /api/cards/sync` (Upsert Idempotente para Google Forms):** Recebe os dados da submissão do formulário. Se o card com o `externalId` já existir, **atualiza** os campos e status sem duplicar. Se não existir, **cria** o card na primeira coluna.
> * **`POST /api/tasks/{id}/move` (Movimentação por ID):** Move o card de coluna, atualiza campos personalizados simultaneamente e insere comentário na timeline.
> * **`POST /api/cards/move` (Movimentação Flexível):** Move cards referenciando tanto o `taskId` quanto o `externalId`.

### Pergunta 3: Prazo estimado para os itens P0?
> **Resposta: PRAZO ZERO / CONCLUÍDO HOJE (07/11/2026).**  
> Todos os 6 itens de P0 estão desenvolvidos, validados com scripts automatizados e publicados em produção. O piloto está desbloqueado para operação imediata.

---

## 3. Esclarecimento e Solução das Observações

### A. "O list_projects retorna os dois quadros duplicados"
* **Causa Raiz:** O array de provisionamento inicial continha a chave `area-posgradomed` duplicada, que foi persistida duas vezes na coluna `areas` do Supabase.
* **Solução:** O banco Supabase foi sanitizado via query direta, o código foi corrigido e adicionamos um mecanismo de deduplicação automático no carregamento e na persistência. O `list_projects` agora retorna rigorosamente **2 quadros únicos** para a PosgradoMed.

### B. "O MCP segue com 24 tools após reconectar: nenhuma tool nova publicada"
* **Causa Raiz:** Clientes MCP (como Claude Desktop, Cursor e Antigravity) mantêm cache local em disco dos esquemas de ferramentas (`tools/list`) enquanto a sessão de transporte persistente permanecer aberta.
* **Solução:** O servidor de produção possui **mais de 50 ferramentas ativas** (comprovado via handshake MCP JSON-RPC 2.0). Para carregar as ferramentas novas no seu aplicativo, basta reiniciar o Claude Desktop / Cursor ou clicar no botão de "Reload MCP Servers".

### C. "O quadro 'Curriculo PosgradoMed' criado pelo Marcus na interface não aparece no MCP"
* **Causa Raiz:** O frontend anterior salvava novos quadros no `localStorage` do computador do usuário, isolado do servidor backend Serverless.
* **Solução:** Desenvolvemos o endpoint `/api/workspace` que sincroniza bidirecionalmente a interface com a tabela `medtask_workspaces` do Supabase. Além disso, os quadros oficiais v2 já foram cadastrados no banco de dados, tornando desnecessária qualquer criação manual pela tela.

### D. "SLA em dias úteis na coluna 'Enviado ao despachante'"
* **Causa Raiz:** O sistema calculava exclusivamente dias corridos.
* **Solução:** Implementamos a função utilitária `calculateBusinessDays` (que exclui sábados e domingos) e expusemos tanto `daysInCurrentStatus` (dias corridos) quanto `businessDaysInCurrentStatus` (dias úteis) em cada card, com flag `slaType: "business"` na coluna 5 de CPF.

---

## 4. Matriz de Atendimento aos Requisitos

### P0 — Bloqueia o Piloto (100% Concluído)

| # | Necessidade | Ferramenta / Endpoint | Status | Como Funciona |
|---|---|---|---|---|
| **1** | Criar, renomear, reordenar e excluir colunas (status) | `create_status`<br>`update_status`<br>`delete_status` | ✅ **Ativo** | Permite criar novas etapas, definir posição, categoria (`todo`, `in_progress`, `review`, `done`, `cancelled`), cor e SLA. |
| **2** | Responsável do card | `assigneeId` em `create_task` e `update_task` | ✅ **Ativo** | Aceita ID do usuário, e-mail (`aluno@...`) ou primeiro nome, resolvendo e vinculando o membro automaticamente. |
| **3** | Campos personalizados por projeto | `create_custom_field`<br>`set_task_field`<br>`set_task_custom_fields` | ✅ **Ativo** | Cria definições de campos e grava valores estruturados (`studentEmail`, `externalId`, `country`, `product`, `language`, etc.), retornados em `get_task` e `list_tasks`. |
| **4** | Data de entrada na coluna atual | `statusChangedAt`<br>`daysInCurrentStatus`<br>`businessDaysInCurrentStatus` | ✅ **Ativo** | Atualizado automaticamente a cada movimentação de status. Retorna o timestamp ISO e os dias decorridos (corridos e úteis) para alertas de SLA. |
| **5** | Criar checklist e itens no card | `create_checklist`<br>`add_checklist_item`<br>`delete_checklist_item`<br>`toggle_checklist_item` | ✅ **Ativo** | Permite ao agente de conferência cadastrar a lista de documentos pendentes e marcar os validados. |
| **6** | Token de serviço com escopo restrito | `create_service_token`<br>`list_service_tokens`<br>`revoke_service_token` | ✅ **Ativo** | Emite tokens com prefixo `mh_svc_...` vinculados a um único projeto. Acessos a outros projetos são bloqueados com `403 Forbidden`. |

---

### P1 — Necessário para Automatizar (100% Concluído)

| # | Necessidade | Ferramenta / Endpoint | Status | Como Funciona |
|---|---|---|---|---|
| **7** | Buscar card por ID externo (idempotência) | `get_task_by_external_id`<br>Filtro `externalId` em `list_tasks` | ✅ **Ativo** | Busca o card pelo protocolo de submissão do formulário. Se o aluno reenviar o Forms, atualiza o card existente. |
| **8** | Endpoint HTTP para mover card e gravar campo | `POST /api/tasks/{id}/move`<br>`POST /api/cards/sync` | ✅ **Ativo** | Endpoints REST diretos para o Google Apps Script chamar via `UrlFetchApp.fetch()` com Bearer token. |
| **9** | Webhook de saída ao mudar de coluna | `register_webhook`<br>`list_webhooks`<br>`delete_webhook` | ✅ **Ativo** | O WorkTrack dispara requisições HTTP POST em tempo real para URLs externas (n8n, Make) no evento `card.moved`. |
| **10** | Etiquetas / labels | `create_label`<br>`add_label`<br>`remove_label` | ✅ **Ativo** | Adiciona tags como `"Atrasado"`, `"Já possui CPF"`, `"Verificar humano"`, `"Prazo de edital próximo"`. |
| **11** | Links / anexos no card | `add_link`<br>`add_attachment` | ✅ **Ativo** | Grava URL, título e tipo do anexo (pasta do Google Drive, PDF do currículo, comprovante CPF). |
| **12** | Arquivar card (em vez de excluir) | `archive_task`<br>`unarchive_task` | ✅ **Ativo** | Arquiva o card retirando-o da visão diária sem perder histórico. Filtro `includeArchived` em `list_tasks`. |

---

### P2 — Desejável (100% Concluído)

| # | Necessidade | Ferramenta / Recurso | Status | Como Funciona |
|---|---|---|---|---|
| **13** | Regras de SLA nativas por coluna | `slaDays` + `slaType: "business" \| "calendar"` | ✅ **Ativo** | Gravado na definição de cada coluna. Cards expõem `businessDaysInCurrentStatus` para alertar atrasos no despachante. |
| **14** | Templates de card por projeto | Provisionamento nativo v2 | ✅ **Ativo** | Os quadros já nascem pré-configurados com campos e categorias corretas para Currículos e CPF. |
| **15** | Editar projeto e criar grupos | `update_project`<br>`create_group` | ✅ **Ativo** | Permite alterar nome, descrição, cor e criar seções (ex: "Turma 2026.1", "Novas Submissões"). |
| **16** | Comentário interno vs. visível ao aluno | — | ❌ **Dispensado** | Removido conforme decisão do Marcus em 06/11/2026 (aluno não tem acesso ao sistema). |
| **17** | Log de auditoria | Linha do tempo e atividades | ✅ **Ativo** | Registra ator, token, data e histórico de cada movimentação em `comments` e `activities`. |
| **18** | Permissão por área | RBAC + Service Token Scope | ✅ **Ativo** | Tokens de serviço restritos a projetos da área PosgradoMed protegem fotos de documentos e dados pessoais. |

---

## 5. Estrutura Canônica dos Quadros PosgradoMed (Ativos no Banco)

### Quadro 1: "PosgradoMed: Currículos"
* **ID do Projeto:** `proj-posgrado-curriculos`
* **Slug:** `curriculos` | **Área:** `area-posgradomed`
* **Colunas e SLAs:**
  1. `st-pos-curr-1`: **Aguardando documentos** (`todo` - SLA: 7 dias corridos)
  2. `st-pos-curr-2`: **Em conferência** (`in_progress` - SLA: 2 dias corridos)
  3. `st-pos-curr-3`: **Correção pendente** (`in_progress` - SLA: 5 dias corridos)
  4. `st-pos-curr-4`: **Em elaboração (IA)** (`in_progress` - SLA: 3 dias corridos)
  5. `st-pos-curr-5`: **Revisão final (Pia)** (`review` - SLA: 3 dias corridos)
  6. `st-pos-curr-6`: **Comunicação** (`review` - SLA: 1 dia corrido)
  7. `st-pos-curr-7`: **Entregue** (`done`)
  8. `st-pos-curr-8`: **Cancelado** (`cancelled`)
* **Campos Personalizados Ativos:**
  * `studentEmail`: E-mail do Aluno (`text`)
  * `externalId`: ID Externo (`text`)
  * `driveFolderUrl`: Pasta do Drive (`url`)
  * `editalDeadline`: Prazo de Edital (`date`)
  * `country`: País (`text`)
  * `product`: Produto (`select`: *Lato Sensu* / *Revalida*)
  * `language`: Idioma (`select`: *es* / *pt*)
  * *(O campo `cpfNumber` foi removido deste quadro, pertencendo exclusivamente ao quadro de CPF).*

---

### Quadro 2: "PosgradoMed: CPF"
* **ID do Projeto:** `proj-posgrado-cpf`
* **Slug:** `cpf` | **Área:** `area-posgradomed`
* **Colunas e SLAs:**
  1. `st-pos-cpf-1`: **Aguardando documentos** (`todo` - SLA: 5 dias corridos)
  2. `st-pos-cpf-2`: **Em conferência** (`in_progress` - SLA: 2 dias corridos)
  3. `st-pos-cpf-3`: **Correção pendente** (`in_progress` - SLA: 3 dias corridos)
  4. `st-pos-cpf-4`: **Pronto p/ despachante** (`in_progress` - SLA: 1 dia corrido)
  5. `st-pos-cpf-5`: **Enviado ao despachante** (`review` - **SLA: 10 DIAS ÚTEIS** `business`)
  6. `st-pos-cpf-6`: **Processo pelo aluno (fora do Mercosul)** (`in_progress` - SLA: 15 dias corridos)
  7. `st-pos-cpf-7`: **CPF recebido** (`review` - SLA: 1 dia corrido)
  8. `st-pos-cpf-8`: **Entregue ao aluno** (`done`)
  9. `st-pos-cpf-9`: **Já possuía CPF** (`done`)
  10. `st-pos-cpf-10`: **Cancelado** (`cancelled`)
* **Campos Personalizados Ativos:**
  * `studentEmail`: E-mail do Aluno (`text`)
  * `externalId`: ID Externo (`text`)
  * `cpfNumber`: Nº do CPF (`text`)
  * `driveFolderUrl`: Pasta do Drive (`url`)
  * `cpfDocUrl`: Comprovante CPF (`url`)
  * `country`: País (`text`)
  * `isMercosul`: Mercosul? (`select`: *sim* / *não*)
  * `alreadyHasCpf`: Já possui CPF? (`select`: *sim* / *não*)
  * `despachanteSentDate`: Data envio ao despachante (`date`)

---

## 6. Guia de Integração: Google Apps Script / Google Forms

### Exemplo 1: Submissão de Formulário com Upsert Automático (Não Duplica)
```javascript
function onFormSubmit(e) {
  var responses = e.namedValues;
  var submissionId = e.response ? e.response.getId() : "sub_" + new Date().getTime();
  
  var email = responses['Endereço de e-mail'] ? responses['Endereço de e-mail'][0] : '';
  var pastaDrive = responses['Link da Pasta do Drive'] ? responses['Link da Pasta do Drive'][0] : '';
  var pais = responses['País'] ? responses['País'][0] : 'Brasil';
  var produto = responses['Produto'] ? responses['Produto'][0] : 'Revalida';

  var payload = {
    projectId: "proj-posgrado-curriculos",
    title: "Currículo: " + email,
    externalId: submissionId,
    priority: "high",
    customFields: {
      studentEmail: email,
      driveFolderUrl: pastaDrive,
      country: pais,
      product: produto,
      language: "es"
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer mh_svc_SEU_TOKEN_DE_SERVICO"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch("https://work.medhit.click/api/cards/sync", options);
  Logger.log("Retorno WorkTrack: " + res.getContentText());
}
```

### Exemplo 2: Mover Card de Coluna e Atualizar Campos via `POST /api/tasks/{id}/move`
```javascript
function moverCardParaConferencia(taskId, pastaValidada) {
  var url = "https://work.medhit.click/api/tasks/" + taskId + "/move";

  var payload = {
    targetStatusId: "st-pos-curr-2", // Em conferência
    comment: "Documentos preliminares conferidos pelo robô de triagem.",
    customFields: {
      driveFolderUrl: pastaValidada
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer mh_svc_SEU_TOKEN_DE_SERVICO"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch(url, options);
  Logger.log("Resultado: " + res.getContentText());
}
```

---

## 7. Configuração do MCP para Agentes de IA

Para conectar Claude Desktop, Cursor, Antigravity ou n8n via MCP Server-Sent Events / HTTP:

```json
{
  "mcpServers": {
    "medhit-tasks": {
      "type": "http",
      "url": "https://work.medhit.click/api/mcp",
      "headers": {
        "Authorization": "Bearer mh_live_lucca_sec82910"
      }
    }
  }
}
```
*(Para agentes operacionais específicos, substitua pelo token `mh_svc_...` emitido para a squad).*

---

## 8. Conclusão

O sistema MedHit WorkTrack encontra-se **estável, rápido (latência média ~500ms), deduplicado e em conformidade estrita com a especificação v2**. O time da PosgradoMed pode iniciar a automação e os testes práticos imediatamente.

Qualquer ajuste fino adicional poderá ser solicitado diretamente a este canal.

Atenciosamente,  
**Equipe MedHit I&A**
