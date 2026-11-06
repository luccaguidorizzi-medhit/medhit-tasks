# Model Context Protocol (MCP) & REST API — MedHit WorkTrack

> **Mantido por:** Equipe MedHit I&A  
> **Protocolo:** Model Context Protocol (MCP) — Especificação 2024-11-05  
> **Servidor MCP:** `POST https://work.medhit.click/api/mcp`  
> **API REST Direta (Apps Script / Forms / n8n):** `POST https://work.medhit.click/api/cards/sync`  
> **Autenticação:** `Authorization: Bearer <MCP_TOKEN>` ou `<SERVICE_TOKEN>`

---

## 1. Visão Geral da Arquitetura Unificada

O **MedHit WorkTrack** adota uma arquitetura de sincronização viva baseada no **Supabase** (`medtask_workspaces`, `medtask_tasks`, `medtask_service_tokens`, `medtask_webhooks`). 

### Problema Resolvido: Zero Divergência entre Tela e MCP
Anteriormente, criações de quadros no navegador ficavam isoladas no `localStorage` do usuário local. Agora:
- **Toda alteração de quadro, status ou card na interface web** é persistida em tempo real no Supabase.
- **Toda alteração realizada via MCP, Apps Script ou n8n** é gravada no Supabase e refletida imediatamente na tela de todos os colaboradores.
- O ambiente do MCP e o ambiente da tela apontam para a **mesma e única fonte da verdade corporativa**.

---

## 2. Squad PosgradoMed & Pipelines Nativos

O workspace inclui nativamente a squad **PosgradoMed** com pipelines configurados para o piloto:

### A. Pipeline: Validação de Currículos (`proj-posgrado-curriculos`)
- **Colunas Padrão:**
  1. `Recebido / Triagem` (todo, SLA: 2 dias)
  2. `Em Análise Técnica` (in_progress, SLA: 3 dias)
  3. `Pendente Documento` (review, SLA: 5 dias)
  4. `Currículo Deferido` (done)
  5. `Indeferido` (cancelled)
- **Campos Customizados:**
  - `studentEmail` (E-mail do Aluno)
  - `externalId` (ID Externo / Inscrição)
  - `cpfNumber` (Nº do CPF)
  - `driveFolderUrl` (Pasta do Drive com PDFs)
  - `editalDeadline` (Prazo do Edital)

### B. Pipeline: Validação de CPF (`proj-posgrado-cpf`)
- **Colunas Padrão:**
  1. `Aguardando Envio` (todo, SLA: 2 dias)
  2. `Em Conferência Cadastral` (in_progress, SLA: 2 dias)
  3. `Pendência na Receita` (review, SLA: 4 dias)
  4. `CPF Validado & Aprovado` (done)
  5. `Cadastro Rejeitado` (cancelled)
- **Campos Customizados:**
  - `studentEmail` (E-mail do Aluno)
  - `externalId` (ID de Envio)
  - `cpfNumber` (Número de CPF)
  - `driveFolderUrl` (Pasta do Google Drive)
  - `cpfDocUrl` (Comprovante Receita / PDF)

---

## 3. Catálogo Completo das Ferramentas MCP

### A. Gestão de Colunas & Status do Projeto (P0 - Item 1)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `create_status` | `projectId` (req), `name` (req), `color`, `position`, `category`, `slaDays` | Cria uma nova coluna no quadro (ex: "Em Análise Médica"). |
| `update_status` | `projectId` (req), `statusId` (req), `name`, `color`, `position`, `category`, `slaDays` | Renomeia, troca cor, reordena ou altera o SLA de uma coluna. |
| `delete_status` | `projectId` (req), `statusId` (req), `targetStatusIdForTasks` (opcional) | Remove a coluna e opcionalmente migra os cards existentes para outra coluna. |

### B. Responsável do Card & Status Tracking (P0 - Itens 2 e 4)

- **`assigneeId` Flexível:** Em `create_task` e `update_task`, você pode passar `assigneeId` informando o ID (`user-1`), o e-mail (`vinicius.takatsu@mundorevalida.com.br`) ou o nome do colaborador. O sistema mapeia e atribui automaticamente.
- **`statusChangedAt` & Tempo Parado:** Todo card expõe:
  - `statusChangedAt`: Data/hora ISO em que o card entrou na coluna atual.
  - `daysInCurrentStatus`: Total de dias parado na coluna (útil para alertas de SLA e "parado há X dias").

### C. Campos Personalizados por Projeto (P0 - Item 3)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `create_custom_field` | `projectId` (req), `name` (req), `key` (req), `type` (`text\|number\|date\|url\|select`, req), `description` | Cria a definição de um campo customizado no projeto. |
| `set_task_custom_fields` | `taskId` (req), `customFields` (object, req) | Grava valores nos campos personalizados do card. |

### D. Checklists Completos (P0 - Item 5)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `create_checklist` | `taskId` (req), `title` (req) | Cria um novo checklist no card. |
| `add_checklist_item` | `taskId` (req), `checklistId` (req), `title` (req) | Adiciona um item ao checklist. |
| `delete_checklist_item` | `taskId` (req), `checklistId` (req), `itemId` (req) | Exclui um item de checklist. |
| `toggle_checklist_item` | `taskId` (req), `checklistId` (req), `itemId` (req) | Marca ou desmarca a conclusão de um item. |

### E. Tokens de Serviço com Escopo Restrito (P0 - Item 6)

Para que automações (Google Apps Script, n8n, webhooks) não utilizem tokens pessoais de Owner:
- `create_service_token`: Gera um token `mh_svc_...` restrito a um `projectId`. Se o script tentar acessar outro quadro, recebe `403 Forbidden`.
- `list_service_tokens`: Lista tokens ativos e seus escopos.
- `revoke_service_token`: Invalida e revoga um token.

### F. Automação, Deduplicação & Anexos (P1 - Itens 7, 9, 10, 11, 12)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `get_task_by_external_id` | `externalId` (req), `projectId` (opcional) | Busca o card pelo ID externo do formulário/aluno para evitar duplicatas. |
| `register_webhook` | `url` (req), `projectId` (opcional), `events` (opcional) | Cadastra URL para receber notificação HTTP sempre que um card mudar de coluna. |
| `list_webhooks` / `delete_webhook` | `webhookId` | Gerencia os webhooks de saída ativos. |
| `add_tag` / `remove_tag` | `taskId` (req), `tag` (req) | Adiciona ou remove etiquetas do card. |
| `add_attachment` | `taskId` (req), `title` (req), `url` (req), `type` | Anexa links (Google Drive, PDF de currículo, comprovante do CPF). |
| `archive_task` / `unarchive_task` | `taskId` (req) | Arquiva ou desarquiva um card sem excluí-lo. |

---

## 4. Endpoint HTTP Direto para Google Forms & Apps Script (P1 - Item 8)

Para automações no Google Forms / Sheets / Apps Script, você não precisa de bibliotecas MCP complexas. Basta uma chamada HTTP REST direta:

### Endpoint: `POST https://work.medhit.click/api/cards/sync`

**Comportamento (UPSERT Inteligente):**
- Se o card com `externalId` já existir no projeto -> Atualiza os dados e colunas sem duplicar.
- Se não existir -> Cria o card automaticamente na coluna desejada.

### Exemplo em Google Apps Script:

```javascript
function onFormSubmit(e) {
  var token = "mh_svc_posgrado_appscript"; // Token gerado via create_service_token
  var url = "https://work.medhit.click/api/cards/sync";
  
  var payload = {
    projectId: "proj-posgrado-curriculos",
    externalId: "aluno-" + e.namedValues['ID'][0],
    title: e.namedValues['Nome Completo'][0],
    statusId: "st-pos-curr-1", // Recebido / Triagem
    priority: "high",
    customFields: {
      studentEmail: e.namedValues['E-mail'][0],
      cpfNumber: e.namedValues['CPF'][0],
      driveFolderUrl: e.namedValues['Link da Pasta do Drive'][0],
      editalDeadline: "2026-12-15"
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}
```

### Mover Card via REST (`POST https://work.medhit.click/api/cards/move`)

```javascript
UrlFetchApp.fetch("https://work.medhit.click/api/cards/move", {
  method: "post",
  contentType: "application/json",
  headers: { "Authorization": "Bearer " + token },
  payload: JSON.stringify({
    externalId: "aluno-123",
    projectId: "proj-posgrado-curriculos",
    targetStatusId: "st-pos-curr-2" // Em Análise Técnica
  })
});
```

---

## 5. Webhook de Saída (Exemplo de Payload Recebido)

Quando um card é movido de coluna, o MedHit WorkTrack envia um `POST` com:

```json
{
  "event": "card.moved",
  "timestamp": "2026-11-06T18:40:00Z",
  "card": {
    "id": "task-12345",
    "title": "Dr. Carlos Eduardo",
    "projectId": "proj-posgrado-curriculos",
    "statusId": "st-pos-curr-4",
    "previousStatusId": "st-pos-curr-2",
    "statusChangedAt": "2026-11-06T18:40:00Z",
    "externalId": "aluno-987",
    "customFields": {
      "studentEmail": "carlos@medico.com.br",
      "cpfNumber": "123.456.789-00",
      "driveFolderUrl": "https://drive.google.com/..."
    }
  }
}
```

---
*Documentação oficial mantida pela **Equipe MedHit I&A**.*
