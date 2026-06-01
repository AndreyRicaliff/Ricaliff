# 06 — IaC: Introdução ao Terraform

## O que é

Infrastructure as Code (IaC) é provisionar e gerenciar infraestrutura por código versionado — não por cliques no painel. Hoje, se o servidor do Meet Hub morrer, você precisa lembrar quais passos fez no DigitalOcean para recriar tudo. Com IaC, você roda um comando e o servidor é recriado idêntico.

**Terraform** é a ferramenta IaC mais usada. Você descreve o estado desejado da infraestrutura em HCL (HashiCorp Configuration Language), e o Terraform calcula o diff entre o estado atual e o desejado (`plan`) e aplica as mudanças (`apply`).

```hcl
# main.tf — describe um Droplet no DigitalOcean
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token    # vem de .tfvars ou env var TF_VAR_do_token
}

resource "digitalocean_droplet" "meet_hub" {
  name   = "meet-hub-prod"
  size   = "s-2vcpu-4gb"     # $24/mês
  image  = "ubuntu-22-04-x64"
  region = "nyc3"
  ssh_keys = [var.ssh_key_id]
}

output "server_ip" {
  value = digitalocean_droplet.meet_hub.ipv4_address
}
```

```bash
terraform init    # baixa providers
terraform plan    # mostra o que vai mudar (sem aplicar)
terraform apply   # aplica as mudanças
terraform destroy # destrói tudo (cuidado)
```

**Terraform vs Pulumi vs Ansible:**
- **Terraform:** declarativo, HCL, state file, maior ecossistema — padrão do mercado
- **Pulumi:** mesmo conceito mas em linguagem real (TypeScript, Python) — útil se você odeia HCL
- **Ansible:** imperativo (procedural) — ótimo para configurar servidores existentes; fraco em provisionar novos recursos

---

## Por que cai em entrevista

- "O que é IaC e por que importa?"
- "Qual a diferença entre Terraform e Ansible?"
- "O que é um state file no Terraform?"
- "O que acontece se você perde o state file?"
- "Como você gerenciaria secrets no Terraform?"

---

## Trade-offs (quando usar X vs Y)

| Ferramenta | Quando usar | Custo |
|---|---|---|
| Terraform | Provisionar recursos em cloud (VMs, DNS, banco gerenciado) | Curva de aprendizado; state file precisa de backend remoto em equipe |
| Pulumi | Prefere escrever em TypeScript em vez de HCL | Menos maduro que Terraform; menor ecossistema |
| Ansible | Configurar servidor existente (instalar deps, configurar nginx) | Imperativo — mais difícil de raciocinar sobre estado |
| Scripts bash | Automação simples de 1 servidor | Sem idempotência; sem state tracking |
| Cliques manuais | Nunca em produção | Impossível de reproduzir; sem histórico |

**State file:** o Terraform guarda o estado atual da infra num arquivo `terraform.tfstate`. Se você destruir o state file sem destruir a infra, o Terraform acha que a infra não existe — ao rodar `apply`, tentará criar tudo de novo em paralelo com o que já existe. Em equipe, o state fica num backend remoto (S3, Terraform Cloud) para evitar conflito.

**Quando IaC NÃO vale:**
- Projeto solo com 1 servidor que nunca vai mudar — o overhead não compensa
- Protótipo de curta duração — mais rápido clicar
- Infra gerenciada por plataforma (Vercel, Railway, Supabase) — eles são o IaC deles próprios

**Sinal para adotar:** você está criando o mesmo tipo de servidor pela segunda vez, ou precisou recriar manualmente algo que destruiu sem intenção.

---

## Exercício aplicado (projeto AG real)

O Meet Hub está num Droplet do DigitalOcean criado manualmente. Vamos desenhar o Terraform mínimo que recriaria esse host — não para aplicar agora, mas para ter o músculo de pensar em IaC.

### Passo a passo

1. **Inventariar o que existe no servidor atual:**
   ```bash
   # Se tiver acesso SSH:
   ssh meet-hub "lscpu | grep 'CPU(s):'; free -h | head -2; df -h /"
   # Para descobrir o tamanho do Droplet:
   ssh meet-hub "cat /etc/digitalocean/metadata/v1.json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get(\"droplet\",{}).get(\"size_slug\",\"desconhecido\"))'" 2>/dev/null || echo "verificar no painel DO"
   ```

2. **Listar o que o Terraform precisaria provisionar:**
   Baseado no que você sabe do Meet Hub:
   - Droplet (VM): tamanho `s-2vcpu-4gb`, região NYC ou AMS, Ubuntu 22.04
   - SSH key: chave do Ricalfiff pré-cadastrada no DO
   - Firewall: portas 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API) abertas
   - DNS: subdomínio `meet-hub.agconsultorialtda.com` apontando para o IP (se existir zona DO)

3. **Escrever o `main.tf` mínimo (arquivo de treino — não aplicar):**
   ```bash
   mkdir -p ~/projetos/estudos/lab/terraform-meet-hub
   ```
   Crie `~/projetos/estudos/lab/terraform-meet-hub/main.tf` com:
   - Provider DigitalOcean
   - Resource `digitalocean_droplet` com nome, tamanho e imagem
   - Resource `digitalocean_firewall` com as portas corretas
   - Output com o IP criado
   - `variables.tf` com `do_token` e `ssh_key_id` como variáveis (sem valores — vêm de `.tfvars` ou env)

4. **Identificar o que falta para Terraform ser viável no AG hoje:**
   ```bash
   # Verificar se tem conta no Terraform Cloud ou backend para state:
   echo "Pergunta: onde ficaria o state file se dois devs usassem Terraform?"
   ```
   A resposta honesta: hoje é projeto solo. State file local funciona. Se entrar outro dev, precisa de backend remoto (S3 ou Terraform Cloud free tier).

5. **Registrar como nota de estudo (não DECISIONS.md — IaC ainda não foi adotado):**
   ```markdown
   # ~/projetos/estudos/lab/terraform-meet-hub/NOTES.md
   
   ## Por que ainda não adoptei Terraform no AG
   
   - Infra atual: 1 servidor Meet Hub (Droplet manual), Vercel para PULSAR-RH/AG Hub, Supabase gerenciado
   - Vercel e Supabase já são "IaC como serviço" — não precisam de Terraform
   - 1 Droplet manual: recriação manual uma vez por ano é aceitável
   
   ## Sinal para adotar Terraform
   
   - Plano de escala Meet Hub: 6 bots simultâneos pode exigir múltiplos Droplets
   - Se Hetzner for adotado: provisionar CX31 com Terraform seria 1 comando em vez de 10 cliques
   - Se entrar outro dev: infra precisa ser versionada
   
   ## O que este treino me deu
   
   - Entendo o ciclo init/plan/apply/destroy
   - Sei o que é state file e por que ele importa
   - Consigo ler e escrever HCL básico
   - Sei quando Ansible vs. Terraform (provisionar vs. configurar)
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que é IaC e por que importa?"
>
> **R (30s):**
> "IaC é gerenciar infraestrutura por código versionado. Sem IaC, você clica no painel para criar servidor, instala dependências manualmente, e quando o servidor morre você precisa lembrar o que fez. Com Terraform, você descreve o que quer em HCL, e `terraform apply` cria ou atualiza tudo de forma idempotente — mesma config, mesmo resultado. O benefício prático é: infra reproduzível, mudanças auditáveis no git, e rollback possível."

> **P:** "Qual a diferença entre Terraform e Ansible?"
>
> **R (30s):**
> "Terraform é declarativo: você descreve o estado desejado e ele calcula o que precisa mudar. Ótimo para provisionar recursos — criar VMs, configurar DNS, definir firewalls. Ansible é imperativo: você escreve uma sequência de passos para executar no servidor. Ótimo para configurar um servidor existente — instalar nginx, criar usuários, fazer deploy.
>
> Na prática: Terraform cria o servidor, Ansible configura o servidor. Muitas equipes usam os dois juntos."

---

## Checkpoint

- [ ] Sei o que é IaC e por que é importante com exemplo real
- [ ] Entendo o ciclo `init → plan → apply → destroy`
- [ ] Sei o que é state file e o que acontece se ele for perdido
- [ ] Escrevi um `main.tf` mínimo para o Meet Hub (mesmo que de exercício, não aplicado)
- [ ] Sei quando Terraform vs Ansible vs nenhum dos dois

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — IaC e Terraform introdução dominado`.

---

## Recursos

- HashiCorp — [Terraform Getting Started](https://developer.hashicorp.com/terraform/tutorials/aws-get-started) (use o DigitalOcean tutorial em vez do AWS)
- DigitalOcean — [Terraform Provider](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
- Gruntwork — [Terraform Up & Running](https://www.terraformupandrunning.com/) (cap. 1-2 para fundamento)
- Ansible docs — [Getting Started](https://docs.ansible.com/ansible/latest/getting_started/)
- Código de referência: `~/projetos/estudos/lab/terraform-meet-hub/main.tf` (arquivo de exercício criado neste módulo)
