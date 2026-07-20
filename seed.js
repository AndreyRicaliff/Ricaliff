// seed.js v12 — v11 + sessão s-61 (pulsar-finance, 2026-07-16)
// Em bump de versão: MERGE por id (seed só adiciona o que não existe) — nunca sobrescreve dado do usuário.
// Exceção deliberada: PATCHES de campos de infra (githubUrl/isPrivate) são fatos do seed,
// não conteúdo do usuário — esses são sobrescritos para propagar correções a browsers já seedados.

(function () {
  if (localStorage.getItem('agh_seed_v') === '12') return;

  const now = new Date().toISOString();

  // ── PROJETOS ─────────────────────────────────────────────────
  const projects = [
    { id: 'pulsar-rh',       name: 'PULSAR-RH',        description: 'SaaS de People Analytics — eNPS, NR-1 e KPIs de RH com cálculo determinístico e pesquisa anônima de verdade. Em produção em pulsar-rh.agconsultorialtda.com.', status: 'ativo',    color: '#1A7FFF', githubUrl: null,                                                      isPrivate: true,  createdAt: now, updatedAt: now,
      improvements: ['Corrigir memory leak no subscription de Realtime (não faz unsubscribe)', 'Remover eval() na função de fórmulas — vulnerabilidade XSS', 'Corrigir cálculo O(n*m) de compliance — usar Map para O(n)', 'Adicionar validação de schema antes de salvar indicadores', 'Implementar ARIA labels nos gráficos Chart.js', 'Padronizar feedback de erro nos formulários', 'Extrair cálculo de compliance para worker assíncrono'] },
    { id: 'cliente-varejo', name: 'Cliente Varejo',   description: 'Integração API ERP-externo→Supabase→Lovable. Diagnóstico: quota diária (350 req) esgota em 14h. Aguarda credenciais.', status: 'ativo',    color: '#FF5C5C', githubUrl: null,                                                      isPrivate: false, createdAt: now, updatedAt: now,
      improvements: ['Implementar check de saldo antes de cada ciclo (/v1/saldo-token)', 'Trocar intervalo de 5min para 10min (280→150 req/dia)', 'Adicionar janela de overlap de 10min no sync incremental', 'Full-sync completo às 00:00 (7 dias)', 'Idempotência por ID de atendimento'] },
    { id: 'cliente-oficina',   name: 'CLIENTE OFICINA',     description: 'BI de vendas para rede de 6 lojas. Sync Firebird→Supabase 5min + full-year 00:00. Em produção no Windows do cliente.', status: 'ativo',    color: '#FFBC7D', githubUrl: null,                                                      isPrivate: true,  createdAt: now, updatedAt: now,
      improvements: ['Preencher store_locations com cidade-base das 6 lojas', 'Rotacionar credenciais de backend (higiene)', 'Definir retenção de sale_items (sugestão: 180d, LGPD §8)'] },
    { id: 'meet-hub',        name: 'Meet Hub',           description: 'Gravação e transcrição automática de reuniões Google Meet. Deploy DigitalOcean. Teste e2e funcional.', status: 'ativo',    color: '#06B6D4', githubUrl: null,                                                      isPrivate: false, createdAt: now, updatedAt: now,
      improvements: ['Integrar Gemini 1.5 Flash real (remover mock de transcrição)', 'Implementar busca em transcrições', 'Migrar de DigitalOcean para Hetzner (redução de custo)'] },
    { id: 'ag-converge',     name: 'AG Converge',        description: 'Plataforma própria de eventos AG. RH em Xeque concluído (14/05). Próximo: migrar leads para Supabase.', status: 'ativo',    color: '#08C16A', githubUrl: null,                                                      isPrivate: false, createdAt: now, updatedAt: now,
      improvements: ['Exportar leads RH em Xeque: node extrair-leads.js leads-rh-em-xeque.json', 'Migrar localStorage → Supabase (multi-dispositivo, sem perda)', 'Planejar próximo evento'] },
    { id: 'cafe-com-ag',     name: 'Café com AG',        description: 'Calendário editorial do programa semanal de YouTube. Bloqueado: Client ID Google OAuth não configurado.', status: 'pausado',   color: '#EC4899', githubUrl: null,                                                      isPrivate: false, createdAt: now, updatedAt: now,
      improvements: ['Configurar GOOGLE_CLIENT_ID no Google Cloud Console', 'Definir URL de hospedagem (GitHub Pages ou Vercel)', 'Testar login com @agconsultorialtda.com'] },
    { id: 'ag-hub',          name: 'Ricaliff (hub)',     description: 'Este sistema de gestão pessoal. Deploy Vercel + GitHub. Evolução contínua.', status: 'ativo',    color: '#4DA8FF', githubUrl: 'https://github.com/AndreyRicaliff/Ricaliff',              isPrivate: false, createdAt: now, updatedAt: now,
      improvements: ['Aplicar CSS gerado pelo Claude Design (visual final)', 'Migrar localStorage → Supabase para acesso multi-dispositivo'] },
    { id: 'ifpb',            name: 'IFPB — Estudos',     description: 'Exercícios e anotações do curso de programação no IFPB. Projeto pessoal, sem pressão.', status: 'ativo',    color: '#7A9BC4', githubUrl: null,                                                      isPrivate: false, createdAt: now, updatedAt: now,
      improvements: ['Rodar pnpm install no scaffold TypeScript', 'Completar módulo de Arrays e Funções', 'Iniciar exercícios de POO'] },
    { id: 'pulsar-finance',  name: 'Pulsar Finance',     description: 'Produto AG de financeiro/BPO — DRE/DFC, matriz de classificação, apresentação exportável e ingestão multi-provedor de ERP. Sucessor do painel anterior. Deploy Netlify.', status: 'ativo', color: '#8B5CF6', githubUrl: null,          isPrivate: true,  createdAt: now, updatedAt: now,
      improvements: ['Concluir adapter do 2º provedor de ERP (hoje fail-closed na Fase 2)', 'Cobrir a camada de tradução do ERP com teste — é a fronteira que mais quebrou', 'Retenção/expurgo de dados financeiros de cliente (LGPD §8)'] },
    { id: 'algoritmo-lideranca', name: 'O Algoritmo da Liderança', description: 'Checkout do infoproduto de liderança — landing + cobrança serverless via gateway de pagamento, com repasse de taxa de cartão por faixa de parcela.', status: 'ativo', color: '#F59E0B', githubUrl: 'https://github.com/AndreyRicaliff/algoritmo-lideranca-checkout', isPrivate: false, createdAt: now, updatedAt: now,
      improvements: ['Webhook de confirmação de pagamento (hoje só cria a cobrança)', 'Página de sucesso própria em vez de depender do SUCCESS_URL do gateway', 'Reconciliação: o que foi pago x o que foi inscrito'] },
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
    { id: 'b-t02', title: 'Rotacionar credenciais de backend (higiene)', status: 'todo', priority: 'medium', projectId: 'cliente-oficina', due: null, notes: 'Gerar novas credenciais no painel do provedor e atualizar na infra do cliente.', createdAt: now },
    { id: 'b-t03', title: 'Definir retenção de sale_items — 180 dias (LGPD §8)', status: 'todo', priority: 'low', projectId: 'cliente-oficina', due: null, notes: 'Criar job de limpeza no Supabase ou pg_cron.', createdAt: now },

    // ═══════════════════════════════════════════════
    // MEET HUB
    // ═══════════════════════════════════════════════

    // ✅ CONCLUÍDAS
    { id: 'm-d01', title: 'Deploy DigitalOcean funcionando', status: 'done', priority: 'high', projectId: 'meet-hub', due: null, notes: 'Stack: Node+Express+PostgreSQL+Prisma / React+TS+Tailwind / Puppeteer+Docker / Bull Redis.', createdAt: now },
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
    { id: 'a-d05', title: 'Projeto Supabase AG-Converge criado (sa-east-1)', status: 'done', priority: 'medium', projectId: 'ag-converge', due: null, notes: 'Pronto para integração. Credenciais salvas na memória.', createdAt: now },

    // 📋 PENDENTES
    { id: 'a-t01', title: 'Exportar leads RH em Xeque (urgente — pós evento)', status: 'todo', priority: 'high', projectId: 'ag-converge', due: '2026-05-16', notes: 'cd ~/projetos/ag-evento && node extrair-leads.js leads-rh-em-xeque.json', createdAt: now },
    { id: 'a-t02', title: 'Migrar leads localStorage → Supabase (projeto AG-Converge)', status: 'todo', priority: 'medium', projectId: 'ag-converge', due: null, notes: 'localStorage não persiste entre dispositivos. Schema: tabela leads com slug do evento.', createdAt: now },
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

    // ── mai–jul/2026: histórico minerado do git real dos projetos (codinomes obrigatórios) ──

    // Ricaliff (hub)
    { id:'s-13', title:'Auditoria completa do hub: privacidade, gamificação religada e achados do review', projectId:'ag-hub', type:'bugfix', date:'2026-07-14', impact:'alto', notes:'Sanitização em 2 camadas no pipeline de XP, atributos = base do produtor + delta local, backup v2 validado, geradores portados p/ node.', createdAt: now },
    { id:'s-14', title:'Publicação do repo como portfólio: codinomes na árvore inteira + histórico reescrito', projectId:'ag-hub', type:'refactor', date:'2026-07-06', impact:'alto', notes:'Identificadores de cliente viram codinomes; estado operacional sai do repo público; filter-repo + repo novo em vez de force push.', createdAt: now },
    { id:'s-15', title:'P3 v2 — paridade visual com o rice do OS via design tokens', projectId:'ag-hub', type:'design', date:'2026-07-03', impact:'alto', notes:'Tokens (cor/easing/duração/forma) extraídos do QML pra CSS custom properties; tema persona↔pro num atributo no root via color-mix.', createdAt: now },
    { id:'s-16', title:'Hardening do hub: DOMPurify no markdown, seed com merge por id, storage resiliente', projectId:'ag-hub', type:'bugfix', date:'2026-07-03', impact:'medio', notes:'Markdown da trilha sanitizado no sink, color/githubUrl validados na boundary e parse tolerante a chave corrompida.', createdAt: now },
    { id:'s-17', title:'Consolidação dos estudos em monorepo + 4 trilhas novas (git, IA/ML, APIs, escala)', projectId:'ag-hub', type:'feature', date:'2026-06-30', impact:'alto', notes:'Trilha vira fonte canônica in-repo (29 módulos novos); dependência cross-repo removida e repo legado aposentado.', createdAt: now },
    { id:'s-18', title:'Camada RPG: 6 atributos, skill tree e quest board cruzando projeto com trilha', projectId:'ag-hub', type:'feature', date:'2026-06-01', impact:'alto', notes:'Sistema de build/atributos e side quests que vinculam módulo de estudo a projeto real (XP×2 quando vinculada).', createdAt: now },
    { id:'s-19', title:'Rituais de foco: daily standup, pomodoro, hora sagrada e streaks', projectId:'ag-hub', type:'feature', date:'2026-06-01', impact:'medio', notes:'Standup com resumo de ontem e sugestões, timer de foco e streaks por tipo (geral/estudo/sem-IA/decisões).', createdAt: now },

    // PULSAR-RH
    { id:'s-20', title:'Revisão do fluxo de pesquisas: polaridade fim-a-fim e gate de pesquisa inativa', projectId:'pulsar-rh', type:'bugfix', date:'2026-07-12', impact:'alto', notes:'NPS fora do overall_score, médias coerentes entre superfícies, pesquisa não-ativa deixa de aceitar resposta; demo só com token exato.', createdAt: now },
    { id:'s-21', title:'Fase 1 de contas: client_users como identidades reais + hardening do fluxo admin', projectId:'pulsar-rh', type:'feature', date:'2026-07-10', impact:'alto', notes:'Fundação de identidade por pessoa, rotação de senha/identidade admin, ADMIN_EMAIL nas edge functions e higiene de policies.', createdAt: now },
    { id:'s-22', title:'Motor de favorabilidade COPSOQ + Tendência derivada (NR-1)', projectId:'pulsar-rh', type:'feature', date:'2026-07-08', impact:'alto', notes:'Fases 2-4 do COPSOQ II: favorabilidade calculada e polaridade carregada do seed até a criação da pesquisa do cliente.', createdAt: now },
    { id:'s-23', title:'Identidade PulsaRH: marca losango+pessoa+pulso, boot, som e FX de console', projectId:'pulsar-rh', type:'design', date:'2026-06-12', impact:'alto', notes:'Marca própria em todas as superfícies, splash de boot com wordmark pulsante e toggle master que silencia todo som.', createdAt: now },
    { id:'s-24', title:'Catálogo CID-10 nos processos + dashboard derivado do registro vivo', projectId:'pulsar-rh', type:'feature', date:'2026-06-12', impact:'alto', notes:'Campo CID-10 com busca de título ao vivo em atestados; métricas do dashboard deixam de vir de indicador manual.', createdAt: now },
    { id:'s-25', title:'Portal do cliente gen-2: board de planos, RPCs security-definer e polaridade', projectId:'pulsar-rh', type:'feature', date:'2026-06-11', impact:'alto', notes:'Padrão visual de 2ª geração, kanban de PDI com drag-drop, deletes via RPC security-definer e superfície RPC endurecida.', createdAt: now },
    { id:'s-26', title:'Senhas de cliente com bcrypt via trigger no banco', projectId:'pulsar-rh', type:'bugfix', date:'2026-06-09', impact:'alto', notes:'Hash no banco em vez da aplicação; alerta de comentário negativo passa a ter escopo por tenant.', createdAt: now },
    { id:'s-27', title:'Smoke test do portal do cliente com Playwright', projectId:'pulsar-rh', type:'feature', date:'2026-06-03', impact:'medio', notes:'Primeiro harness de teste automatizado do produto, com lockfile pra instalação reprodutível.', createdAt: now },
    { id:'s-28', title:'White-label por cliente no portal + modularização do client.html', projectId:'pulsar-rh', type:'feature', date:'2026-06-02', impact:'medio', notes:'Branding por cliente no portal; 37 símbolos perdidos na modularização restaurados e duplicatas removidas.', createdAt: now },
    { id:'s-29', title:'Performance: O(n²) → O(1) em resultados por área e contagens de PDI', projectId:'pulsar-rh', type:'refactor', date:'2026-05-28', impact:'medio', notes:'Render de resultados e contadores do dashboard deixam de recalcular em loop aninhado.', createdAt: now },

    // Cliente Varejo
    { id:'s-30', title:'Tipos derivados do Row gerado (fonte única) + RLS de gerente versionada', projectId:'cliente-varejo', type:'refactor', date:'2026-07-14', impact:'alto', notes:'types.ts desatualizado era a causa-raiz dos any no dashboard; tipos passam a derivar do Row gerado e a cláusula de gerente vira migration.', createdAt: now },
    { id:'s-31', title:'Caixa de cadastros pendentes pro supervisor (visibilidade não apaga dado)', projectId:'cliente-varejo', type:'feature', date:'2026-07-14', impact:'medio', notes:'Semântica de visibilidade: o painel esconde, nunca deleta registro vindo do sync.', createdAt: now },
    { id:'s-32', title:'Drill-down de KPI por vendedor × categoria + exportação Excel do Relatório Geral', projectId:'cliente-varejo', type:'feature', date:'2026-07-12', impact:'alto', notes:'Helpers compartilhados de drill-down/exportação; filtro de período do relatório passa a seguir o filtro global.', createdAt: now },
    { id:'s-33', title:'Congelamento de meses fechados + trade-in de seminovo como categoria de lucro', projectId:'cliente-varejo', type:'feature', date:'2026-07-08', impact:'alto', notes:'Mês fechado resiste a reescrita retroativa de regra; trade-in entra líquido em categoria dedicada e neutro no relatório geral.', createdAt: now },
    { id:'s-34', title:'Sync robusto: corte do dia em BRT, saldo por credencial e backoff de mês vazio', projectId:'cliente-varejo', type:'bugfix', date:'2026-07-07', impact:'alto', notes:'Timestamps da API são UTC (corte à meia-noite BRT); quota é 350/dia POR loja; 429 no saldo tratado como zero.', createdAt: now },
    { id:'s-35', title:'Relatório Geral: vendas por categoria com cross-check de comissão e drill por colaborador', projectId:'cliente-varejo', type:'feature', date:'2026-07-06', impact:'alto', notes:'Abas com drill por colaborador, coluna com juros pra reconciliar contra o ERP-externo e drill de item por categoria.', createdAt: now },
    { id:'s-36', title:'Typecheck real (noImplicitAny + strictNullChecks) e gate público nas edge functions', projectId:'cliente-varejo', type:'refactor', date:'2026-07-03', impact:'alto', notes:'Types do banco corrompidos regenerados, colunas nuláveis tratadas e funções de sync/análise deixam de aceitar chamada pública.', createdAt: now },

    // Meet Hub
    { id:'s-37', title:'Monorepo consolidado (api + web + bot)', projectId:'meet-hub', type:'refactor', date:'2026-06-01', impact:'baixo', notes:'Estrutura unificada dos três serviços num repositório só.', createdAt: now },

    // PULSAR-RH — privacidade e transparência (15/07)
    { id:'s-38', title:'Anonimato real da pesquisa: ledger de participação separado da resposta', projectId:'pulsar-rh', type:'feature', date:'2026-07-15', impact:'alto', notes:'Quem respondeu e o que foi respondido passam a viver em tabelas distintas — dá pra cobrar quem faltou sem conseguir ligar resposta a pessoa.', createdAt: now },
    { id:'s-39', title:'Identidade sai do respondente, do admin e do portal — e do audit_log', projectId:'pulsar-rh', type:'bugfix', date:'2026-07-15', impact:'alto', notes:'O schema parou de guardar identidade mas o log de auditoria continuava gravando: anonimato que vaza por um lado não é anonimato.', createdAt: now },
    { id:'s-40', title:'Todo indicador expõe a fórmula, a fonte e o período que o geraram', projectId:'pulsar-rh', type:'feature', date:'2026-07-15', impact:'alto', notes:'Popup de transparência por KPI. Número de RH sem procedência não sustenta decisão — e não sobrevive a questionamento de auditoria.', createdAt: now },

    // AG Converge — evento RH em Xeque (mai)
    { id:'s-41', title:'Plataforma de eventos do zero com inscrição, consulta e admin em Supabase', projectId:'ag-converge', type:'feature', date:'2026-05-09', impact:'alto', notes:'Saiu de armazenamento local pra Supabase no mesmo ciclo: inscrição, lookup, histórico e painel. Assets e vídeos self-hosted pra não pesar o deploy.', createdAt: now },
    { id:'s-42', title:'Fechamento das brechas: URLs administrativas não-óbvias, headers e corridas de concorrência', projectId:'ag-converge', type:'bugfix', date:'2026-05-11', impact:'alto', notes:'Middleware de Basic Auth trocado por rotas não-adivinháveis + hardening de header; limite de 120 lugares deixou de ser furável por inscrição concorrente.', createdAt: now },
    { id:'s-43', title:'Gestão do dia do evento: portaria com check-in, QR no ingresso e painel em tempo real', projectId:'ag-converge', type:'feature', date:'2026-05-11', impact:'alto', notes:'Check-in por busca de nome, QR em PDF, contagem ao vivo via Realtime com toast de nova inscrição e wake lock na tela do ingresso.', createdAt: now },
    { id:'s-44', title:'Acompanhante vira participante completo (até 3 por titular)', projectId:'ag-converge', type:'feature', date:'2026-05-11', impact:'alto', notes:'Antes o acompanhante sumia silenciosamente no insert e furava a contagem de vagas. Virou registro de primeira classe, com verificação de duplicidade por e-mail/telefone.', createdAt: now },
    { id:'s-45', title:'Auditoria pré-evento: 8 bugs médios e todos os críticos fechados antes do dia', projectId:'ag-converge', type:'bugfix', date:'2026-05-11', impact:'alto', notes:'Varredura completa faltando dias pro evento — cache de leads matou chamada por tecla digitada no admin, e o resto virou correção em lote.', createdAt: now },
    { id:'s-46', title:'Pesquisa de satisfação pós-evento com as perguntas reais aplicadas', projectId:'ag-converge', type:'feature', date:'2026-05-14', impact:'medio', notes:'Formulário próprio no lugar do Google Forms, com escala e logo do evento, fechando o ciclo do RH em Xeque.', createdAt: now },

    // Pulsar Finance (inclui o painel anterior, mesmo produto)
    { id:'s-47', title:'Matriz de classificação: regime DRE/DFC/ambos por grupo e subgrupo, com arrasto', projectId:'pulsar-finance', type:'feature', date:'2026-06-14', impact:'alto', notes:'O contador escolhe o regime na criação do grupo; classe removida cai num painel de realocação em vez de sumir. Drill até a movimentação com lupa.', createdAt: now },
    { id:'s-48', title:'Apresentação exportável que é o app real + snapshot dos dados, offline', projectId:'pulsar-finance', type:'feature', date:'2026-06-14', impact:'alto', notes:'HTML autossuficiente com slides editáveis, gráficos de eixo-zero e CSS de impressão — o cliente abre sem servidor, sem login e sem CDN.', createdAt: now },
    { id:'s-49', title:'Editor de demonstrações modularizado: 491 → 73 linhas com dispatch único', projectId:'pulsar-finance', type:'refactor', date:'2026-06-14', impact:'alto', notes:'O componente tinha virado o gargalo de toda mudança. Quebrado em partes com despacho DRY — a regressão do editor caiu junto.', createdAt: now },
    { id:'s-50', title:'Ingestão multi-provedor de ERP com costura fail-closed', projectId:'pulsar-finance', type:'feature', date:'2026-06-19', impact:'alto', notes:'Segundo provedor entra por adapter isolado; sem credencial válida o pipeline recusa em vez de seguir com dado parcial e contaminar o relatório.', createdAt: now },
    { id:'s-51', title:'Produção deixa de aceitar cadastro público e RLS fecha pra autenticado', projectId:'pulsar-finance', type:'bugfix', date:'2026-07-03', impact:'alto', notes:'Signup aberto num app de dado financeiro de cliente é porta destrancada. Login obrigatório em prod + trigger restringindo domínio no cadastro.', createdAt: now },
    { id:'s-52', title:'Rótulos legíveis pra dado cru do ERP (código opaco, stakeholder nulo)', projectId:'pulsar-finance', type:'feature', date:'2026-07-14', impact:'medio', notes:'A tradução do provedor entregava código opaco e nome cru na tela. Achados da revisão da tradução aplicados no mesmo ciclo.', createdAt: now },
    { id:'s-53', title:'Deploy no Netlify: build versionado, redirect de SPA e Cache-Control restaurado', projectId:'pulsar-finance', type:'deploy', date:'2026-07-14', impact:'medio', notes:'Lockfile passa a ser sempre commitado (app, não lib); index.html sem cache e assets com hash imutável.', createdAt: now },

    // Cliente Oficina — pipeline de vendas
    { id:'s-54', title:'Breakdown de receita e agregação de vendas por cidade no banco', projectId:'cliente-oficina', type:'feature', date:'2026-05-05', impact:'alto', notes:'Migrations de quebra de receita + localização de cliente; validação reescrita como UNION ALL plano pra conferir contra a origem.', createdAt: now },
    { id:'s-55', title:'Credenciais saem do script e viram .env, com setup idempotente', projectId:'cliente-oficina', type:'refactor', date:'2026-05-06', impact:'alto', notes:'Chave versionada em script é dívida de segurança. Setup passa a só preencher o que falta — nunca sobrescreve valor existente do cliente.', createdAt: now },
    { id:'s-56', title:'Sync serializado com lockfile, retry/backoff e janela de 30d para 2d', projectId:'cliente-oficina', type:'refactor', date:'2026-05-08', impact:'alto', notes:'Full-year e incremental colidiam na máquina do cliente; lockfile serializa. Janela curta derrubou o custo do ciclo de 5min.', createdAt: now },

    // O Algoritmo da Liderança — checkout
    { id:'s-57', title:'Spec do checkout e guia de integração do gateway para handoff', projectId:'algoritmo-lideranca', type:'planning', date:'2026-06-22', impact:'medio', notes:'Especificação escrita pra ser executada por outro dev (stack WordPress) — o guia da API é o contrato do handoff.', createdAt: now },
    { id:'s-58', title:'Repasse da taxa de cartão ao cliente por faixa de parcela', projectId:'algoritmo-lideranca', type:'feature', date:'2026-07-14', impact:'alto', notes:'A taxa muda por faixa de parcelamento; o preço exibido passa a embutir a faixa certa em vez de comer a diferença na margem.', createdAt: now },
    { id:'s-59', title:'Criação de cobrança via serverless e callback só quando há URL de retorno', projectId:'algoritmo-lideranca', type:'bugfix', date:'2026-07-14', impact:'medio', notes:'Endpoint serverless cria a cobrança; o callback passa a ser condicional pra não exigir domínio configurado e derrubar a inscrição.', createdAt: now },
    { id:'s-60', title:'Fechou leitura anon de tabelas legado em prod e travou o login fail-closed', projectId:'pulsar-finance', type:'bugfix', date:'2026-07-16', impact:'alto', notes:'Frota multi-agente caiu na cota; revisao inline. Dropei 3 policies de SELECT anon em tabelas legado (provado */0), gate de auth invertido p/ fail-closed, backoff+aviso de truncamento no sync ERP.', createdAt: now },
    { id:'s-61', title:'Acesso-cliente do painel financeiro: papel + RLS role-aware fail-closed + HUD read-only', projectId:'pulsar-finance', type:'feature', date:'2026-07-16', impact:'alto', notes:'painel_acessos + helpers SECURITY DEFINER; operador ve tudo, cliente so o proprio tenant por prefixo de chave, read-only; gate no front forca HUD kiosk; isolamento validado por sessao simulada.', createdAt: now },
  ];

  // ── ESTUDOS ───────────────────────────────────────────────────────
  const studies = [
    { id:'st-01', topic:'Scaffold TypeScript — configuração inicial do projeto IFPB', subject:'IFPB', hours:1.5, date:'2026-05-12', notes:'tsconfig.json, pnpm init, estrutura de pastas src/. Pendente: pnpm install.', createdAt: now },
    { id:'st-02', topic:'Tipos primitivos e inferência em TypeScript', subject:'IFPB', hours:1, date:'2026-05-13', notes:'string, number, boolean, arrays tipados. Diferença entre any e unknown.', createdAt: now },
    { id:'st-03', topic:'Funções e closures — conceitos e exercícios práticos', subject:'IFPB', hours:2, date:'2026-05-14', notes:'Arrow functions, parâmetros opcionais, closures com exemplo de contador e memória.', createdAt: now },
    { id:'st-04', topic:'Claude API — tool use avançado (parallel calls)', subject:'Claude API', hours:1, date:'2026-05-11', notes:'Chamadas paralelas de ferramentas, gerenciamento de tool_use blocks, cost analysis.', createdAt: now },
    { id:'st-05', topic:'Supabase RLS — políticas para multi-tenant', subject:'Supabase', hours:1.5, date:'2026-05-08', notes:'auth.uid() em RLS, políticas para client_id. Estudo aplicado no PULSAR-RH.', createdAt: now },
    { id:'st-06', topic:'Docker compose — multi-container (Meet Hub)', subject:'DevOps', hours:1, date:'2026-05-07', notes:'Serviços: api, web, bot, db, redis. Health checks, volumes, network interno.', createdAt: now },
  ];

  // Merge por id: dado do usuário sempre vence; seed só acrescenta itens novos
  const mergeById = (key, items) => {
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem(key) || '[]'); } catch { existing = []; }
    if (!Array.isArray(existing)) existing = [];
    const have = new Set(existing.map(x => x && x.id));
    const merged = existing.concat(items.filter(x => !have.has(x.id)));
    localStorage.setItem(key, JSON.stringify(merged));
    return merged.length;
  };

  const nP = mergeById('agh_projects', projects);
  const nT = mergeById('agh_tasks',    tasks);
  const nE = mergeById('agh_events',   events);
  const nS = mergeById('agh_sessions', sessions);
  const nSt= mergeById('agh_studies',  studies);

  // v8: patch de campos de INFRA em itens já seedados — links GitHub fabricados
  // davam 404 pra qualquer visitante; são fatos do seed, não edição do usuário
  const projectPatches = {
    'pulsar-rh':       { githubUrl: null, isPrivate: true },
    'cliente-oficina': { githubUrl: null },
    'ag-converge':     { githubUrl: null },
    'cafe-com-ag':     { githubUrl: null },
    'ag-hub':          { githubUrl: 'https://github.com/AndreyRicaliff/Ricaliff' },
  };
  try {
    const existing = JSON.parse(localStorage.getItem('agh_projects') || '[]');
    let patched = 0;
    existing.forEach(p => {
      if (p && projectPatches[p.id]) { Object.assign(p, projectPatches[p.id]); patched++; }
    });
    if (patched) localStorage.setItem('agh_projects', JSON.stringify(existing));
  } catch (e) { console.warn('[seed] patch v8 falhou (agh_projects ilegível):', e); }

  localStorage.setItem('agh_seed_v',   '12');

  console.log('[Ricaliff seed v12 · merge]', nP, 'projetos ·', nT, 'tarefas ·', nE, 'eventos ·', nS, 'sessões ·', nSt, 'estudos');
})();
