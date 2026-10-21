# -*- coding: utf-8 -*-
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

prs = pptx.Presentation(r'C:\Users\Lucca\Downloads\Apresentacao_MedHit_Help (1).pptx')

def set_para(p, text, size_pt, bold=False, color_rgb=(0,0,0), space_after_pt=0):
    p.text = text
    p.font.size = Pt(size_pt)
    p.font.bold = bold
    p.font.color.rgb = RGBColor(*color_rgb)
    if space_after_pt:
        p.space_after = Pt(space_after_pt)

def clear_and_set_paragraphs(tf, para_defs):
    while len(tf.paragraphs) > 1:
        p = tf.paragraphs[-1]._p
        p.getparent().remove(p)
    for idx, (txt, sz, b, col, spc) in enumerate(para_defs):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        set_para(p, txt, sz, b, col, spc)

# SLIDE 1
s1 = prs.slides[0]
tf1 = s1.shapes[2].text_frame
set_para(tf1.paragraphs[0], 'LANÇAMENTO OFICIAL & WORKSPACE DE GESTÃO', 13, bold=True, color_rgb=(0x4E, 0xB4, 0xBD), space_after_pt=14)
set_para(tf1.paragraphs[1], 'Bem-vindo ao\nMedhit WorkTrack 🚀', 44, bold=True, color_rgb=(0xFF, 0xFF, 0xFF), space_after_pt=20)
set_para(tf1.paragraphs[2], 'A nova esteira integrada de projetos, quadros e tarefas da MedHit.', 18, bold=False, color_rgb=(0xCB, 0xD5, 0xE1), space_after_pt=12)
set_para(tf1.paragraphs[3], '✨ Visibilidade total, prazos claros e colaboração sem atrito.', 16, bold=True, color_rgb=(0x4E, 0xB4, 0xBD))
set_para(s1.shapes[5].text_frame.paragraphs[0], 'CENTRAL WORKTRACK MEDHIT', 12, bold=True, color_rgb=(0x4E, 0xB4, 0xBD))

# SLIDE 2: Contexto & Necessidade
s2 = prs.slides[1]
set_para(s2.shapes[0].text_frame.paragraphs[0], 'CONTEXTO & NECESSIDADE', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s2.shapes[1].text_frame.paragraphs[0], 'Por que o WorkTrack? A evolução da nossa gestão de demandas', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

left_defs_s2 = [
    ('❌ COMO ERA ANTES (Gargalos)', 16, True, (0xF4, 0x3F, 0x5E), 16),
    ('⚠️ Demandas dispersas em mensagens:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   Pedidos chegavam por WhatsApp, Slack ou conversas soltas sem fila única.', 12, False, (0x64, 0x74, 0x8B), 10),
    ('⚠️ Incerteza de prazos e responsáveis:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   Falta de clareza sobre quem estava executando e quando seria entregue.', 12, False, (0x64, 0x74, 0x8B), 10),
    ('⚠️ Ferramentas pesadas e confusas:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   ClickUp com excesso de pastas e burocracia que travava a rotina da equipe.', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s2.shapes[4].text_frame, left_defs_s2)

right_defs_s2 = [
    ('✅ COMO É AGORA COM O MEDHIT WORKTRACK', 16, True, (0x0D, 0x94, 0x88), 16),
    ('🎯 Painel Único & Hierarquia Clara:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   Estrutura limpa: Workspace > Projetos > Quadros > Tarefas visíveis.', 12, False, (0x64, 0x74, 0x8B), 10),
    ('⚡ Visualização em Tempo Real (Live):', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   Quadro Kanban fluido e Tabela ágil com alteração de status em 1 clique.', 12, False, (0x64, 0x74, 0x8B), 10),
    ('📋 Autonomia, Simplicidade & Foco:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   Checklists, prioridades, datas de entrega e visão limpa sem poluição.', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s2.shapes[6].text_frame, right_defs_s2)

# SLIDE 3: Modelo Mental & Estrutura
s3 = prs.slides[2]
set_para(s3.shapes[0].text_frame.paragraphs[0], 'ARQUITETURA & MODELO MENTAL', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s3.shapes[1].text_frame.paragraphs[0], 'Como o trabalho é organizado no Medhit WorkTrack', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

left_defs_s3 = [
    ('🏗️ PROJETO & QUADROS', 16, True, (0x02, 0x84, 0xC7), 10),
    ('O grande guarda-chuva de objetivos da equipe.', 12, False, (0x64, 0x74, 0x8B), 14),
    ('📌 Exemplo Real: Projeto "CASA MEDHIT 2026"', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   Reúne todas as frentes de uma grande iniciativa da empresa.', 12, False, (0x64, 0x74, 0x8B), 10),
    ('📌 Quadros de Execução Temáticos:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   • Obras & Estrutural (Fundações, Alvenaria, Cobertura)', 12, False, (0x64, 0x74, 0x8B), 4),
    ('   • Instalações & Redes (Elétrica, Hidráulica, Climatização)', 12, False, (0x64, 0x74, 0x8B), 4),
    ('   • Acabamento & Entrega (Pintura, Decoração, Vistoria)', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s3.shapes[4].text_frame, left_defs_s3)

right_defs_s3 = [
    ('✅ TAREFAS, STATUS & ENTREGAS', 16, True, (0x10, 0xB9, 0x81), 10),
    ('A unidade prática de ação do dia a dia de cada colaborador.', 12, False, (0x64, 0x74, 0x8B), 14),
    ('📌 Ciclo de Vida Visual e Intuitivo:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   • A Fazer (Planejado e pronto para iniciar)', 12, False, (0x64, 0x74, 0x8B), 4),
    ('   • Em Andamento (Trabalho ativo com responsável)', 12, False, (0x64, 0x74, 0x8B), 4),
    ('   • Em Revisão (Conferência de qualidade / aprovação)', 12, False, (0x64, 0x74, 0x8B), 4),
    ('   • Concluído (Entrega validada com sucesso)', 12, False, (0x64, 0x74, 0x8B), 10),
    ('📌 Metadados Ricos:', 13, True, (0x1E, 0x29, 0x3B), 0),
    ('   Prioridade visual, prazo limite, checklists internos e histórico.', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s3.shapes[6].text_frame, right_defs_s3)

# SLIDE 4: Passo a Passo Inicial
s4 = prs.slides[3]
set_para(s4.shapes[0].text_frame.paragraphs[0], 'PRIMEIROS PASSOS', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s4.shapes[1].text_frame.paragraphs[0], 'Como acessar e navegar no Medhit WorkTrack', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

s4.shapes[5].text_frame.paragraphs[0].text = 'Acesso Direto'
s4.shapes[5].text_frame.paragraphs[1].text = 'Acesse work.medhit.click e entre com seu e-mail corporativo @medhit.com.br.'
s4.shapes[8].text_frame.paragraphs[0].text = 'Menu Lateral'
s4.shapes[8].text_frame.paragraphs[1].text = 'Visualize seus projetos ativos e quadros com navegação limpa e direta à esquerda.'
s4.shapes[11].text_frame.paragraphs[0].text = 'Escolha a Visão'
s4.shapes[11].text_frame.paragraphs[1].text = 'Alterne instantaneamente entre Quadro Kanban, Tabela estilo Monday ou Calendário.'
s4.shapes[14].text_frame.paragraphs[0].text = 'Acompanhe Hoje'
s4.shapes[14].text_frame.paragraphs[1].text = 'Abra "Minhas Tarefas" para ver exatamente o que está sob sua responsabilidade.'

# SLIDE 5: Gestão Prática de Tarefas
s5 = prs.slides[4]
set_para(s5.shapes[0].text_frame.paragraphs[0], 'GESTÃO PRÁTICA', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s5.shapes[1].text_frame.paragraphs[0], 'Criando e atualizando tarefas com agilidade', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

left_defs_s5 = [
    ('Três formas simples de interagir:', 15, True, (0x0F, 0x24, 0x40), 14),
    ('Passo 1: Criação Rápida em 1 Linha', 13, True, (0x02, 0x84, 0xC7), 2),
    ('   Digite o título diretamente no campo inline e aperte Enter. A tarefa surge na hora.', 12, False, (0x64, 0x74, 0x8B), 10),
    ('Passo 2: Arraste ou Altere a Badge', 13, True, (0x02, 0x84, 0xC7), 2),
    ('   No Kanban, arraste para a coluna ao lado. Na Tabela, clique na cor do status para mudar.', 12, False, (0x64, 0x74, 0x8B), 10),
    ('Passo 3: Detalhes na Gaveta Lateral', 13, True, (0x02, 0x84, 0xC7), 2),
    ('   Clique na tarefa para abrir a gaveta: adicione checklists, notas e comentários.', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s5.shapes[4].text_frame, left_defs_s5)

right_defs_s5 = [
    ('💡 DICA DE PRODUTIVIDADE', 15, True, (0xB4, 0x53, 0x09), 12),
    ('Tudo sincroniza em tempo real!', 13, True, (0x78, 0x35, 0x0F), 8),
    ('Se você ou outro membro mover uma tarefa no quadro, ela é atualizada instantaneamente na nuvem sem necessidade de recarregar a página.\n\nVocê pode filtrar por prioridade (Urgente, Alta, Média) e acompanhar o avanço percentual da esteira.', 12, False, (0x78, 0x35, 0x0F), 0),
]
clear_and_set_paragraphs(s5.shapes[6].text_frame, right_defs_s5)

# SLIDE 6: Demonstração Temática "CASA MEDHIT 2026"
s6 = prs.slides[5]
set_para(s6.shapes[0].text_frame.paragraphs[0], 'CASO PRÁTICO & DEMONSTRAÇÃO', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s6.shapes[1].text_frame.paragraphs[0], 'A esteira "CASA MEDHIT 2026": da fundação à entrega', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

s6.shapes[4].text_frame.paragraphs[0].text = '🧱'
s6.shapes[4].text_frame.paragraphs[1].text = 'Fundações & Terra'
s6.shapes[4].text_frame.paragraphs[2].text = 'Topografia, sondagem e concretagem da base inicial.'

s6.shapes[6].text_frame.paragraphs[0].text = '🏗️'
s6.shapes[6].text_frame.paragraphs[1].text = 'Estrutura & Paredes'
s6.shapes[6].text_frame.paragraphs[2].text = 'Alvenaria armada, lajes pré-moldadas e vigamento.'

s6.shapes[8].text_frame.paragraphs[0].text = '⚡'
s6.shapes[8].text_frame.paragraphs[1].text = 'Redes & Conexões'
s6.shapes[8].text_frame.paragraphs[2].text = 'Tubulação hidráulica, elétrica trifásica e automação.'

s6.shapes[10].text_frame.paragraphs[0].text = '🎨'
s6.shapes[10].text_frame.paragraphs[1].text = 'Acabamento & Chaves'
s6.shapes[10].text_frame.paragraphs[2].text = 'Pintura externa, marcenaria planejada e habite-se.'

s6.shapes[12].text_frame.paragraphs[0].text = '✨ Uma analogia perfeita: cada entrega concluída é um tijolo sólido para o crescimento da MedHit!'

# SLIDE 7: Vistas de Trabalho & Flexibilidade
s7 = prs.slides[6]
set_para(s7.shapes[0].text_frame.paragraphs[0], 'VISUALIZAÇÃO ADAPTÁVEL', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s7.shapes[1].text_frame.paragraphs[0], 'Quadro ou Tabela? Trabalhe do seu jeito', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

left_defs_s7 = [
    ('📊 Quadro Kanban Visual', 15, True, (0x02, 0x84, 0xC7), 10),
    ('Ideal para alinhamentos de equipe e fluxo ágil:', 13, True, (0x1E, 0x29, 0x3B), 6),
    ('• Arraste fluido de cartões entre colunas.', 12, False, (0x64, 0x74, 0x8B), 4),
    ('• Badges de prioridade com cores vivas e legíveis.', 12, False, (0x64, 0x74, 0x8B), 4),
    ('• Avatares dos responsáveis em destaque no card.', 12, False, (0x64, 0x74, 0x8B), 4),
    ('• Progresso visual do checklist direto no cartão.', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s7.shapes[4].text_frame, left_defs_s7)

right_defs_s7 = [
    ('📑 Tabela Interativa (Monday Style)', 15, True, (0x10, 0xB9, 0x81), 10),
    ('Perfeita para visão densa, filtros e alta produtividade:', 13, True, (0x1E, 0x29, 0x3B), 6),
    ('• Edição inline imediata de títulos e responsáveis.', 12, False, (0x64, 0x74, 0x8B), 4),
    ('• Seletor de status com 1 clique nas badges coloridas.', 12, False, (0x64, 0x74, 0x8B), 4),
    ('• Ordenação por data limite e prioridade de entrega.', 12, False, (0x64, 0x74, 0x8B), 4),
    ('• Sem poluição visual: apenas o que você precisa.', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s7.shapes[6].text_frame, right_defs_s7)

# SLIDE 8: Central de Ajuda & Autonomia
s8 = prs.slides[7]
set_para(s8.shapes[0].text_frame.paragraphs[0], 'CENTRAL DE AJUDA & SUPORTE', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s8.shapes[1].text_frame.paragraphs[0], 'Documentação embutida para ninguém ter dúvidas', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

s8.shapes[4].text_frame.paragraphs[0].text = 'O Medhit WorkTrack possui uma Central de Ajuda interativa no menu lateral e tooltips explicativos em todos os botões e recursos da interface.'
s8.shapes[4].text_frame.paragraphs[1].text = '💡 Nunca usou o sistema? Em 2 minutos de leitura você domina todos os fluxos de trabalho!'

s8.shapes[6].text_frame.paragraphs[0].text = '❓'
s8.shapes[6].text_frame.paragraphs[1].text = 'Central no Menu'
s8.shapes[6].text_frame.paragraphs[2].text = 'Basta clicar em "Ajuda" na sidebar para abrir o guia passo a passo completo.'

s8.shapes[8].text_frame.paragraphs[0].text = '💬'
s8.shapes[8].text_frame.paragraphs[1].text = 'Tooltips Contextuais'
s8.shapes[8].text_frame.paragraphs[2].text = 'Passe o mouse sobre qualquer ícone ou botão para entender sua ação.'

s8.shapes[10].text_frame.paragraphs[0].text = '🚀'
s8.shapes[10].text_frame.paragraphs[1].text = 'Zero Burocracia'
s8.shapes[10].text_frame.paragraphs[2].text = 'Nomes claros, sem termos técnicos difíceis ou menus desnecessários.'

# SLIDE 9: Resumo & Encerramento
s9 = prs.slides[8]
set_para(s9.shapes[0].text_frame.paragraphs[0], 'RESUMO & PRÓXIMOS PASSOS', 12, bold=True, color_rgb=(0x64, 0x74, 0x8B))
set_para(s9.shapes[1].text_frame.paragraphs[0], 'As Regras de Ouro do Medhit WorkTrack', 24, bold=True, color_rgb=(0x0F, 0x24, 0x40))

left_defs_s9 = [
    ('⭐ As 3 Regras de Ouro da Nossa Rotina:', 16, True, (0x0F, 0x24, 0x40), 12),
    ('1. Surgiu uma demanda? Registre no WorkTrack.', 13, True, (0x02, 0x84, 0xC7), 2),
    ('   Nada de tarefas perdidas em conversas soltas ou notas isoladas.', 12, False, (0x64, 0x74, 0x8B), 8),
    ('2. Começou a fazer? Mude o status para Em Andamento.', 13, True, (0x02, 0x84, 0xC7), 2),
    ('   Todo o time saberá exatamente quem está cuidando da entrega.', 12, False, (0x64, 0x74, 0x8B), 8),
    ('3. Entregou? Conclua e celebre o avanço da obra!', 13, True, (0x02, 0x84, 0xC7), 2),
    ('   Mantenha o painel limpo e a esteira da MedHit rodando com máxima eficiência.', 12, False, (0x64, 0x74, 0x8B), 0),
]
clear_and_set_paragraphs(s9.shapes[4].text_frame, left_defs_s9)

s9.shapes[7].text_frame.paragraphs[0].text = 'Dúvidas ou Perguntas?'
s9.shapes[7].text_frame.paragraphs[1].text = 'Espaço aberto para a equipe!\nVamos juntos construir o melhor resultado na MedHit.'

output_path = r'C:\Users\Lucca\Downloads\Apresentacao_Medhit_WorkTrack.pptx'
prs.save(output_path)
print(f'=== APRESENTAÇÃO SALVA COM SUCESSO EM: {output_path} ===')
