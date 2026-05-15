// seed.js — carrega projetos reais da AG no primeiro acesso
// Roda ANTES de app.js; só injeta se não houver projetos cadastrados

(function () {
  if (JSON.parse(localStorage.getItem('agh_projects') || '[]').length > 0) return;

  const now = new Date().toISOString();

  // ── PROJETOS ─────────────────────────────────────────────────
  const projects = [
    {
      id: 'pulsar-rh',
      name: 'PULSAR-RH',
      description: 'SaaS de People Analytics — eNPS, NR-1, KPIs de RH com IA. Em produção em pulsar-rh.agconsultorialtda.com.',
      status: 'ativo',
      color: '#7C3AED',
      createdAt: now,
    },
    {
      id: 'cliente-varejo',
      name: 'Cliente Varejo',
      description: 'Integração API ERP-externo→Supabase→Lovable. Diagnóstico: quota diária esgotando a cada 14h. Aguarda credenciais do cliente.',
      status: 'ativo',
      color: '#EF4444',
      createdAt: now,
    },
    {
      id: 'cliente-oficina',
      name: 'CLIENTE OFICINA',
      description: 'BI de vendas para rede de 6 lojas. Sync Firebird→Supabase a cada 5min + full-year 00:00. Em produção no servidor Windows do cliente.',
      status: 'ativo',
      color: '#F59E0B',
      createdAt: now,
    },
    {
      id: 'meet-hub',
      name: 'Meet Hub',
      description: 'Gravação e transcrição automática de reuniões Google Meet. Deploy DigitalOcean (46.101.174.29). Teste e2e funcional.',
      status: 'ativo',
      color: '#06B6D4',
      createdAt: now,
    },
    {
      id: 'ag-converge',
      name: 'AG Converge',
      description: 'Plataforma própria de eventos AG. RH em Xeque concluído (14/05). Próximo passo: migrar leads do localStorage para Supabase.',
      status: 'ativo',
      color: '#10B981',
      createdAt: now,
    },
    {
      id: 'cafe-com-ag',
      name: 'Café com AG',
      description: 'Calendário editorial do programa semanal de YouTube. Bloqueado: aguardando configuração do Client ID Google OAuth.',
      status: 'pausado',
      color: '#EC4899',
      createdAt: now,
    },
    {
      id: 'ag-hub',
      name: 'AG Hub',
      description: 'Este sistema de gestão pessoal. Em produção no Vercel. Evoluções contínuas com Claude.',
      status: 'ativo',
      color: '#A78BFA',
      createdAt: now,
    },
    {
      id: 'ifpb',
      name: 'IFPB — Estudos',
      description: 'Exercícios e anotações do curso de programação no IFPB. Projeto pessoal, sem pressão de entrega.',
      status: 'ativo',
      color: '#6B7280',
      createdAt: now,
    },
  ];

  // ── TAREFAS ───────────────────────────────────────────────────
  const tasks = [
    // PULSAR-RH
    { id: 't-p1', title: 'Rodar as 5 migrations da sprint1-security no SQL Editor do Supabase', status: 'todo', priority: 'high', projectId: 'pulsar-rh', due: '2026-05-17', notes: 'Ordem: audit_log → ai_usage_log → action_comments → client_branding → agent_conversations → client_alerts. Executar no projeto REDACTED.', createdAt: now },
    { id: 't-p2', title: 'Deploy das 4 Edge Functions (claude-proxy, verify-turnstile, check-alerts, send-welcome-email)', status: 'todo', priority: 'high', projectId: 'pulsar-rh', due: '2026-05-18', notes: 'supabase functions deploy <nome>. Secrets necessários: ANTHROPIC_API_KEY, TURNSTILE_SECRET_KEY, RESEND_API_KEY, RESEND_FROM.', createdAt: now },
    { id: 't-p3', title: 'Merge branch feat/sprint1-security → main e redeploy Vercel', status: 'todo', priority: 'high', projectId: 'pulsar-rh', due: '2026-05-19', notes: 'Só após migrations rodarem. Vercel faz deploy automático no push.', createdAt: now },
    { id: 't-p4', title: 'Configurar TURNSTILE_SITE_KEY no config.js (ou deixar vazio para dev)', status: 'todo', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: 'Vazio = captcha desativado. Preencher para produção real.', createdAt: now },
    { id: 't-p5', title: 'Criar primeiro cliente real (não demo Cliente Demo)', status: 'todo', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: 'Usar painel admin. Magic link precisa funcionar para email do cliente.', createdAt: now },

    // CLIENTE VAREJO
    { id: 't-l1', title: 'Reunião cliente 15/05 14:30 — coletar credenciais ERP-externo + acesso repo Lovable', status: 'doing', priority: 'high', projectId: 'cliente-varejo', due: '2026-05-15', notes: 'Pedir: API Key ERP-externo, login painel (ver plano contratado), repo Lovable. Confirmar: travamento em horário fixo ou aleatório?', createdAt: now },
    { id: 't-l2', title: 'Fase 1 — Diagnóstico: mapear integração atual e confirmar causa-raiz (quota esgotada)', status: 'todo', priority: 'high', projectId: 'cliente-varejo', due: '2026-05-20', notes: 'Causa confirmada: plano Estratégia = 350 req/dia. Sync atual a cada 5min consume 288 req → esgota em 14h. Novo: 10min = 144 req base + overhead seguro.', createdAt: now },
    { id: 't-l3', title: 'Fase 2 — Implementar novo sync incremental (10min, 300 req/dia budget)', status: 'todo', priority: 'high', projectId: 'cliente-varejo', due: '2026-05-28', notes: 'Endpoint: POST /v1/listar-atendimentos. Idempotência por ID no Supabase. Check /v1/saldo-token antes de cada ciclo. Full-sync 7 dias às 00:00.', createdAt: now },
    { id: 't-l4', title: 'Entregar pacote de atualização para servidor do cliente', status: 'todo', priority: 'medium', projectId: 'cliente-varejo', due: '2026-05-30', notes: 'Semelhante ao fluxo CLIENTE OFICINA: cópia manual dos arquivos para servidor Windows do cliente.', createdAt: now },

    // CLIENTE OFICINA
    { id: 't-b1', title: 'Preencher store_locations (cidade-base das 6 lojas) no Supabase', status: 'todo', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'Lojas: matriz, soledade, pocinhos, esperanca, queimadas, guarabira. Sem isso, painel mostra alerta store_default_unset.', createdAt: now },
    { id: 't-b2', title: 'Rotacionar SUPABASE_SERVICE_ROLE_KEY (higiene de segurança)', status: 'todo', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'Chave apareceu em chat antigo. Gerar nova em Supabase → Settings → API, atualizar no servidor Windows.', createdAt: now },
    { id: 't-b3', title: 'Definir política de retenção sale_items — 180 dias (LGPD §8)', status: 'todo', priority: 'low', projectId: 'cliente-oficina', due: null, notes: 'Decisão de Ricaliff. Criar job de limpeza ou particionamento no Supabase.', createdAt: now },

    // MEET HUB
    { id: 't-m1', title: 'Integrar Gemini real na transcrição (remover mock de testes)', status: 'todo', priority: 'medium', projectId: 'meet-hub', due: null, notes: 'Mock está em queue.ts com flag isTest. Ativar Gemini 1.5 Flash real para produção. Checar créditos API.', createdAt: now },
    { id: 't-m2', title: 'Definir roadmap de próximas features (busca em transcrições, gestão de time)', status: 'todo', priority: 'low', projectId: 'meet-hub', due: null, notes: 'Produto funcional. Próxima sessão: levantar o que faria mais sentido para o uso real da AG.', createdAt: now },

    // AG CONVERGE
    { id: 't-a1', title: 'Exportar leads do RH em Xeque (node extrair-leads.js)', status: 'todo', priority: 'high', projectId: 'ag-converge', due: '2026-05-16', notes: 'Evento foi 14/05. Rodar: node extrair-leads.js leads-rh-em-xeque.json → gera xlsx. Dados em localStorage ag_leads_rh-em-xeque.', createdAt: now },
    { id: 't-a2', title: 'Migrar leads de localStorage → Supabase (AG Converge backend)', status: 'todo', priority: 'medium', projectId: 'ag-converge', due: null, notes: 'localStorage não persiste entre dispositivos. Integrar Supabase para centralizar todos os leads de todos os eventos.', createdAt: now },
    { id: 't-a3', title: 'Planejar próximo evento AG Converge', status: 'todo', priority: 'low', projectId: 'ag-converge', due: null, notes: 'A Cúpula foi Set/2025, RH em Xeque foi Mai/2026. Qual o próximo tema?', createdAt: now },

    // CAFÉ COM AG
    { id: 't-c1', title: 'Configurar Client ID Google OAuth no Google Cloud Console', status: 'todo', priority: 'high', projectId: 'cafe-com-ag', due: null, notes: 'APIs & Services → Credentials → OAuth 2.0 Client ID (Web). Adicionar URL de hospedagem como Authorized JavaScript origin. Substituir placeholder no arquivo HTML.', createdAt: now },
    { id: 't-c2', title: 'Definir hospedagem (GitHub Pages ou Vercel) e subir o arquivo', status: 'todo', priority: 'medium', projectId: 'cafe-com-ag', due: null, notes: 'Arquivo único: cafe_com_ag.html. GitHub Pages é mais simples. Precisa de URL definitiva para configurar o OAuth.', createdAt: now },

    // AG HUB
    { id: 't-h1', title: 'Conectar AG Hub ao Supabase para persistência multi-dispositivo', status: 'todo', priority: 'medium', projectId: 'ag-hub', due: null, notes: 'Hoje usa localStorage — dados somem ao limpar o browser. Migrar para Supabase para ter acesso de qualquer dispositivo.', createdAt: now },

    // IFPB
    { id: 't-i1', title: 'Rodar pnpm install no projeto ifpb', status: 'todo', priority: 'low', projectId: 'ifpb', due: null, notes: 'cd ~/projetos/ifpb && pnpm install', createdAt: now },
    { id: 't-i2', title: 'Estruturar primeiros exercícios por disciplina', status: 'todo', priority: 'low', projectId: 'ifpb', due: null, notes: 'Pasta: src/exercicios/. Sem pressão, projeto pessoal.', createdAt: now },
  ];

  // ── EVENTOS ───────────────────────────────────────────────────
  const events = [
    { id: 'ev-1', title: 'Reunião — Cliente Varejo (credenciais + diagnóstico)', date: '2026-05-15', time: '14:30', type: 'reuniao', duration: '60', notes: 'Pedir: API Key ERP-externo, plano contratado, acesso repo Lovable, padrão do travamento.', createdAt: now },
    { id: 'ev-2', title: 'Deadline: Exportar leads RH em Xeque', date: '2026-05-16', time: null, type: 'prazo', duration: null, notes: 'node extrair-leads.js leads-rh-em-xeque.json', createdAt: now },
    { id: 'ev-3', title: 'Deadline: Migrations PULSAR-RH sprint1-security', date: '2026-05-17', time: null, type: 'prazo', duration: null, notes: '5 migrations no SQL Editor do Supabase (REDACTED).', createdAt: now },
    { id: 'ev-4', title: 'Deadline: Edge Functions PULSAR-RH', date: '2026-05-18', time: null, type: 'prazo', duration: null, notes: 'Deploy: claude-proxy, verify-turnstile, check-alerts, send-welcome-email.', createdAt: now },
    { id: 'ev-5', title: 'Merge PULSAR-RH sprint1-security → main', date: '2026-05-19', time: null, type: 'prazo', duration: null, notes: 'Após migrations + edge functions confirmados.', createdAt: now },
    { id: 'ev-6', title: 'Deadline: Fase 1 Cliente Varejo (diagnóstico)', date: '2026-05-20', time: null, type: 'prazo', duration: null, notes: '2-3 dias úteis após reunião. Entregar relatório de diagnóstico.', createdAt: now },
    { id: 'ev-7', title: 'Deadline: Fase 2 Cliente Varejo (desenvolvimento)', date: '2026-05-28', time: null, type: 'prazo', duration: null, notes: '5-12 dias úteis. Novo sync incremental 10min funcionando.', createdAt: now },
  ];

  localStorage.setItem('agh_projects', JSON.stringify(projects));
  localStorage.setItem('agh_tasks',    JSON.stringify(tasks));
  localStorage.setItem('agh_events',   JSON.stringify(events));

  console.log('[AG Hub] Projetos reais carregados:', projects.length, 'projetos,', tasks.length, 'tarefas,', events.length, 'eventos.');
})();
