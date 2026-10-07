"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  Layers,
  Folder,
  CheckSquare,
  LayoutGrid,
  List,
  Filter,
  Users,
  Search,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Lightbulb,
} from "lucide-react";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "overview" | "hierarchy" | "views" | "tasks" | "collaboration";

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/30 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Central de Ajuda & Guia</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-500 font-mono font-semibold">
                  Manual para Usuários
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aprenda como gerenciar demandas, organizar pastas e colaborar no Medhit WorkTrack.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-white/10 flex items-center gap-2 overflow-x-auto bg-slate-50/40 dark:bg-black/10 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-3.5 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "overview"
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Como Começar</span>
          </button>

          <button
            onClick={() => setActiveTab("hierarchy")}
            className={cn(
              "px-3.5 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "hierarchy"
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Espaços e Pastas</span>
          </button>

          <button
            onClick={() => setActiveTab("views")}
            className={cn(
              "px-3.5 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "views"
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>Lista vs Quadro (Kanban)</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={cn(
              "px-3.5 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "tasks"
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Criando & Editando Tarefas</span>
          </button>

          <button
            onClick={() => setActiveTab("collaboration")}
            className={cn(
              "px-3.5 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "collaboration"
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Equipe, Prazos & Permissões</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="rounded-xl p-4 bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-200 text-xs leading-relaxed flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-sm mb-1">
                    Bem-vindo ao Medhit WorkTrack!
                  </strong>
                  O WorkTrack foi desenhado para ser tão direto e intuitivo quanto o ClickUp e o Monday.com,
                  permitindo que qualquer membro da equipe organize e acompanhe demandas sem complicações.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-sm">Escolha seu Espaço</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Na barra lateral à esquerda, selecione o Espaço correspondente à sua área (Campanhas Marketing, Produção Contínuas, Operação Thiago ou Integrações).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-sm">Filtre por Pasta</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Clique na pasta desejada (por exemplo, <em>Simulado Reta Final</em> ou <em>Design</em>) para visualizar somente o que pertence àquele projeto.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-sm">Crie & Conclua</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Digite o título na linha rápida ou clique em <em>+ Nova Tarefa</em>. Altere status com um único clique na badge colorida!
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Atalhos de Teclado Rápidos</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-mono text-[10px]">⌘K</kbd>
                    <span className="text-slate-500">Busca global</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-mono text-[10px]">N</kbd>
                    <span className="text-slate-500">Nova tarefa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-mono text-[10px]">Esc</kbd>
                    <span className="text-slate-500">Fechar janela</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-mono text-[10px]">Enter</kbd>
                    <span className="text-slate-500">Salvar inline</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "hierarchy" && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-bold mb-1">Como o sistema é estruturado (Padrão ClickUp):</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  O Medhit WorkTrack utiliza uma hierarquia clara de 3 níveis para manter tudo organizado:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-pink-500/20 bg-pink-500/5 flex items-start gap-3">
                  <Layers className="h-5 w-5 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-pink-600 dark:text-pink-400">1. Espaços (Spaces)</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      São as grandes áreas operacionais da MedHit (ex: <strong>Campanhas Marketing</strong>, <strong>Produção Contínuas</strong>, <strong>Operação Thiago</strong>, <strong>Integrações & Automações</strong>). Cada espaço possui seu quadro geral de tarefas.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                  <Folder className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400">2. Pastas (Folders / Tags)</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Ficam dentro de cada espaço e representam entregas específicas, campanhas ou áreas funcionais (ex: <em>Simulado Reta Final</em>, <em>Audiovisual</em>, <em>Copywriting</em>, <em>n8n Pipelines</em>). Ao clicar em uma pasta, a tabela filtra automaticamente.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 flex items-start gap-3">
                  <CheckSquare className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-sky-600 dark:text-sky-400">3. Tarefas (Tasks)</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      São as atividades individuais a serem executadas. Contêm título, status, responsável, prioridade, data de entrega, critérios de aceite (checklist) e comentários.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-100 dark:bg-white/[0.03] text-slate-500 text-[11px]">
                💡 <strong>Dica:</strong> Você pode criar uma nova pasta a qualquer momento clicando em <em>+ Nova Pasta</em> na barra superior ou na barra lateral sob o espaço ativo.
              </div>
            </div>
          )}

          {activeTab === "views" && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-bold mb-1">Escolhendo a melhor visão para seu trabalho</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Você pode alternar entre Lista e Quadro a qualquer momento no topo da tela:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center gap-2 text-sky-500 font-bold text-sm">
                    <List className="h-4 w-4" />
                    <span>Visão em Lista / Tabela</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Ideal para quem gosta de alta produtividade e visualização de muitas demandas ao mesmo tempo.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                    <li>Edição de título diretamente na linha</li>
                    <li>Seleção em massa com checkbox para concluir ou excluir</li>
                    <li>Agrupamento por Pasta, Status, Prioridade ou Responsável</li>
                    <li>Ordenação rápida clicando nos cabeçalhos de coluna</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Quadro Kanban</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Ideal para reuniões de alinhamento e acompanhamento visual do fluxo de trabalho.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                    <li>Colunas organizadas por etapa: A Fazer → Em Andamento → Em Revisão → Concluído</li>
                    <li>Arrastar e soltar (drag & drop) fluido entre colunas</li>
                    <li>Cards com prazos coloridos e badges de prioridade</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold">Como gerenciar uma tarefa no dia a dia:</h3>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-white/10 space-y-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">1. Como alterar o status de uma demanda?</h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Basta clicar no botão colorido de status (ex: <em>A Fazer</em>, <em>Em Andamento</em>) na tabela. Um menu se abrirá e você escolhe a nova etapa com 1 clique. Você também pode clicar no círculo de seleção à esquerda para concluir imediatamente.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-white/10 space-y-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">2. Como atribuir um responsável?</h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Na coluna <em>Responsável</em>, clique no avatar ou no botão <em>+ Atribuir</em> para selecionar um membro da equipe ou robô de automação.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-white/10 space-y-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">3. Como abrir os detalhes completos da tarefa?</h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Clique no título da tarefa. Um painel lateral completo se abrirá à direita com checklists de critérios de aceite, histórico de comentários e descrição rica.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "collaboration" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold">Perfis de Acesso & Segurança Institucional</h3>
              <p className="text-slate-500 dark:text-slate-400">
                O Medhit WorkTrack possui controle rigoroso de quem pode ver e modificar o quê:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="font-bold text-sky-500">Proprietário (Owner)</div>
                  <p className="text-slate-500 text-[11px]">
                    Acesso irrestrito a configurações institucionais, exclusão de espaços, gerenciamento de membros e auditoria de telemetria.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="font-bold text-emerald-500">Administrador (Admin)</div>
                  <p className="text-slate-500 text-[11px]">
                    Pode criar e organizar espaços, gerenciar equipes, convidar novos colegas e aprovar demandas.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="font-bold text-slate-400">Membro & Colaborador</div>
                  <p className="text-slate-500 text-[11px]">
                    Cria e atualiza tarefas diárias, movimenta status, marca checklists e comenta nas entregas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            Medhit WorkTrack • Documentação Institucional
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-colors cursor-pointer text-xs"
          >
            Entendido, fechar guia
          </button>
        </div>
      </div>
    </div>
  );
}
