import urllib.request
import json

url = 'https://ermybehjnkxwaijzcpfp.supabase.co/rest/v1/medtask_tasks'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybXliZWhqbmt4d2FpanpjcGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzk1NDcsImV4cCI6MjEwMzYxNTU0N30.T6r6YzDF041qYFmgxBW8LZO7Rr3gjZYRKrvbCgN1CSk',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybXliZWhqbmt4d2FpanpjcGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzk1NDcsImV4cCI6MjEwMzYxNTU0N30.T6r6YzDF041qYFmgxBW8LZO7Rr3gjZYRKrvbCgN1CSk',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 1. Limpa tarefas anteriores
del_req = urllib.request.Request(url + '?id=neq.placeholder', headers=headers, method='DELETE')
urllib.request.urlopen(del_req)
print('Tabela limpa no Supabase!')

# 2. Insere tarefas da CASA MEDHIT 2026
tasks = [
  {
    'id': 'task-casa-01',
    'workspace_id': 'ws-medhit-001',
    'project_id': 'proj-obras-01',
    'area_id': 'area-1',
    'title': 'Laudo de Sondagem de Solo e Topografia do Terreno',
    'description': 'Contratar empresa técnica de topografia e perfuração SPT para validação das sapatas e profundidade da fundação.',
    'task_type': 'task',
    'status_id': 'st-obra-4',
    'priority': 'high',
    'position': 1000,
    'reporter_id': 'user-1',
    'assignee_ids': ['user-1'],
    'due_date': '2026-10-25',
    'story_points': 5,
    'tags': ['Fundações & Terraplanagem', 'Engenharia'],
    'checklists': [
      {
        'id': 'chk-01',
        'taskId': 'task-casa-01',
        'title': 'Critérios de Aprovação',
        'items': [
          { 'id': 'ci-01', 'checklistId': 'chk-01', 'title': 'Levantamento planialtimétrico', 'isCompleted': True },
          { 'id': 'ci-02', 'checklistId': 'chk-01', 'title': '3 furos de sondagem SPT', 'isCompleted': True },
          { 'id': 'ci-03', 'checklistId': 'chk-01', 'title': 'ART recolhida pelo engenheiro', 'isCompleted': True }
        ]
      }
    ],
    'comments': [
      {
        'id': 'comm-01',
        'taskId': 'task-casa-01',
        'authorType': 'user',
        'authorId': 'user-1',
        'authorName': 'Lucca Guidorizzi',
        'authorAvatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca',
        'content': 'Relatório técnico aprovado com resistência de solo adequada para fundação rasa.',
        'createdAt': '2026-10-21T12:00:00Z'
      }
    ]
  },
  {
    'id': 'task-casa-02',
    'workspace_id': 'ws-medhit-001',
    'project_id': 'proj-obras-01',
    'area_id': 'area-1',
    'title': 'Concretagem de Vigas Baldrame e Laje do Pavimento Térreo',
    'description': 'Aplicação do concreto usinado FCK 30 com aditivo impermeabilizante e cura úmida por 7 dias.',
    'task_type': 'task',
    'status_id': 'st-obra-4',
    'priority': 'urgent',
    'position': 2000,
    'reporter_id': 'user-1',
    'assignee_ids': ['user-2'],
    'due_date': '2026-10-28',
    'story_points': 8,
    'tags': ['Fundações & Terraplanagem', 'Estrutural'],
    'checklists': [
      {
        'id': 'chk-02',
        'taskId': 'task-casa-02',
        'title': 'Conferências de Qualidade',
        'items': [
          { 'id': 'ci-21', 'checklistId': 'chk-02', 'title': 'Montagem da armadura de aço', 'isCompleted': True },
          { 'id': 'ci-22', 'checklistId': 'chk-02', 'title': 'Passagem prévia de tubulação de esgoto', 'isCompleted': True },
          { 'id': 'ci-23', 'checklistId': 'chk-02', 'title': 'Slump test do concreto usinado', 'isCompleted': True }
        ]
      }
    ],
    'comments': []
  },
  {
    'id': 'task-casa-03',
    'workspace_id': 'ws-medhit-001',
    'project_id': 'proj-obras-01',
    'area_id': 'area-1',
    'title': 'Levantamento de Alvenaria e Vigamento Superior',
    'description': 'Assentamento de blocos cerâmicos estruturais nos ambientes do 1º andar, salas e recepção.',
    'task_type': 'task',
    'status_id': 'st-obra-2',
    'priority': 'high',
    'position': 3000,
    'reporter_id': 'user-1',
    'assignee_ids': ['user-1', 'user-2'],
    'due_date': '2026-11-05',
    'story_points': 13,
    'tags': ['Alvenaria & Estrutural'],
    'checklists': [
      {
        'id': 'chk-03',
        'taskId': 'task-casa-03',
        'title': 'Etapas de Execução',
        'items': [
          { 'id': 'ci-31', 'checklistId': 'chk-03', 'title': 'Marcação da 1ª fiada e esquadro', 'isCompleted': True },
          { 'id': 'ci-32', 'checklistId': 'chk-03', 'title': 'Colocação de vergas e contravergas', 'isCompleted': True },
          { 'id': 'ci-33', 'checklistId': 'chk-03', 'title': 'Concretagem dos pilares de amarração', 'isCompleted': False }
        ]
      }
    ],
    'comments': [
      {
        'id': 'comm-02',
        'taskId': 'task-casa-03',
        'authorType': 'user',
        'authorId': 'user-2',
        'authorName': 'Thiago Ghiraldini',
        'authorAvatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thiago',
        'content': 'Primeiro andar 70% erguido. Previsão de finalizar as colunas até quinta-feira.',
        'createdAt': '2026-10-21T13:00:00Z'
      }
    ]
  },
  {
    'id': 'task-casa-04',
    'workspace_id': 'ws-medhit-001',
    'project_id': 'proj-obras-01',
    'area_id': 'area-1',
    'title': 'Instalação da Estrutura Metálica do Telhado e Calhas',
    'description': 'Fixação das tesouras metálicas galvanizadas e calhas embutidas com queda para cisterna.',
    'task_type': 'task',
    'status_id': 'st-obra-3',
    'priority': 'medium',
    'position': 4000,
    'reporter_id': 'user-2',
    'assignee_ids': ['user-2'],
    'due_date': '2026-11-10',
    'story_points': 5,
    'tags': ['Alvenaria & Estrutural'],
    'checklists': [
      {
        'id': 'chk-04',
        'taskId': 'task-casa-04',
        'title': 'Inspeção',
        'items': [
          { 'id': 'ci-41', 'checklistId': 'chk-04', 'title': 'Fixação dos chumbadores', 'isCompleted': True },
          { 'id': 'ci-42', 'checklistId': 'chk-04', 'title': 'Teste de escoamento de água na calha', 'isCompleted': False }
        ]
      }
    ],
    'comments': []
  },
  {
    'id': 'task-casa-05',
    'workspace_id': 'ws-medhit-001',
    'project_id': 'proj-obras-01',
    'area_id': 'area-1',
    'title': 'Passagem da Prumada Hidráulica e Barrilete da Caixa Reservatório',
    'description': 'Tubulação de água fria e quente (PPR) para banheiros, copa e consultórios da casa.',
    'task_type': 'task',
    'status_id': 'st-obra-1',
    'priority': 'medium',
    'position': 5000,
    'reporter_id': 'user-1',
    'assignee_ids': ['user-1'],
    'due_date': '2026-11-15',
    'story_points': 5,
    'tags': ['Instalações Elétricas & Hidráulicas'],
    'checklists': [
      {
        'id': 'chk-05',
        'taskId': 'task-casa-05',
        'title': 'Checklist Hidráulico',
        'items': [
          { 'id': 'ci-51', 'checklistId': 'chk-05', 'title': 'Teste de estanqueidade e pressão 24h', 'isCompleted': False },
          { 'id': 'ci-52', 'checklistId': 'chk-05', 'title': 'Registros de gaveta e pressão identificados', 'isCompleted': False }
        ]
      }
    ],
    'comments': []
  },
  {
    'id': 'task-casa-06',
    'workspace_id': 'ws-medhit-001',
    'project_id': 'proj-obras-01',
    'area_id': 'area-1',
    'title': 'Revestimento Cerâmico, Porcelanato e Bancadas em Granito',
    'description': 'Assentamento do piso porcelanato acetinado 90x90cm nas áreas comuns e nichos de banheiros.',
    'task_type': 'task',
    'status_id': 'st-obra-1',
    'priority': 'low',
    'position': 6000,
    'reporter_id': 'user-1',
    'assignee_ids': ['user-2'],
    'due_date': '2026-11-20',
    'story_points': 8,
    'tags': ['Acabamentos & Decoração'],
    'checklists': [],
    'comments': []
  },
  {
    'id': 'task-casa-07',
    'workspace_id': 'ws-medhit-001',
    'project_id': 'proj-obras-01',
    'area_id': 'area-1',
    'title': 'Vistoria Final dos Bombeiros e Emissão do Habite-se Municipal',
    'description': 'Aprovação final com laudo de iluminação de emergência, extintores e certidão da prefeitura.',
    'task_type': 'task',
    'status_id': 'st-obra-1',
    'priority': 'urgent',
    'position': 7000,
    'reporter_id': 'user-1',
    'assignee_ids': ['user-1', 'user-2'],
    'due_date': '2026-11-30',
    'story_points': 3,
    'tags': ['Vistoria & Habite-se'],
    'checklists': [
      {
        'id': 'chk-07',
        'taskId': 'task-casa-07',
        'title': 'Documentação Obrigatória',
        'items': [
          { 'id': 'ci-71', 'checklistId': 'chk-07', 'title': 'AVCB dos Bombeiros', 'isCompleted': False },
          { 'id': 'ci-72', 'checklistId': 'chk-07', 'title': 'CND do INSS da construção', 'isCompleted': False },
          { 'id': 'ci-73', 'checklistId': 'chk-07', 'title': 'Protocolo do Habite-se na prefeitura', 'isCompleted': False }
        ]
      }
    ],
    'comments': []
  }
]

req = urllib.request.Request(url, headers=headers, data=json.dumps(tasks).encode('utf-8'))
resp = urllib.request.urlopen(req)
print('Supabase insert result:', resp.status)
print('CASA MEDHIT 2026 tasks inseridas com sucesso!')
