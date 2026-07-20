# 11 — Criptografia Aplicada

## O que é

Você não vai inventar criptografia — a regra número um é literalmente **"nunca invente sua própria cripto"**, porque o algoritmo você acerta, mas a implementação (timing, padding, geração de nonce) tem armadilhas que quebraram até especialistas. O que você precisa é saber **qual primitiva usar pra qual problema** e não confundir três coisas que júnior mistura o tempo todo:

**Encoding ≠ Hashing ≠ Encryption.** A confusão mais comum e mais cara:

- **Encoding** (base64, URL-encode) — transformação reversível **sem segredo**. Serve pra transportar bytes, não pra proteger nada. `base64` de uma senha é a senha, só que ilegível pra humano — qualquer um decodifica. Tratar base64 como "criptografado" é o crime clássico de segurança amadora.
- **Hashing** — função de mão única: `hash(x)` é fácil, `x a partir do hash` é inviável. Serve pra *verificar sem guardar o original* (senha) e pra *detectar alteração* (integridade). Não tem volta — é o ponto.
- **Encryption** — reversível **com a chave**. `encrypt(x, k)` e `decrypt(c, k)`. Serve pra guardar/transmitir dado que você precisa recuperar depois.

**Hash de senha é uma categoria à parte.** Não use SHA-256 pra senha — ele é *rápido demais*, e velocidade é o que o atacante quer pra testar bilhões de tentativas. Use **bcrypt** ou **argon2**: são deliberadamente lentos e têm *work factor* ajustável (você aumenta o custo conforme o hardware evolui). Cada senha leva um **salt** único (contra rainbow tables) — que bcrypt/argon2 já embutem no hash. Regra de bolso: se o hash de senha é instantâneo, está errado.

**Simétrico vs assimétrico.** Simétrico (AES): uma chave para cifrar e decifrar — rápido, para dados em repouso. Assimétrico (RSA/ECC): par pública/privada — a pública cifra, só a privada decifra; base de TLS e assinatura digital. Na prática, TLS usa assimétrico só pra *trocar* uma chave simétrica e daí conversa em AES (o melhor dos dois).

### Passo-a-passo: senha e verificação

```ts
import bcrypt from 'bcrypt';

// cadastro: nunca guardar a senha, só o hash lento com salt embutido
const hash = await bcrypt.hash(senhaPlana, 12);   // 12 = work factor
await db.usuarios.insert({ email, senha_hash: hash });

// login: comparar sem nunca reverter o hash
const ok = await bcrypt.compare(senhaTentada, usuario.senha_hash);
```

**Na prática AG, o melhor hash de senha é nenhum** — os apps usam OAuth (Google), o que elimina a gestão de senha por design (A07 do módulo 01). O melhor jeito de proteger senha é não guardar senha. Mas você precisa saber o mecanismo pra defender a escolha e pra qualquer caso onde OAuth não serve.

**TLS por baixo:** todo tráfego em produção é HTTPS — não-negociável (A02). Você não implementa TLS, mas entende o que ele dá: confidencialidade (ninguém no meio lê) e integridade (ninguém no meio altera) em trânsito. Ele **não** protege dado em repouso — pra isso é encryption-at-rest no banco.

## Por que cai em entrevista

"Como você armazena senhas?" é filtro instantâneo: quem diz "hash com SHA-256" já reprovou (rápido demais); quem diz "bcrypt/argon2 com salt e work factor" passa. E "diferença entre hashing e encryption" pega quem decorou palavra sem entender: hash não tem volta, encryption tem — confundir os dois é confundir "verificar" com "recuperar".

> **P:** "Como você guarda a senha do usuário no banco?"
>
> **R (30s):** "Não guardo a senha — guardo um hash lento. Uso bcrypt ou argon2 com salt único por senha e work factor ajustável, nunca SHA-256, que é rápido demais e ajuda o atacante a testar bilhões de tentativas. Se o hash de senha é instantâneo, está errado. E hash porque é mão única: eu só preciso *verificar* no login comparando, nunca *recuperar* a senha original — se eu conseguisse recuperar, seria encryption, e seria a escolha errada. Na real, nos meus apps a resposta é OAuth: não gerir senha nenhuma é a defesa mais forte."

## Checkpoint

- [ ] Distingo encoding, hashing e encryption e dou o uso correto de cada
- [ ] Explico por que base64 não protege nada
- [ ] Sei por que senha usa bcrypt/argon2 e não SHA-256 (velocidade é inimiga)
- [ ] Explico salt e work factor e por que o hash de senha deve ser lento
- [ ] Sei o que TLS protege (trânsito) e o que ele NÃO protege (repouso)

## Recursos

- [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP — Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [MDN — Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- "Cryptographic Right Answers" — Latacora (guia de qual primitiva usar)
