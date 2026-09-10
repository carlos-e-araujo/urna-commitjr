# 🤖 Diretrizes para Agentes de IA (AGENTS.md)

Este repositório contém o código da **Urna Eletrônica Commit Jr.** Todas as IAs, agentes autônomos e desenvolvedores que atuarem neste projeto devem seguir rigorosamente as diretrizes abaixo.

---

## 1. 🎯 Regra de Ouro: Versionamento Contínuo e Commits Atômicos

> **IMPORTANTE**: Toda e qualquer nova funcionalidade (`feat`), correção de bug (`fix`), refatoração (`refactor`), ajuste de estilo (`style`), configuração (`chore`) ou documentação (`docs`) **DEVE SER COMMITADA** assim que concluída e validada.

### Padrão de Mensagens de Commit (Conventional Commits)
Utilize mensagens claras no padrão convencional:
- `feat: <descrição>` - Nova funcionalidade implementada
- `fix: <descrição>` - Correção de erro ou bug
- `refactor: <descrição>` - Refatoração de código sem alteração de comportamento externo
- `style: <descrição>` - Ajustes visuais, CSS, formatação
- `docs: <descrição>` - Alterações ou adições em documentação (`ESCOPO.md`, `README.md`, etc.)
- `chore: <descrição>` - Configuração de build, dependências, scripts ou arquivos de ambiente

**Exemplos:**
```bash
git add ESCOPO.md AGENTS.md .gitignore .agents/
git commit -m "docs: define escopo do projeto e diretrizes para agentes de IA"
```

---

## 2. 🧱 Stack Tecnológica e Padrões

- **Framework:** Next.js (App Router) + React
- **Linguagem:** TypeScript (modo estrito, tipagem explícita onde relevante)
- **Estilização:** Tailwind CSS
- **Banco de Dados:** Neon PostgreSQL
- **Hospedagem:** Vercel

---

## 3. 📐 Princípios de Design e UI/UX

1. **Sem Scroll:** O layout da urna deve ocupar exatamente a viewport (`100dvh`, `overflow-hidden`), funcionando perfeitamente em mobile (levando em conta a barra de navegação/URL), tablet e desktop.
2. **Fidelidade Visual:** A urna deve replicar as proporções, cores, botões e fontes características da urna eletrônica brasileira.
3. **Feedback Sonoro Instantâneo:** Todos os toques/teclas devem disparar o áudio `tecla.mp3` e a finalização deve disparar `fim.mp3` sem atraso.

---

## 4. 🔐 Segurança e Boas Práticas

1. **Proteção de Dados e Segredos:**
   - **Nunca** commitar arquivos `.env` com senhas ou URLs de produção.
   - Manter sempre atualizado o `.env.example`.
2. **Isolamento Administrativo:**
   - O painel `/admin` deve ser estritamente protegido por autenticação no backend.
   - Não expor parciais de votação nem senhas no bundle do frontend para não-admins.
3. **Garantia de Voto Único:**
   - Implementar validação multicamada (Cookie HttpOnly + LocalStorage + Hash/Sessão da Eleição).

---

## 5. 📂 Estrutura de Diretórios Recomendada

```
urna-commitjr/
├── .agents/                 # Regras e contexto especializado para agentes de IA
├── public/
│   └── assets/
│       ├── audio/           # tecla.mp3, fim.mp3
│       ├── candidates/      # fotos dos candidatos
│       └── images/          # brasao.png e logos
├── src/
│   ├── app/                 # Next.js App Router (rotas /, /admin, /api)
│   ├── components/          # Componentes reutilizáveis (Urna, Teclado, Display, etc.)
│   ├── lib/                 # Utilitários, conexão com banco (Neon), auth
│   ├── types/               # Tipos TypeScript compartilhados
│   └── data/                # Seeds e dados iniciais
├── .env.example             # Exemplo de variáveis de ambiente
├── .gitignore               # Arquivos ignorados pelo Git
├── AGENTS.md                # Este documento de diretrizes
└── ESCOPO.md                # Especificação completa do projeto
```

---

## 6. 🔄 Checklist de Execução para Agentes

Ao receber uma tarefa:
1. [ ] Consultar [ESCOPO.md](file:///home/carlos/Projects/urna-commitjr/ESCOPO.md) para garantir conformidade com os requisitos.
2. [ ] Desenvolver a alteração focando em simplicidade, tipagem e estabilidade.
3. [ ] Testar localmente (compilação TypeScript, ausência de linter errors, visual sem scroll).
4. [ ] Realizar `git add` dos arquivos alterados.
5. [ ] Realizar `git commit` com mensagem descritiva no padrão Conventional Commits.
