// seed.js v3 — projetos reais AG com histórico completo (done + todo)
// Forçado toda vez que a versão muda

(function () {
  if (localStorage.getItem('agh_seed_v') === '5') return;

  const now = new Date().toISOString();

  // ── PROJETOS ─────────────────────────────────────────────────
  const projects = [
    { id: 'pulsar-rh',      name: 'PULSAR-RH',         description: 'SaaS de People Analytics — eNPS, NR-1, KPIs de RH com IA. Em produção em pulsar-rh.agconsultorialtda.com.', status: 'ativo',    color: '#7048E8', githubUrl: 'https://github.com/AndreyRicaliff/PULSAR-RH',            isPrivate: false, createdAt: now },
    { id: 'cliente-varejo',name: 'Cliente Varejo',    description: 'Integração API ERP-externo→Supabase→Lovable. Diagnóstico: quota diária (350 req) esgota em 14h. Aguarda credenciais.', status: 'ativo',    color: '#FF5C5C', githubUrl: null,                                                      isPrivate: false, createdAt: now },
    { id: 'cliente-oficina',  name: 'CLIENTE OFICINA',      description: 'BI de vendas para rede de 6 lojas. Sync Firebird→Supabase 5min + full-year 00:00. Em produção no Windows do cliente.', status: 'ativo',    color: '#FFBC7D', githubUrl: 'https://github.com/AndreyRicaliff/cliente-oficina-backend', isPrivate: true,  createdAt: now },
    { id: 'meet-hub',       name: 'Meet Hub',            description: 'Gravação e transcrição automática de reuniões Google Meet. Deploy DigitalOcean. Teste e2e funcional.', status: 'ativo',    color: '#06B6D4', githubUrl: null,                                                      isPrivate: false, createdAt: now },
    { id: 'ag-converge',    name: 'AG Converge',         description: 'Plataforma própria de eventos AG. RH em Xeque concluído (14/05). Próximo: migrar leads para Supabase.', status: 'ativo',    color: '#08C16A', githubUrl: 'https://github.com/AndreyRicaliff/ag-converge',           isPrivate: false, createdAt: now },
    { id: 'cafe-com-ag',    name: 'Café com AG',         description: 'Calendário editorial do programa semanal de YouTube. Bloqueado: Client ID Google OAuth não configurado.', status: 'pausado',   color: '#EC4899', githubUrl: 'https://github.com/AndreyRicaliff/cafe-com-ag',           isPrivate: false, createdAt: now },
    { id: 'ag-hub',         name: 'AG Hub',              description: 'Este sistema de gestão pessoal. Deploy Vercel + GitHub. Evolução contínua.', status: 'ativo',    color: '#9B6EFF', githubUrl: 'https://github.com/AndreyRicaliff/ag-hub',                isPrivate: false, createdAt: now },
    { id: 'ifpb',           name: 'IFPB — Estudos',      description: 'Exercícios e anotações do curso de programação no IFPB. Projeto pessoal, sem pressão.', status: 'ativo',    color: '#7A9BC4', githubUrl: null,                                                      isPrivate: false, createdAt: now },
  ];

  // ── TAREFAS ───────────────────────────────────────────────────
  const tasks = [

    // ═══════════════════════════════════════════════
    // PULSAR-RH
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'p-d01', title: 'Core SaaS — dashboard, KPIs, pesquisas, formulário colaborador', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Base do sistema entregue. Login 3 perfis (admin/cliente/colaborador), Chart.js, Supabase Auth.', createdAt: now },
    { id: 'p-d02', title: 'Deploy em produção (pulsar-rh.agconsultorialtda.com)', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Vercel + domínio custom. Deploy automático via git push main.', createdAt: now },
    { id: 'p-d03', title: 'Schema SQL completo + RLS por perfil', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'supabase-schema.sql com 9 tabelas, policies RLS admin/cliente/anon.', createdAt: now },
    { id: 'p-d04', title: 'Cliente demo Cliente Demo com seed completo', status: 'done', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: '32 colaboradores, 5 setores, 6 pesquisas, 140 respostas, 642 answers, 6 meses KPIs, 10 riscos NR-1, 8 planos ação, 3 AI summaries.', createdAt: now },
    { id: 'p-d05', title: 'Sprint 1 — segurança: audit_log + claude-proxy + JWT admin + Turnstile', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Branch feat/sprint1-security. Aguardando migrations e merge.', createdAt: now },
    { id: 'p-d06', title: 'Sprint 2 — valor cliente: comentar planos + 3 charts + PDF + filtro global + alertas email', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Branch feat/sprint1-security. Aguardando merge.', createdAt: now },
    { id: 'p-d07', title: 'Sprint 3 — respondente: branding por cliente + a11y WCAG + i18n PT/EN/ES + tipo matriz', status: 'done', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: 'Branch feat/sprint1-security. Aguardando merge.', createdAt: now },
    { id: 'p-d08', title: 'Fix: memory leak realtime listeners (setupRealtimeListeners)', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Commit 5c2d352. cleanupRealtimeListeners() adicionado. Zero memory growth.', createdAt: now },
    { id: 'p-d09', title: 'Fix: XSS em renderResults (títulos sem escapeHtml)', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Commit 5c2d352. Títulos e nomes envolvidos em escapeHtml().', createdAt: now },
    { id: 'p-d10', title: 'Fix: eval disfarçado new Function() → handlers object', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Commit 5c2d352. Vetor RCE potencial eliminado.', createdAt: now },
    { id: 'p-d11', title: 'Fix: performance O(n²) → O(n) em renderResults (Map index)', status: 'done', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: 'Commit 9304c13. ~100x mais rápido em datasets grandes.', createdAt: now },
    { id: 'p-d12', title: 'Fix: sync Supabase-first + realtime publication + RLS case-insensitive', status: 'done', priority: 'high', projectId: 'pulsar-rh', due: null, notes: 'Commit e9949eb. persistAndCache/removeAndCache. Tabelas na publication supabase_realtime.', createdAt: now },
    { id: 'p-d13', title: 'Melhoria: ARIA labels + validação email/CNPJ + disabled state async', status: 'done', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: 'Commit 9304c13. Acessibilidade e UX melhorados.', createdAt: now },
    { id: 'p-d14', title: 'Perguntas padrão editáveis no modal de survey', status: 'done', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: 'Commit 3b38447. Último commit em main.', createdAt: now },

    // 📋 PENDENTES
    { id: 'p-t01', title: 'Rodar as 6 migrations sprint1-security no SQL Editor do Supabase', status: 'todo', priority: 'high', projectId: 'pulsar-rh', due: '2026-05-17', notes: 'Projeto: REDACTED. Ordem: audit_log → ai_usage_log → action_comments → client_branding → agent_conversations → client_alerts.', createdAt: now },
    { id: 'p-t02', title: 'Deploy das 4 Edge Functions com seus secrets', status: 'todo', priority: 'high', projectId: 'pulsar-rh', due: '2026-05-18', notes: 'supabase functions deploy <nome>. Secrets: ANTHROPIC_API_KEY, TURNSTILE_SECRET_KEY, RESEND_API_KEY, RESEND_FROM.', createdAt: now },
    { id: 'p-t03', title: 'Merge feat/sprint1-security → main e redeploy', status: 'todo', priority: 'high', projectId: 'pulsar-rh', due: '2026-05-19', notes: 'Só após migrations + edge functions confirmados. Vercel faz deploy automático.', createdAt: now },
    { id: 'p-t04', title: 'Criar primeiro cliente real (não demo)', status: 'todo', priority: 'medium', projectId: 'pulsar-rh', due: null, notes: 'Usar painel admin após merge. Magic link precisa funcionar para email do cliente.', createdAt: now },
    { id: 'p-t05', title: 'Adicionar índices Supabase: survey_id, client_id, dimension', status: 'todo', priority: 'low', projectId: 'pulsar-rh', due: null, notes: 'Server-side filtering e lazy-load em resultados com muitas respostas.', createdAt: now },

    // ═══════════════════════════════════════════════
    // CLIENTE VAREJO
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'l-d01', title: 'Diagnóstico causa-raiz: quota diária API ERP-externo esgotando em 14h', status: 'done', priority: 'high', projectId: 'cliente-varejo', due: null, notes: 'Plano Estratégia = 350 req/dia. Sync 5min = 288 req → esgota às 14h → trava até meia-noite. Não é bug de código.', createdAt: now },
    { id: 'l-d02', title: 'Arquitetura da solução planejada (sync 10min, 300 req/dia budget)', status: 'done', priority: 'medium', projectId: 'cliente-varejo', due: null, notes: 'POST /v1/listar-atendimentos + overlap 10min + check saldo antes + full-sync 7d às 00:00.', createdAt: now },

    // 📋 PENDENTES
    { id: 'l-t01', title: 'Reunião 15/05 14:30 — credenciais ERP-externo + acesso repo Lovable', status: 'doing', priority: 'high', projectId: 'cliente-varejo', due: '2026-05-15', notes: 'Pedir: API Key, login painel (confirmar plano), repo Lovable. Confirmar padrão do travamento (horário fixo?).', createdAt: now },
    { id: 'l-t02', title: 'Fase 1 — Entregar relatório de diagnóstico ao cliente', status: 'todo', priority: 'high', projectId: 'cliente-varejo', due: '2026-05-20', notes: '2-3 dias úteis. Documentar causa-raiz e proposta de solução.', createdAt: now },
    { id: 'l-t03', title: 'Fase 2 — Implementar novo sync incremental (10min)', status: 'todo', priority: 'high', projectId: 'cliente-varejo', due: '2026-05-28', notes: 'Idempotência por ID no Supabase. Semelhante ao padrão CLIENTE OFICINA.', createdAt: now },
    { id: 'l-t04', title: 'Entregar pacote para servidor Windows do cliente', status: 'todo', priority: 'medium', projectId: 'cliente-varejo', due: '2026-05-30', notes: 'Cópia manual dos arquivos (sem git no servidor). Testar scheduler Windows.', createdAt: now },

    // ═══════════════════════════════════════════════
    // CLIENTE OFICINA
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'b-d01', title: 'Sync incremental 5min em produção (Oficina-Sync5Min)', status: 'done', priority: 'high', projectId: 'cliente-oficina', due: null, notes: 'Janela 2 dias. Média 10-30s por execução. Task Scheduler Windows perpétuo.', createdAt: now },
    { id: 'b-d02', title: 'Full-year diário às 00:00 em produção (Oficina-SyncAnual)', status: 'done', priority: 'high', projectId: 'cliente-oficina', due: null, notes: 'Particionado mês a mês. ~6-10min com retry. Lockfile anti-colisão.', createdAt: now },
    { id: 'b-d03', title: 'Pipeline item-a-item: sale_items + return_items com custo real', status: 'done', priority: 'high', projectId: 'cliente-oficina', due: null, notes: 'COALESCE(PRECO_CUSTO_REAL, PRECO_CUSTO). margin_value = revenue - returns_value - (cost - returned_cost).', createdAt: now },
    { id: 'b-d04', title: 'Retry+backoff 3x [5s, 15s, 30s] + lockfile anti-colisão', status: 'done', priority: 'high', projectId: 'cliente-oficina', due: null, notes: 'Lock órfão auto-limpo após 30min. MultipleInstances=IgnoreNew no scheduler.', createdAt: now },
    { id: 'b-d05', title: '9 tabelas Supabase em produção (agregadas + granulares)', status: 'done', priority: 'high', projectId: 'cliente-oficina', due: null, notes: 'dashboard_summary, sales_by_store, sales_by_day, vendor_performance, vendor_sales_by_day, sales_by_city, sales_detail, sale_items, return_items.', createdAt: now },
    { id: 'b-d06', title: 'Diagnóstico das 6 bases Firebird (FB 4.0, sem corrupção)', status: 'done', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'Matriz 2.13GB + 5 filiais (475–645MB cada).', createdAt: now },
    { id: 'b-d07', title: 'Semântica de revenue padronizada (Opção A) + breakdown de campos', status: 'done', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'revenue = LIQUIDO. gross_revenue, discount_value, bonification_value, surcharge_value, freight_value.', createdAt: now },
    { id: 'b-d08', title: 'Scripts de manutenção: setup-tasks.ps1, check-sync-health.ps1, diagnose-firebird.bat', status: 'done', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'Tooling completo para operação no servidor Windows.', createdAt: now },
    { id: 'b-d09', title: 'Fix: bug CMV bruto vs líquido no Lovable resolvido', status: 'done', priority: 'high', projectId: 'cliente-oficina', due: null, notes: 'margin_value calculado corretamente em vendor_performance. Front não recalcula.', createdAt: now },

    // 📋 PENDENTES
    { id: 'b-t01', title: 'Preencher store_locations (cidade-base das 6 lojas) no Supabase', status: 'todo', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'Resolve alerta store_default_unset no painel. Ricaliff sabe os nomes das cidades.', createdAt: now },
    { id: 'b-t02', title: 'Rotacionar SUPABASE_SERVICE_ROLE_KEY', status: 'todo', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'Gerar nova em Supabase → Settings → API. Atualizar no servidor Windows + .env.', createdAt: now },
    { id: 'b-t03', title: 'Definir retenção de sale_items — 180 dias (LGPD §8)', status: 'todo', priority: 'low', projectId: 'cliente-oficina', due: null, notes: 'Criar job de limpeza no Supabase ou pg_cron.', createdAt: now },

    // ═══════════════════════════════════════════════
    // MEET HUB
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'm-d01', title: 'Deploy DigitalOcean funcionando (46.101.174.29)', status: 'done', priority: 'high', projectId: 'meet-hub', due: null, notes: 'Stack: Node+Express+PostgreSQL+Prisma / React+TS+Tailwind / Puppeteer+Docker / Bull Redis.', createdAt: now },
    { id: 'm-d02', title: 'Teste e2e 100% funcional (POST /recordings/test/auto)', status: 'done', priority: 'high', projectId: 'meet-hub', due: null, notes: 'FFmpeg instalado na API. IDs consistentes. Mock Gemini para testes autônomos.', createdAt: now },
    { id: 'm-d03', title: 'Fix: FFmpeg instalado na API + caminhos absolutos /usr/bin/', status: 'done', priority: 'high', projectId: 'meet-hub', due: null, notes: 'Dockerfile + queue.ts atualizados. sine=f=440:d=5 para arquivo fake válido.', createdAt: now },
    { id: 'm-d04', title: 'Fix: IDs Prisma consistentes entre arquivo e DB', status: 'done', priority: 'high', projectId: 'meet-hub', due: null, notes: 'Passar id: recordingId explicitamente em prisma.recording.create(). Bug 404 resolvido.', createdAt: now },
    { id: 'm-d05', title: 'Fix: middleware TEST_USER_ID consistente no POST', status: 'done', priority: 'medium', projectId: 'meet-hub', due: null, notes: 'Não reatribuir req.userId no handler. Mantém valor do middleware.', createdAt: now },

    // 📋 PENDENTES
    { id: 'm-t01', title: 'Integrar Gemini 1.5 Flash real (remover mock de transcrição)', status: 'todo', priority: 'medium', projectId: 'meet-hub', due: null, notes: 'Flag isTest em queue.ts. Verificar créditos API antes de ativar.', createdAt: now },
    { id: 'm-t02', title: 'Definir roadmap de próximas features', status: 'todo', priority: 'low', projectId: 'meet-hub', due: null, notes: 'Candidatos: busca em transcrições, gestão de equipe, exportar ata automática.', createdAt: now },

    // ═══════════════════════════════════════════════
    // AG CONVERGE
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'a-d01', title: 'Evento A Cúpula realizado (Set/2025)', status: 'done', priority: 'high', projectId: 'ag-converge', due: null, notes: 'Reforma Tributária. Quinta na Colina, Campina Grande. Ingresso pago. Leads salvos.', createdAt: now },
    { id: 'a-d02', title: 'Evento RH em Xeque realizado (14/05/2026)', status: 'done', priority: 'high', projectId: 'ag-converge', due: null, notes: 'NR-1, escala 5×2, Apagão, Geração Z. Beneficente ACCP. Parceiros: Protagon + Pro Sangue.', createdAt: now },
    { id: 'a-d03', title: 'Sistema de inscrição 3-passos com QR code e ingresso digital', status: 'done', priority: 'high', projectId: 'ag-converge', due: null, notes: 'Dados → Doação voluntária → Ingresso RHX-XXXX com QR. window.print() para impressão.', createdAt: now },
    { id: 'a-d04', title: 'Admin panel de leads + extrator .xlsx (extrair-leads.js)', status: 'done', priority: 'high', projectId: 'ag-converge', due: null, notes: 'node extrair-leads.js leads-rh-em-xeque.json → AG-Leads-YYYY-MM-DD.xlsx.', createdAt: now },
    { id: 'a-d05', title: 'Projeto Supabase AG-Converge criado (hqcbpqkohgmlultnmbyy, sa-east-1)', status: 'done', priority: 'medium', projectId: 'ag-converge', due: null, notes: 'Pronto para integração. Credenciais salvas na memória.', createdAt: now },

    // 📋 PENDENTES
    { id: 'a-t01', title: 'Exportar leads RH em Xeque (urgente — pós evento)', status: 'todo', priority: 'high', projectId: 'ag-converge', due: '2026-05-16', notes: 'cd ~/projetos/ag-evento && node extrair-leads.js leads-rh-em-xeque.json', createdAt: now },
    { id: 'a-t02', title: 'Migrar leads localStorage → Supabase (hqcbpqkohgmlultnmbyy)', status: 'todo', priority: 'medium', projectId: 'ag-converge', due: null, notes: 'localStorage não persiste entre dispositivos. Schema: tabela leads com slug do evento.', createdAt: now },
    { id: 'a-t03', title: 'Planejar próximo evento AG Converge', status: 'todo', priority: 'low', projectId: 'ag-converge', due: null, notes: 'A Cúpula Set/2025, RH em Xeque Mai/2026. Qual o próximo tema e data?', createdAt: now },

    // ═══════════════════════════════════════════════
    // CAFÉ COM AG
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'c-d01', title: 'Sistema completo desenvolvido (HTML single-file)', status: 'done', priority: 'high', projectId: 'cafe-com-ag', due: null, notes: 'Login Google OAuth, sessão persistente, calendário editorial 20 episódios, edição inline, histórico imutável.', createdAt: now },
    { id: 'c-d02', title: 'Histórico imutável de alterações (campo a campo, quem, quando, antes/depois)', status: 'done', priority: 'medium', projectId: 'cafe-com-ag', due: null, notes: 'Aba separada, sem botão de apagar. Persistido em cag_log.', createdAt: now },

    // 📋 PENDENTES (BLOQUEADAS)
    { id: 'c-t01', title: 'Configurar Client ID Google OAuth no Google Cloud Console', status: 'todo', priority: 'high', projectId: 'cafe-com-ag', due: null, notes: 'Desbloqueador de tudo. OAuth 2.0 Client ID (Web). Adicionar URL de hospedagem como Authorized JavaScript origin.', createdAt: now },
    { id: 'c-t02', title: 'Definir hospedagem e subir o arquivo (GitHub Pages ou Vercel)', status: 'todo', priority: 'medium', projectId: 'cafe-com-ag', due: null, notes: 'Precisa de URL definitiva antes de configurar o OAuth. GitHub Pages mais simples.', createdAt: now },
    { id: 'c-t03', title: 'Testar login @agconsultorialtda.com em produção', status: 'todo', priority: 'medium', projectId: 'cafe-com-ag', due: null, notes: 'Validar que outras contas Google são bloqueadas com mensagem de erro.', createdAt: now },

    // ═══════════════════════════════════════════════
    // AG HUB
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'h-d01', title: 'App completo: Dashboard, Projetos, Tarefas, Agenda', status: 'done', priority: 'high', projectId: 'ag-hub', due: null, notes: 'Sidebar, progress rings, focus do dia, calendar. Tema AG dark/purple.', createdAt: now },
    { id: 'h-d02', title: 'Deploy Vercel + GitHub (ag-hub-tan.vercel.app)', status: 'done', priority: 'high', projectId: 'ag-hub', due: null, notes: 'Auto-deploy em cada push main. Repositório AndreyRicaliff/ag-hub público.', createdAt: now },
    { id: 'h-d03', title: 'Seed com projetos reais AG + histórico completo', status: 'done', priority: 'medium', projectId: 'ag-hub', due: null, notes: '8 projetos, 40+ tarefas (done + todo), 7 eventos reais na agenda.', createdAt: now },

    // 📋 PENDENTES
    { id: 'h-t01', title: 'Migrar localStorage → Supabase para acesso multi-dispositivo', status: 'todo', priority: 'medium', projectId: 'ag-hub', due: null, notes: 'Dados atuais somem ao limpar o browser. Supabase como backend garantiria persistência real.', createdAt: now },

    // ═══════════════════════════════════════════════
    // IFPB
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'i-d01', title: 'Scaffold TypeScript criado (ts-node, ESLint, Jest)', status: 'done', priority: 'low', projectId: 'ifpb', due: null, notes: 'git init + commit inicial em 2026-05-12.', createdAt: now },

    // 📋 PENDENTES
    { id: 'i-t01', title: 'Rodar pnpm install no projeto', status: 'todo', priority: 'low', projectId: 'ifpb', due: null, notes: 'cd ~/projetos/ifpb && pnpm install', createdAt: now },
    { id: 'i-t02', title: 'Estruturar primeiros exercícios por disciplina', status: 'todo', priority: 'low', projectId: 'ifpb', due: null, notes: 'Pasta: src/exercicios/<disciplina>/. Sem pressão — projeto pessoal.', createdAt: now },
  ];

  // ── EVENTOS ───────────────────────────────────────────────────
  const events = [
    { id: 'ev-1', title: 'Reunião — Cliente Varejo (credenciais + diagnóstico)', date: '2026-05-15', time: '14:30', type: 'reuniao', duration: '60',  notes: 'Pedir: API Key ERP-externo, plano contratado, acesso repo Lovable. Confirmar padrão de travamento.', createdAt: now },
    { id: 'ev-2', title: 'Exportar leads RH em Xeque (.xlsx)', date: '2026-05-16', time: null,    type: 'prazo',   duration: null, notes: 'cd ~/projetos/ag-evento && node extrair-leads.js leads-rh-em-xeque.json', createdAt: now },
    { id: 'ev-3', title: 'Migrations PULSAR-RH sprint1-security (6 no SQL Editor)', date: '2026-05-17', time: null,    type: 'prazo',   duration: null, notes: 'Projeto Supabase REDACTED. Ordem das migrations importa.', createdAt: now },
    { id: 'ev-4', title: 'Deploy Edge Functions PULSAR-RH (4 funções)', date: '2026-05-18', time: null,    type: 'prazo',   duration: null, notes: 'claude-proxy, verify-turnstile, check-alerts, send-welcome-email. + secrets.', createdAt: now },
    { id: 'ev-5', title: 'Merge PULSAR-RH sprint1-security → main', date: '2026-05-19', time: null,    type: 'prazo',   duration: null, notes: 'Após migrations + edge functions confirmados em produção.', createdAt: now },
    { id: 'ev-6', title: 'Entrega Fase 1 — Diagnóstico Cliente Varejo', date: '2026-05-20', time: null,    type: 'prazo',   duration: null, notes: 'Relatório de diagnóstico formal para o cliente.', createdAt: now },
    { id: 'ev-7', title: 'Entrega Fase 2 — Novo sync Cliente Varejo', date: '2026-05-28', time: null,    type: 'prazo',   duration: null, notes: 'Sync incremental 10min, 300 req/dia. Testar em produção.', createdAt: now },
  ];

  // ── SESSÕES CLAUDE (histórico real) ──────────────────────────
  const sessions = [
    { id:'s-01', title:'AG Hub criado do zero — dashboard, projetos, tarefas, agenda', projectId:'ag-hub', type:'feature', date:'2026-05-15', impact:'alto', notes:'App completo em HTML+JS puro com tema AG. LocalStorage como storage. Sidebar, rings de progresso, calendario.', createdAt: now },
    { id:'s-02', title:'AG Hub redesign — estilo personal growth app (Linear/Notion)', projectId:'ag-hub', type:'design', date:'2026-05-15', impact:'alto', notes:'Sidebar fixa, dashboard com greeting, rings SVG por projeto, focus do dia. Separação em index.html + app.js.', createdAt: now },
    { id:'s-03', title:'Deploy Vercel + GitHub do AG Hub', projectId:'ag-hub', type:'deploy', date:'2026-05-15', impact:'alto', notes:'GitHub repo público AndreyRicaliff/ag-hub. Vercel auto-deploy em push main. URL: ag-hub-tan.vercel.app.', createdAt: now },
    { id:'s-04', title:'Seed com todos os projetos reais AG + histórico done/todo', projectId:'ag-hub', type:'data', date:'2026-05-15', impact:'alto', notes:'8 projetos, 40+ tarefas (concluídas e pendentes), 7 eventos. GitHub URLs. Seção Crescimento com domínios e sessões.', createdAt: now },
    { id:'s-05', title:'PULSAR-RH — 4 bugs críticos + 3 melhorias (sessão autônoma 4h)', projectId:'pulsar-rh', type:'bugfix', date:'2026-05-11', impact:'alto', notes:'Memory leak realtime, XSS em renderResults, eval disfarçado (new Function), O(n²)→O(n). + ARIA, validação email/CNPJ, disabled async.', createdAt: now },
    { id:'s-06', title:'PULSAR-RH — sprint1-security completa (3 sprints de features)', projectId:'pulsar-rh', type:'feature', date:'2026-05-08', impact:'alto', notes:'Audit log LGPD, claude-proxy Edge Function, Turnstile captcha, comentários em planos, PDF executivo, branding por cliente, i18n PT/EN/ES.', createdAt: now },
    { id:'s-07', title:'PULSAR-RH — sync Supabase-first + realtime publication', projectId:'pulsar-rh', type:'bugfix', date:'2026-05-06', impact:'alto', notes:'Commit e9949eb. persistAndCache/removeAndCache. Tabelas na publication supabase_realtime. RLS case-insensitive.', createdAt: now },
    { id:'s-08', title:'CLIENTE OFICINA — pipeline item-a-item em produção', projectId:'cliente-oficina', type:'feature', date:'2026-05-08', impact:'alto', notes:'sale_items + return_items com custo real. margin_value correto. Retry+backoff+lockfile. 9 tabelas Supabase.', createdAt: now },
    { id:'s-09', title:'CLIENTE OFICINA — sync incremental 5min + full-year configurados', projectId:'cliente-oficina', type:'deploy', date:'2026-05-06', impact:'alto', notes:'Task Scheduler Windows perpétuo. Oficina-Sync5Min (5min) + Oficina-SyncAnual (00:00). Janela 2d incremental.', createdAt: now },
    { id:'s-10', title:'Meet Hub — teste e2e 100% funcional', projectId:'meet-hub', type:'bugfix', date:'2026-05-07', impact:'alto', notes:'FFmpeg instalado na API. IDs Prisma consistentes. Mock Gemini para testes. Endpoint /recordings/test/auto funcionando.', createdAt: now },
    { id:'s-11', title:'AG Converge — sistema de inscrição RH em Xeque', projectId:'ag-converge', type:'feature', date:'2026-05-09', impact:'alto', notes:'3-passos (dados → doação → ingresso). QR code digital. Admin panel. Extrator .xlsx. Supabase project criado.', createdAt: now },
    { id:'s-12', title:'Cliente Varejo — diagnóstico causa-raiz (quota API esgotada)', projectId:'cliente-varejo', type:'planning', date:'2026-05-15', impact:'alto', notes:'Causa: plano Estratégia = 350 req/dia. Sync 5min consome 288→esgota em 14h. Solução: 10min, 300 req budget.', createdAt: now },
  ];

  localStorage.setItem('agh_projects', JSON.stringify(projects));
  localStorage.setItem('agh_tasks',    JSON.stringify(tasks));
  localStorage.setItem('agh_events',   JSON.stringify(events));
  localStorage.setItem('agh_sessions', JSON.stringify(sessions));
  localStorage.setItem('agh_seed_v',   '5');

  console.log('[AG Hub seed v4]', projects.length, 'projetos ·', tasks.length, 'tarefas ·', events.length, 'eventos ·', sessions.length, 'sessões');
})();
