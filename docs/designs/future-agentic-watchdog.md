# Especificação Futura: MedHit Agentic Watchdog & Orchestrator (Áudio & Follow-up)

*   **Autor:** Lucca G. & Thiago G. (MedHit)
*   **Status:** Backlog / Visão Estratégica Futura
*   **Data de Registro:** 2026-11-04
*   **Origem:** Transcrição e análise de direcionamento de áudio

---

## 1. Visão Geral do Conceito

Conforme detalhado no alinhamento por áudio, a camada agêntica futura atuará como um **Coordenador Ativo e "Cão de Guarda" (Watchdog)** de projetos e campanhas operacionais da MedHit. Em vez de ser apenas um chat de IA passivo, o agente possui consciência do fluxo de trabalho, dos prazos e dos responsáveis definidos no pipeline.

---

## 2. Dinâmica de Funcionamento (Workflow Operacional)

### D0 — Distribuição e Alinhamento Inicial
1. O gestor/coordenador desenha a estratégia e estrutura as entregas do projeto no WorkTrack (ou no Slack/pipeline integrado).
2. O agente absorve a árvore de tarefas e identifica automaticamente os responsáveis de cada etapa.
3. O agente realiza a comunicação de abertura:
   * **No Grupo (Canal Geral / Slack):** Envia um *Overview Geral* com a visão macro do cronograma, objetivos e marcos da entrega.
   * **No Individual (DM / WhatsApp / Slack):** Notifica cada colaborador individualmente com sua lista específica de entregas, links necessários e prazos estipulados.

### D1..Dn — Checagem Ativa de Entregáveis e Follow-up Contínuo
1. **Verificação de Ativos:** O agente monitora se os entregáveis foram efetivamente depositados no local combinado (ex.: pasta do Drive, Panda Video, Figma ou Notion).
2. **Exemplo Prático (Campanha de Marketing / Lançamento):**
   * *Caso 1 (Criativos de Anúncio):* O agente checa a pasta de criativos. Se o arquivo não estiver presente:
     * Dispara cobrança amigável no dia: *"Pessoal/Nome, os criativos desta campanha ainda não constam na pasta."*
     * Persistindo a pendência no dia seguinte: *"Já se passaram 2 dias sem os criativos na pasta. Isso acarretará atraso no disparo das campanhas programadas."*
   * *Caso 2 (Landing Page / Copy / Vídeo):* Checa se a página está no ar ou se a aula foi postada no Panda.
3. **Escalação e Visibilidade:**
   * Notificações contextuais individuais (para quem deve entregar).
   * Notificações transparentes no grupo (para que a equipe e a coordenação saibam exatamente onde o fluxo está travado antes que o prazo estoure).

---

## 3. Próximos Passos de Integração (Quando for implementado)
* Webhooks de notificação no Slack / Discord / WhatsApp corporativo.
* Verificação automática de arquivos em diretórios do Google Drive via API.
* Gatilhos no MedHit Tasks (WorkTrack) para acionamento no D0.

*Registrado por: Equipe MedHit I&A*
