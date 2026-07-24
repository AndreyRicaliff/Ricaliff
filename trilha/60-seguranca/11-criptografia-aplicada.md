# 11 — Criptografia Aplicada

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte
> primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Você não vai inventar criptografia — a regra número um é literalmente **"nunca invente sua própria cripto"**. E ela não é folclore: tem uma razão teórica de 1883 que a maioria dos devs repete sem saber de onde vem. O que você precisa saber é **qual primitiva usar pra qual problema** e não confundir três coisas que júnior mistura o tempo todo — encoding, hashing e encryption. Confundi-las é o crime clássico da segurança amadora, e é o que este módulo mata.

---

## § BASE — o fundamento

**Por que não inventar a própria cripto — Kerckhoffs (1883) e Shannon (1949).** Auguste Kerckhoffs, em *La Cryptographie Militaire* (1883), formulou o princípio que rege criptografia até hoje: **um sistema deve permanecer seguro mesmo que tudo sobre ele, exceto a chave, seja de conhecimento público.** Claude Shannon, em *Communication Theory of Secrecy Systems* (1949) — o paper que fundou a criptografia moderna — reafirmou isso como a **máxima de Shannon**: *"the enemy knows the system"* (o inimigo conhece o sistema). A consequência é direta e brutal: **a segurança tem que morar na chave, nunca no sigilo do algoritmo.** Um algoritmo secreto é falsa sensação de segurança — no dia em que alguém faz engenharia reversa (e sempre faz), o sistema inteiro cai. Por isso os algoritmos que você usa — AES, SHA-2 — são **públicos e analisados pelo mundo inteiro** há décadas: sobreviveram ao ataque de todos. Sua cripto caseira sobreviveu ao ataque de ninguém. "Não invente sua própria cripto" *é* o princípio de Kerckhoffs aplicado: você não tem como analisar seu algoritmo contra o mundo, então usa o que já foi.

**Encoding ≠ Hashing ≠ Encryption.** A confusão mais comum e mais cara:

- **Encoding** (base64, URL-encode) — transformação reversível **sem segredo**. Serve pra transportar bytes, não pra proteger nada. `base64` de uma senha *é* a senha, só que ilegível pra humano — qualquer um decodifica. Tratar base64 como "criptografado" é o crime clássico.
- **Hashing** — função de mão única: `hash(x)` é fácil, `x` a partir do hash é inviável. Serve pra *verificar sem guardar o original* (senha) e *detectar alteração* (integridade). Não tem volta — é o ponto.
- **Encryption** — reversível **com a chave**: `encrypt(x, k)` e `decrypt(c, k)`. Serve pra guardar/transmitir dado que você precisa **recuperar** depois.

A pergunta que separa hash de encryption é: **preciso recuperar o valor original ou só verificar?** Verificar → hash (senha: comparo, nunca recupero). Recuperar → encryption (um token que preciso ler de volta). Confundir os dois é confundir "verificar" com "recuperar".

**Hash de senha é uma categoria à parte — Provos & Mazières (1999).** Não use SHA-256 pra senha: ele é *rápido demais*, e velocidade é exatamente o que o atacante quer pra testar bilhões de tentativas por segundo. Niels Provos e David Mazières, em *A Future-Adaptable Password Scheme* (USENIX, 1999) — o paper que introduziu o **bcrypt** — deram o argumento decisivo: como o hardware fica mais rápido a cada ano (Moore), qualquer hash de custo *fixo* vira quebrável com o tempo. A solução é um **work factor ajustável**: o custo é `2^c` iterações, então aumentar `c` em 1 **dobra** o trabalho do atacante — e você sobe `c` conforme o hardware evolui, mantendo o hash caro de atacar *para sempre*. Cada senha leva um **salt** único (contra rainbow tables), que bcrypt/argon2 já embutem no hash. Regra de bolso que resume o paper inteiro: **se o hash de senha é instantâneo, está errado** — a lentidão é a feature.

**Política de senha moderna — NIST SP 800-63B.** O que exigir do usuário mudou: o SP 800-63B (Digital Identity Guidelines) diz pra priorizar **comprimento sobre complexidade** (passphrases longas > `P@ssw0rd!`), **não** forçar rotação periódica (só troca quando há evidência de comprometimento — rotação forçada gera senhas piores e previsíveis), e **conferir contra listas de senhas vazadas**. Regra de composição obrigatória ("precisa de 1 maiúscula, 1 símbolo") está fora — atrapalha mais que ajuda.

**Simétrico vs assimétrico, e o TLS 1.3 (RFC 8446).** Simétrico (**AES**): uma chave cifra e decifra — rápido, ideal pra dado em repouso. Assimétrico (**RSA/ECC**): par pública/privada — a pública cifra, só a privada decifra; base de assinatura digital e da *troca de chaves* do TLS. Na prática o TLS usa assimétrico só pra **combinar** uma chave simétrica e daí conversa em AES (o melhor dos dois). O **TLS 1.3 (RFC 8446, 2018)** entrega confidencialidade + integridade em trânsito via cifras **AEAD**, handshake em 1-RTT, e — o ganho central — **forward secrecy obrigatória**: a troca de chaves é sempre efêmera (o TLS 1.3 removeu o key exchange estático de RSA), então tráfego capturado hoje continua ilegível mesmo se a chave de longo prazo vazar amanhã. O que o TLS **não** faz: proteger dado em repouso — pra isso é encryption-at-rest no banco.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A escolha da primitiva nasce de uma pergunta só — "o que eu preciso fazer com esse dado?":

```
         "o que preciso fazer com o dado?"
                     │
   ┌─────────────────┼──────────────────────┬───────────────────┐
   ▼                 ▼                       ▼                   ▼
só transportar   VERIFICAR sem         VERIFICAR uma        RECUPERAR
bytes (sem       guardar o original    SENHA                depois (com chave)
proteger)        (integridade)                                   │
   │                 │                       │            ┌───────┴────────┐
   ▼                 ▼                       ▼            ▼                ▼
ENCODING          HASHING              HASH LENTO      em repouso     em trânsito
(base64)          (SHA-256)            (bcrypt/argon2  AES-GCM        TLS 1.3
NÃO protege       mão única           + salt + custo   (simétrico)   (assim.→ AES)
                                       ajustável)
```

E a camada onde o segredo mora define o mecanismo:

```
Dado EM TRÂNSITO  → TLS 1.3 (RFC 8446): confidencialidade + integridade + forward secrecy
Dado EM REPOUSO   → encryption-at-rest (AES-GCM) — TLS não cobre isto
Senha             → NUNCA guardar; hash lento (verificar) OU melhor: OAuth (não guardar nada)
```

---

## § METODOLOGIA — o passo-a-passo replicável

**1. CLASSIFICAR o problema** com a pergunta única: transportar, verificar-sem-guardar, verificar-senha ou recuperar-depois? A resposta *é* a primitiva.

**2. NUNCA inventar — usar o padrão.** AES-GCM pra cifrar, bcrypt/argon2 pra senha, TLS pra trânsito. Kerckhoffs: você usa o que o mundo já analisou.

**3. Pra SENHA: hash lento + salt único + custo ajustável + política moderna.** bcrypt/argon2 (não SHA-256), work factor calibrado pra ~250ms, salt embutido, e as regras do SP 800-63B (comprimento, sem rotação forçada, checar contra vazados). Melhor ainda: OAuth, pra não guardar senha nenhuma.

**4. Pra RECUPERAR: AES-GCM com disciplina de chave e nonce.** Chave fora do código (módulo 12), **nonce único por operação** — reusar nonce em GCM quebra o esquema inteiro.

**5. TLS em todo trânsito; encryption-at-rest pro repouso.** São camadas diferentes; uma não substitui a outra.

**Anti-padrões:**
- **Inventar a própria cripto.** Viola Kerckhoffs; falsa segurança que cai na primeira engenharia reversa.
- **SHA-256 (ou MD5) pra senha.** Rápido demais = presente pro atacante. Senha pede hash *lento*.
- **base64 como "criptografia".** Encoding não protege nada; é reversível sem segredo.
- **Reusar nonce/IV**, ou usar **modo ECB** (blocos iguais viram cifra igual — o "pinguim ECB" clássico). AES-GCM com nonce único.
- **Guardar o que você só precisa verificar.** Se nunca vai recuperar, hash — não encryption. Menos superfície de vazamento.
- **Segredo/chave no código.** Chave versionada é chave vazada (módulo 12/14).

---

## Passo-a-passo aplicado (faça agora, ~20min)

Senha e verificação com bcrypt, e a prova de que "instantâneo = errado":

```ts
import bcrypt from 'bcrypt';

// cadastro: nunca guardar a senha, só o hash lento com salt embutido
const hash = await bcrypt.hash(senhaPlana, 12);   // 12 = work factor (2^12 iterações)
await db.usuarios.insert({ email, senha_hash: hash });

// login: comparar sem nunca reverter o hash
const ok = await bcrypt.compare(senhaTentada, usuario.senha_hash);
```

```ts
// prove o argumento de Provos & Mazières: custo cresce exponencial com o work factor
for (const c of [8, 12, 14]) {
  const t = Date.now();
  await bcrypt.hash('senha-teste', c);
  console.log(`custo ${c}: ${Date.now() - t}ms`);   // ~cada +2 no custo ≈ 4× o tempo
}
// custo 8 ≈ instantâneo (ERRADO pra senha) · custo 12 ≈ ~250ms (o alvo)
```

**Na prática AG, o melhor hash de senha é nenhum** — os apps usam OAuth (Google), o que elimina a gestão de senha por design (A07 do módulo 01). O melhor jeito de proteger senha é não guardar senha. Mas você precisa saber o mecanismo pra defender a escolha e pros casos onde OAuth não serve.

## Por que cai em entrevista

"Como você armazena senhas?" é filtro instantâneo: quem diz "hash com SHA-256" já reprovou (rápido demais); quem diz "bcrypt/argon2 com salt e work factor" passa. E "diferença entre hashing e encryption" pega quem decorou palavra sem entender: hash não tem volta, encryption tem — confundir os dois é confundir "verificar" com "recuperar".

> **P:** "Como você guarda a senha do usuário no banco?"
>
> **R (30s):** "Não guardo a senha — guardo um hash lento. Uso bcrypt ou argon2 com salt único por senha e work factor ajustável, nunca SHA-256, que é rápido demais e ajuda o atacante a testar bilhões de tentativas. Se o hash de senha é instantâneo, está errado. E hash porque é mão única: eu só preciso *verificar* no login comparando, nunca *recuperar* a senha original — se eu conseguisse recuperar, seria encryption, e seria a escolha errada. Na real, nos meus apps a resposta é OAuth: não gerir senha nenhuma é a defesa mais forte."

> **P (nova):** "Por que não se deve inventar a própria criptografia?"
>
> **R (30s):** "Por causa do princípio de Kerckhoffs, de 1883, que o Shannon reafirmou em 1949 como 'o inimigo conhece o sistema': um sistema seguro tem que continuar seguro mesmo que o atacante saiba tudo, menos a chave. A segurança mora na chave, nunca no sigilo do algoritmo — porque algoritmo secreto é falsa segurança, cai na primeira engenharia reversa, e sempre tem engenharia reversa. É por isso que AES e SHA-2 são públicos e analisados pelo mundo inteiro há décadas: sobreviveram ao ataque de todo mundo. Minha cripto caseira sobreviveu ao ataque de ninguém — eu não tenho como saber que ela é segura. Então eu uso a primitiva padrão que já passou por esse escrutínio, e coloco meu esforço em proteger a chave, que é onde a segurança de verdade está."

## Checkpoint

- [ ] Explico o princípio de Kerckhoffs / máxima de Shannon e por que ele proíbe "cripto caseira"
- [ ] Distingo encoding, hashing e encryption pela pergunta "verificar ou recuperar?"
- [ ] Explico por que base64 não protege nada
- [ ] Sei por que senha usa bcrypt/argon2 e não SHA-256, e o argumento do custo ajustável (Provos & Mazières)
- [ ] Explico salt, work factor e a política moderna de senha (SP 800-63B: comprimento, sem rotação forçada)
- [ ] Sei o que o TLS 1.3 protege (trânsito + forward secrecy) e o que ele NÃO protege (repouso)

## Recursos

- **Kerckhoffs (1883) — *La Cryptographie Militaire*** e **Shannon (1949) — *Communication Theory of Secrecy Systems***: a máxima que proíbe cripto caseira (fonte primária da §BASE)
- **Provos & Mazières (1999) — *A Future-Adaptable Password Scheme* (USENIX)**: o paper do bcrypt e o argumento do work factor ajustável
- **RFC 8446 — TLS 1.3**: cifras AEAD, forward secrecy obrigatória, handshake 1-RTT
- **NIST SP 800-63B — Digital Identity Guidelines**: política de senha moderna (comprimento, sem rotação forçada, checar vazados)
- **OWASP — Password Storage Cheat Sheet** e **Cryptographic Storage Cheat Sheet**: parâmetros práticos de bcrypt/argon2 e AES
- "Cryptographic Right Answers" — Latacora: qual primitiva usar pra cada problema; **MDN — Web Crypto API**
