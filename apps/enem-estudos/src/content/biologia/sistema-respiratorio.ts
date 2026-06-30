import type { Topico } from '../types.ts';

export const sistemaRespiratorio: Topico = {
  id: 'sistema-respiratorio',
  titulo: 'Sistema Respiratório',

  mapaMental: `# Sistema Respiratório
- Vias Aéreas
  - Superiores
    - Nariz (filtração, umidificação, aquecimento)
    - Faringe (cruza com sistema digestório)
    - Laringe (cartilagem tireoide, epiglote, cordas vocais)
  - Inferiores
    - Traqueia (anéis cartilaginosos em C, cílios)
    - Brônquios principais (direito e esquerdo)
    - Brônquios secundários e terciários
    - Bronquíolos (sem cartilagem, musculatura lisa)
    - Bronquíolos terminais → alveolares → alvéolos
- Pulmões e Pleura
  - Pulmão direito (3 lobos) / esquerdo (2 lobos)
  - Pleura visceral e parietal
  - Líquido pleural (lubrificação, pressão negativa)
  - Hilo pulmonar (artéria, veia, brônquio)
- Mecânica Ventilatória
  - Inspiração (ativa)
    - Diafragma contrai → desce
    - Músculos intercostais externos → costelas sobem
    - Volume torácico aumenta → pressão intrapleural cai
    - Pressão intrapulmonar < atmosférica → ar entra
  - Expiração (passiva em repouso)
    - Diafragma relaxa → sobe
    - Recuo elástico dos pulmões
    - Volume diminui → pressão intrapulmonar > atmosférica → ar sai
  - Volumes e capacidades
    - Volume corrente (~500 mL)
    - Volume de reserva inspiratória (~3000 mL)
    - Volume de reserva expiratória (~1200 mL)
    - Volume residual (~1200 mL)
    - Capacidade vital (soma dos três primeiros)
- Hematose (Trocas Gasosas)
  - Membrana alvéolo-capilar (0,5 µm)
  - Difusão por gradiente de pressão parcial
    - O2: alvéolo (pO2 ~100 mmHg) → capilar (pO2 ~40 mmHg)
    - CO2: capilar (pCO2 ~45 mmHg) → alvéolo (pCO2 ~40 mmHg)
  - Surfactante pulmonar (reduz tensão superficial, evita colapso)
- Transporte de Gases
  - Oxigênio
    - 97% ligado à hemoglobina (oxiemoglobina HbO2)
    - 3% dissolvido no plasma
    - Curva de dissociação sigmóide
  - Dióxido de Carbono
    - 70% como bicarbonato (HCO3-) no plasma
    - 23% ligado à hemoglobina (carbaminoemoglobina)
    - 7% dissolvido no plasma
    - Equação: CO2 + H2O ⇌ H2CO3 ⇌ H+ + HCO3- (anidrase carbônica)
- Controle Nervoso da Respiração
  - Centro respiratório no bulbo (grupo dorsal e ventral)
  - Ajuste fino pela ponte (pneumotáxico e apnêustico)
  - Quimiorreceptores centrais (bulbo): detectam aumento de CO2/H+
  - Quimiorreceptores periféricos (corpos carotídeos e aórticos): O2 e CO2
  - Principal estímulo: elevação do CO2 (hipercapnia) → mais H+ → bulbo → aumenta FR
- Disfunções Respiratórias
  - Asma (broncoespasmo, inflamação, muco → obstrução reversível)
  - Enfisema (destruição de alvéolos, perda de elasticidade, hiperinsuflação)
  - Bronquite crônica (inflamação e hiperprodução de muco, tosse produtiva)
  - DPOC (agrupa enfisema + bronquite crônica; tabagismo principal causa)
  - Pneumonia (infecção alvéolo → exsudato → prejuízo à hematose)
  - Apneia do sono (colapso VAS, hipóxia intermitente)`,

  resumoCurto: `O **sistema respiratório** é responsável pela troca de gases entre o organismo e o ambiente. O ar percorre as **vias aéreas**: nariz (onde é filtrado, aquecido e umidificado), faringe, laringe, traqueia, brônquios, bronquíolos e, por fim, os **alvéolos pulmonares**, onde ocorre a **hematose**.

A **inspiração** é um processo ativo: o diafragma se contrai e desce, os músculos intercostais externos elevam as costelas, o volume torácico aumenta e a pressão intrapulmonar cai abaixo da atmosférica, fazendo o ar entrar. A **expiração**, em repouso, é passiva: os músculos relaxam e o recuo elástico do pulmão expulsa o ar.

Nos alvéolos, o oxigênio difunde do ar para o sangue e o gás carbônico segue o caminho inverso, ambos movidos por gradiente de pressão parcial. No sangue, **97% do O2** é transportado pela hemoglobina (oxiemoglobina) e **70% do CO2** viaja como bicarbonato (HCO3-), formado pela enzima **anidrase carbônica**.

O controle da respiração é feito pelo **bulbo raquidiano**, que detecta elevação de CO2 e H+ no sangue e aumenta a frequência respiratória para restabelecer o equilíbrio. Disfunções como asma, enfisema e bronquite comprometem esse sistema de formas distintas.`,

  resumoLongo: `## Anatomia das Vias Aéreas

As vias aéreas dividem-se em **superiores** (nariz, faringe e laringe) e **inferiores** (traqueia, brônquios, bronquíolos e alvéolos).

O **nariz** realiza a primeira etapa de condicionamento do ar: pelos nasais e muco retêm partículas; a mucosa vascularizada aquece; e a umidade evita ressecamento dos tecidos inferiores. A **faringe** é um canal compartilhado com o sistema digestório. Na **laringe** estão as cordas vocais e a **epiglote**, que fecha a entrada traqueal durante a deglutição.

A **traqueia** possui anéis cartilaginosos em formato de C que impedem o colapso; o epitélio ciliado, com seu tapete mucociliar, empurra partículas para cima. Os **brônquios** se dividem progressivamente, perdendo cartilagem até virar **bronquíolos**, controlados por musculatura lisa (relevante na asma). Os **alvéolos** são cerca de 300 milhões, fornecendo área de ~70 m² para as trocas gasosas.

Os **pulmões** ficam dentro da caixa torácica, revestidos pela **pleura visceral**; a parede interna do tórax é coberta pela **pleura parietal**. Entre elas há líquido pleural em pressão negativa, mantendo o pulmão expandido. O pulmão direito tem 3 lobos; o esquerdo tem 2 (cedendo espaço ao coração).

## Mecânica Ventilatória

A ventilação obedece à **Lei de Boyle**: pressão e volume são inversamente proporcionais.

**Inspiração (ativa):**
1. O **diafragma** contrai e se achata (desce ~1,5 cm).
2. Os **músculos intercostais externos** contraem, elevando e afastando as costelas.
3. O volume da cavidade torácica aumenta.
4. A pressão intrapulmonar cai ~2-3 mmHg abaixo da pressão atmosférica.
5. O ar flui para dentro por gradiente de pressão.

**Expiração (passiva em repouso):**
1. O diafragma e os intercostais relaxam.
2. O **recuo elástico** dos pulmões (fibras elásticas + surfactante) reduz o volume.
3. A pressão intrapulmonar sobe acima da atmosférica e o ar é expelido.

Em exercício intenso, músculos acessórios (esternocleidomastoideo, escalenos) auxiliam a inspiração; músculos abdominais forçam a expiração.

## Hematose — Trocas Gasosas

A hematose ocorre na **membrana alvéolo-capilar**, com apenas ~0,5 µm de espessura (epitélio alveolar + membrana basal + endotélio capilar). A difusão segue a **Lei de Fick**: proporcional à área e ao gradiente, inversamente proporcional à espessura.

| Gás | pO2/pCO2 no alvéolo | pO2/pCO2 no capilar venoso | Sentido da difusão |
|-----|--------------------|-----------------------------|-------------------|
| O2  | ~100 mmHg          | ~40 mmHg                    | alvéolo → sangue  |
| CO2 | ~40 mmHg           | ~45 mmHg                    | sangue → alvéolo  |

O **surfactante pulmonar** (produzido por pneumócitos tipo II) reduz a tensão superficial dos alvéolos, impedindo o colapso ao final da expiração. Sua ausência causa a síndrome do desconforto respiratório neonatal em prematuros.

## Transporte de Oxigênio e CO2

**Oxigênio:**
- **97%** liga-se à **hemoglobina** formando **oxiemoglobina (HbO2)** — ligação cooperativa (curva sigmoide).
- **3%** dissolvido no plasma.
- A curva de dissociação desloca-se para a direita (menor afinidade, mais liberação de O2) com: aumento de temperatura, CO2, H+ (efeito Bohr) e 2,3-DPG — condições presentes nos tecidos ativos.

**Dióxido de carbono:**
- **70%** transportado como **bicarbonato (HCO3-)** no plasma: CO2 + H2O → H2CO3 → H+ + HCO3- (catalizado pela **anidrase carbônica** dentro das hemácias).
- **23%** como **carbaminoemoglobina** (CO2 ligado à porção globínica da Hb).
- **7%** dissolvido no plasma.

No pulmão, o processo é revertido: HCO3- retorna à hemácia, recombina-se com H+ formando CO2, que difunde para o alvéolo.

## Controle Nervoso da Respiração

O **centro respiratório** situa-se no **bulbo raquidiano** (medula oblonga), com dois grupos neuronais:
- **Grupo respiratório dorsal (GRD):** marca o ritmo inspiratório básico.
- **Grupo respiratório ventral (GRV):** ativado em exercício; controla músculos expiratórios.

A **ponte** contribui com o centro pneumotáxico (limita a duração da inspiração) e o apnêustico (prolonge a inspiração).

**Quimiorreceptores:**
- **Centrais** (bulbo): respondem à variação de pH do líquor, reflexo do aumento de CO2 no sangue (CO2 atravessa a barreira hematoencefálica, eleva H+).
- **Periféricos** (corpos carotídeos e aórticos): respondem a queda de pO2, aumento de pCO2 e queda de pH.

O **principal estímulo** para aumentar a ventilação é a **hipercapnia** (elevação de CO2). Uma queda severa de O2 (hipóxia) só estimula a ventilação quando pO2 cai abaixo de ~60 mmHg.

## Disfunções Respiratórias

**Asma:** doença inflamatória crônica das vias aéreas com broncoespasmo reversível, hiperprodução de muco e edema da mucosa. Causa dispneia, sibilância e tosse. Tratada com broncodilatadores (β2-agonistas) e corticosteroides inalatórios.

**Enfisema pulmonar:** destruição dos septos alveolares por enzimas proteolíticas (tabagismo ativa macrófagos). Reduz área de hematose, destrói fibras elásticas e provoca hiperinsuflação. Irreversível.

**Bronquite crônica:** inflamação persistente dos brônquios com hiperprodução de muco (tosse produtiva por ≥3 meses em 2 anos consecutivos). Tabagismo é a principal causa.

**DPOC (Doença Pulmonar Obstrutiva Crônica):** agrupa enfisema e bronquite crônica. Obstrução progressiva e irreversível ao fluxo aéreo. Quarta causa de morte no mundo.

**Pneumonia:** infecção (bacteriana, viral ou fúngica) que gera exsudato inflamatório nos alvéolos, prejudicando a hematose. Pode levar à hipoxemia grave.

**Apneia obstrutiva do sono:** colapso da musculatura da faringe durante o sono, gerando episódios de hipóxia intermitente. Associada à hipertensão e doenças cardiovasculares.`,

  flashcards: [
    {
      frente: 'Qual é a função do nariz no condicionamento do ar inspirado?',
      verso:
        'Filtrar partículas (pelos nasais e muco), aquecer (mucosa vascularizada) e umidificar o ar antes de chegar aos pulmões.',
    },
    {
      frente: 'O que é hematose e onde ocorre?',
      verso:
        'É a troca de gases (O2 entra no sangue, CO2 sai) que ocorre na membrana alvéolo-capilar, nos pulmões.',
    },
    {
      frente: 'Por que a inspiração é considerada um processo ativo?',
      verso:
        'Porque exige contração muscular do diafragma e dos intercostais externos para ampliar o volume torácico e reduzir a pressão intrapulmonar.',
    },
    {
      frente: 'Como a maior parte do CO2 é transportada no sangue?',
      verso:
        'Como bicarbonato (HCO3-), cerca de 70%, formado pela reação: CO2 + H2O → H2CO3 → H+ + HCO3-, catalisada pela anidrase carbônica.',
    },
    {
      frente: 'Qual o principal estímulo para o aumento da frequência respiratória?',
      verso:
        'A hipercapnia (aumento da concentração de CO2 no sangue), que eleva o H+ e é detectada pelos quimiorreceptores centrais do bulbo.',
    },
    {
      frente: 'O que é oxiemoglobina?',
      verso: 'É a hemoglobina ligada ao oxigênio (HbO2). Transporta cerca de 97% do O2 no sangue.',
    },
    {
      frente: 'Qual a diferença entre asma e enfisema?',
      verso:
        'Asma: broncoespasmo inflamatório reversível das vias aéreas. Enfisema: destruição irreversível dos septos alveolares, com perda da área de hematose e elasticidade.',
    },
    {
      frente: 'O que é surfactante pulmonar e qual sua importância?',
      verso:
        'Substância lipoproteica produzida por pneumócitos tipo II que reduz a tensão superficial dos alvéolos, evitando seu colapso ao final da expiração.',
    },
    {
      frente: 'O que é o efeito Bohr?',
      verso:
        'A diminuição da afinidade da hemoglobina pelo O2 em ambiente ácido (pH baixo), com alta pCO2 e temperatura elevada, favorecendo a liberação de O2 nos tecidos ativos.',
    },
    {
      frente: 'Onde fica o centro respiratório e qual sua função?',
      verso:
        'No bulbo raquidiano. Regula o ritmo e a profundidade da respiração com base nos níveis de CO2, O2 e pH detectados pelos quimiorreceptores.',
    },
    {
      frente: 'O que são quimiorreceptores periféricos e onde estão?',
      verso:
        'São receptores nos corpos carotídeos (bifurcação da carótida) e aórticos que detectam queda de pO2, aumento de pCO2 e queda de pH no sangue arterial.',
    },
    {
      frente: 'Por que a expiração em repouso é passiva?',
      verso:
        'Porque não exige contração muscular: o diafragma e os intercostais relaxam, e o recuo elástico dos pulmões expulsa o ar naturalmente.',
    },
  ],

  questoes: [
    {
      enunciado:
        'Durante uma caminhada intensa, João percebe que sua respiração ficou mais rápida e profunda. O principal fator responsável por esse aumento da frequência respiratória é:',
      alternativas: [
        'A queda brusca da concentração de oxigênio no sangue arterial.',
        'O aumento da concentração de CO2 no sangue, com consequente queda do pH.',
        'O aumento da temperatura corporal detectado pela pleura.',
        'A redução do volume corrente percebida pelos pulmões.',
        'O aumento da pressão arterial sistêmica detectado pelo coração.',
      ],
      correta: 1,
      explicacao:
        'O principal estímulo ventilatório é a hipercapnia: o CO2 eleva H+ no líquor e no sangue, ativando os quimiorreceptores centrais do bulbo, que intensificam a respiração.',
    },
    {
      enunciado:
        'A hematose é o processo pelo qual o sangue venoso se torna arterial. Esse processo depende fundamentalmente de:',
      alternativas: [
        'Transporte ativo de O2 através da membrana alvéolo-capilar.',
        'Gradientes de pressão parcial de O2 e CO2 entre o alvéolo e o capilar pulmonar.',
        'Contração do diafragma para forçar o ingresso de O2 nos capilares.',
        'Ação da hemoglobina como bomba ativa de O2 no interior dos alvéolos.',
        'Diferença de temperatura entre o ar alveolar e o sangue capilar.',
      ],
      correta: 1,
      explicacao:
        'A hematose ocorre por difusão simples: O2 passa do alvéolo (pO2 ~100 mmHg) para o capilar (pO2 ~40 mmHg), e CO2 segue o sentido oposto — ambos movidos pelo gradiente de pressão parcial.',
    },
    {
      enunciado:
        'Um paciente com enfisema pulmonar grave apresenta grave dificuldade respiratória. A base anatomofisiológica dessa condição é:',
      alternativas: [
        'Broncoespasmo reversível causado por inflamação da mucosa brônquica.',
        'Acúmulo excessivo de muco nos brônquios, bloqueando o fluxo de ar.',
        'Destruição dos septos alveolares, reduzindo a área de trocas gasosas e a elasticidade pulmonar.',
        'Colapso total da traqueia por ausência de anéis cartilaginosos.',
        'Infecção bacteriana que preenche os alvéolos com exsudato inflamatório.',
      ],
      correta: 2,
      explicacao:
        'No enfisema, enzimas proteolíticas (ativadas pelo tabagismo) destroem os septos alveolares. Isso reduz a área total de hematose e elimina fibras elásticas, causando hiperinsuflação.',
    },
    {
      enunciado:
        'Analise o trajeto do ar desde a narina até os alvéolos e assinale a sequência correta:',
      alternativas: [
        'Nariz → laringe → faringe → traqueia → brônquios → bronquíolos → alvéolos.',
        'Nariz → faringe → laringe → traqueia → brônquios → bronquíolos → alvéolos.',
        'Nariz → faringe → traqueia → laringe → brônquios → bronquíolos → alvéolos.',
        'Nariz → traqueia → faringe → laringe → brônquios → bronquíolos → alvéolos.',
        'Nariz → laringe → traqueia → faringe → brônquios → bronquíolos → alvéolos.',
      ],
      correta: 1,
      explicacao:
        'A sequência correta é: nariz → faringe → laringe (onde estão as cordas vocais e a epiglote) → traqueia → brônquios → bronquíolos → alvéolos.',
    },
    {
      enunciado:
        'O CO2 produzido nas células dos tecidos é transportado até os pulmões predominantemente na forma de:',
      alternativas: [
        'Oxiemoglobina dissolvida no plasma.',
        'Gás CO2 livre dissolvido no plasma (cerca de 70%).',
        'Íon bicarbonato (HCO3-) no plasma, formado pela ação da anidrase carbônica.',
        'Carbaminoemoglobina ligada ao grupo heme da hemoglobina.',
        'Ácido carbônico (H2CO3) estável no plasma sanguíneo.',
      ],
      correta: 2,
      explicacao:
        'Cerca de 70% do CO2 é transportado como HCO3-: dentro das hemácias, a anidrase carbônica catalisa CO2 + H2O → H2CO3 → H+ + HCO3-, que sai para o plasma.',
    },
    {
      enunciado:
        'Durante a inspiração, o que ocorre com o diafragma e com a pressão intrapulmonar?',
      alternativas: [
        'O diafragma relaxa e sobe; a pressão intrapulmonar aumenta.',
        'O diafragma contrai e desce; a pressão intrapulmonar cai abaixo da pressão atmosférica.',
        'O diafragma contrai e sobe; a pressão intrapulmonar aumenta acima da atmosférica.',
        'O diafragma relaxa e desce; a pressão intrapulmonar cai.',
        'O diafragma permanece estático; apenas os intercostais atuam na redução da pressão.',
      ],
      correta: 1,
      explicacao:
        'Na inspiração, o diafragma contrai e achata (desce), aumentando o volume torácico. A pressão intrapulmonar cai ~2-3 mmHg abaixo da atmosférica, forçando a entrada de ar.',
    },
    {
      enunciado:
        'Uma criança nascida prematuramente apresenta síndrome do desconforto respiratório. A causa mais provável é a deficiência de:',
      alternativas: [
        'Hemoglobina fetal, incapaz de captar oxigênio dos alvéolos.',
        'Anidrase carbônica nas hemácias, impedindo o transporte de CO2.',
        'Surfactante pulmonar, levando ao colapso alveolar ao final de cada expiração.',
        'Quimiorreceptores periféricos, que não detectam a queda de O2.',
        'Musculatura intercostal, insuficiente para expandir o tórax.',
      ],
      correta: 2,
      explicacao:
        'Prematuros produzem pouco surfactante (pneumócitos tipo II imaturos). Sem ele, a tensão superficial colapsa os alvéolos a cada expiração, dificultando a reexpansão e as trocas gasosas.',
    },
    {
      enunciado:
        'Um pesquisador mede a pressão parcial de O2 (pO2) em diferentes pontos do sistema circulatório de um indivíduo em repouso e encontra os seguintes valores: ponto X = 40 mmHg e ponto Y = 100 mmHg. Com base nesses dados, é correto afirmar que:',
      alternativas: [
        'O ponto X corresponde ao sangue que sai dos pulmões (veia pulmonar) e o ponto Y ao sangue que chega aos pulmões (artéria pulmonar).',
        'Ambos os pontos pertencem ao circuito sistêmico, antes e após a passagem pelos tecidos.',
        'O ponto Y corresponde ao capilar alveolar após a hematose, e o ponto X ao sangue venoso que chega ao alvéolo.',
        'O ponto X indica sangue arterial rico em O2 e o ponto Y indica sangue venoso pobre em O2.',
        'A diferença de pO2 entre X e Y não é suficiente para promover difusão de O2 nos capilares.',
      ],
      correta: 2,
      explicacao:
        'pO2 ~100 mmHg é característico do capilar pulmonar após a hematose (e do sangue arterial sistêmico). pO2 ~40 mmHg é o sangue venoso que chega ao pulmão, após ceder O2 aos tecidos.',
    },
  ],
};
