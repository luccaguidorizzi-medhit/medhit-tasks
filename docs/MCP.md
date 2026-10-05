# Model Context Protocol (MCP) - Servidor MedHit Tasks

> Autor: **Lagana Flow**  
> Protocolo: Model Context Protocol (MCP)  
> Transporte: Streamable HTTP (`POST /api/mcp`)  
> Autenticação: `Authorization: Bearer <API_KEY>`

---

## 1. Visão Geral

O MedHit Task Manager possui um servidor MCP embutido e nativo, permitindo que agentes externos (Claude Desktop, Cursor IDE, Antigravity, n8n, scripts Python) interajam com o sistema com as mesmas permissões e isolamento dos usuários humanos.

---

## 2. Ferramentas (Tools) Disponíveis

### Leitura
- `list_areas`: Retorna todas as áreas do workspace.
- `list_projects`: Retorna os projetos de uma área ou todos os projetos do workspace.
- `list_tasks`: Lista tarefas com filtros (`projectId`, `statusId`, `priority`).
- `get_task`: Detalhes completos da tarefa por ID (`taskId`).

### Escrita
- `create_task`: Cria uma nova tarefa com título, status, prioridade e contexto de IA opcional.

### Ciclo de Vida do Agente
- `claim_next_task`: Reivindica atomicamente a próxima tarefa de agente na fila (`agentId`).
- `report_progress`: Registra passos de raciocínio, ferramentas e resultados (`runId`, `eventType`, `content`).
- `request_approval`: Solicita aprovação humana para ações sensíveis (`taskId`, `agentId`, `requestedAction`, `payload`).
- `complete_task`: Finaliza a execução do agente e move a tarefa para o status de conclusão (`runId`).

---

## 3. Exemplo de Chamada JSON-RPC (HTTP POST)

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer medtask_live_9a7f3c21_sec82910" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-1",
    "method": "tools/call",
    "params": {
      "name": "list_tasks",
      "arguments": {}
    }
  }'
```
