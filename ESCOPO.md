# 🗳️ Escopo e Especificação Técnica: Urna Eletrônica Commit Jr.

Este documento consolida e estrutura todos os requisitos, regras de negócio, especificações técnicas e diretrizes de desenvolvimento para o projeto da **Urna Eletrônica da Commit Jr.**

---

## 1. 📌 Visão Geral do Projeto

A **Urna Eletrônica Commit Jr.** é uma aplicação web desenvolvida para simular com fidelidade a experiência visual, auditiva e operacional da urna eletrônica brasileira durante os processos eleitorais internos da empresa júnior.

### Principais Objetivos
1. **Fidelidade à Urna Real:** Interface com teclado numérico, teclas de controle (BRANCO, CORRIGE, CONFIRMA), tela LCD estilizada, exibição de fotos e dados dos candidatos e reprodução dos efeitos sonoros característicos (`tecla.mp3` e `fim.mp3`).
2. **Usabilidade Sem Scroll:** Layout 100% adaptado a celulares, tablets e computadores, preenchendo a tela inteira (`100dvh`) sem barra de rolagem vertical ou horizontal, considerando a barra de navegação/URL de navegadores móveis.
3. **Controle Eleitoral Seguro:** Painel administrativo protegido em `/admin` para gerenciamento de candidatos, abertura/fechamento de eleição, acompanhamento de apuração em tempo real e reinicialização.
4. **Garantia de Voto Único:** Mecanismos de contenção para impedir que um mesmo eleitor vote mais de uma vez na mesma eleição ativa.
5. **Alta Concorrência:** Suporte para picos de aproximadamente 30 usuários simultâneos em janelas curtas (~5 minutos).

---

## 2. 👥 Perfis de Usuário e Jornadas

### 2.1. Eleitor (Acesso Público)
* **Acesso Simplificado:** O eleitor acessa a rota principal (`/`) sem necessidade de criar conta ou informar dados pessoais.
* **Fluxo de Votação:**
  1. Verificação se a eleição está aberta e se o dispositivo/navegador já votou na eleição ativa.
  2. Apresentação sequencial dos cargos a serem votados (ex.: Presidente, Vice-Presidente, Diretor de Gestão e Gente, etc.).
  3. Digitação dos dígitos no teclado virtual ou teclado físico.
  4. Reprodução imediata de som de tecla a cada dígito (`tecla.mp3`).
  5. Exibição da foto, nome e cargo do candidato correspondente ao número digitado.
  6. Opção de **Voto em Branco** (botão BRANCO), **Correção** (botão CORRIGE) ou **Confirmação** (botão CONFIRMA).
  7. Identificação de **Voto Nulo** caso o número digitado não corresponda a nenhum candidato cadastrado.
  8. Ao finalizar a confirmação do último cargo, transição para a tela clássica de **"FIM"** e reprodução do sinal sonoro oficial (`fim.mp3`).
  9. Bloqueio automático do eleitor para evitar votos duplicados.

### 2.2. Administrador (Painel Restrito `/admin`)
* **Autenticação:** Acesso protegido por senha mestra gerada de forma segura e validada no backend através de hash seguro.
* **Funcionalidades do Painel:**
  * **Status da Eleição:**
    * **Abrir Eleição:** Permite que eleitores acessem a urna e votem.
    * **Fechar Eleição:** Encerra a votação, trava o recebimento de novos votos e exibe o relatório final com ranking e estatísticas de apuração.
    * **Reiniciar Eleição:** Limpa todos os votos computados e redefine o ciclo eleitoral, permitindo que os eleitores votem novamente.
  * **Acompanhamento em Tempo Real:** Visualização de total de eleitores que votaram, votos por candidato, votos brancos e votos nulos.
  * **Gestão de Candidatos (CRUD):**
    * Listagem de todos os candidatos.
    * Cadastro de novos candidatos (Nome, Número, Cargo, Upload/URL da Foto).
    * Edição e exclusão de candidatos existentes.
    * Carga inicial pré-configurada a partir do arquivo de sementes (`candidatos.json`).

---

## 3. 🛠️ Arquitetura e Stack Tecnológica

| Componente | Tecnologia / Ferramenta | Descrição |
| :--- | :--- | :--- |
| **Framework Web** | Next.js (App Router) + React | Renderização rápida, rotas de API seguras e Server Components. |
| **Linguagem** | TypeScript | Tipagem estática rigorosa para garantir estabilidade e manutenibilidade. |
| **Estilização** | Tailwind CSS | Layout pixel-perfect, design responsivo com suporte a `h-dvh` e estética de urna eletrônica. |
| **Banco de Dados** | Neon PostgreSQL (Serverless) | Armazenamento relacional escalável e de baixa latência para votos e candidatos. |
| **ORM / Query Builder** | Drizzle ORM ou Prisma ORM | Modelagem tipada, migrações seguras e consultas eficientes. |
| **Áudio** | Web Audio API / HTML5 Audio | Pré-carregamento dos áudios (`tecla.mp3`, `fim.mp3`) para execução sem atraso perceptível. |
| **Autenticação Admin** | Iron Session / JWT / HttpOnly Cookie | Sessões administrativas seguras com proteção CSRF e sem exposição no client. |
| **Hospedagem & Deploy** | Vercel | Deploy contínuo com Serverless Functions e otimização de assets. |

---

## 4. 🔒 Requisitos Não-Funcionais e Segurança

1. **Proteção Contra Votos Múltiplos:**
   - Combinação de Cookie seguro (`HttpOnly`), `LocalStorage` e identificador de ciclo da eleição (`election_session_id`).
   - Registro anônimo de presença/hash de votação vinculado à eleição atual para bloquear requisições repetidas no backend.
2. **Sigilo do Voto:**
   - Os votos computados no banco de dados não devem guardar correlação com a identidade do eleitor.
3. **Segurança do Painel Admin:**
   - A senha de administrador deve ser configurada via variável de ambiente (`ADMIN_PASSWORD_HASH` ou gerada via script seguro de setup).
   - Nenhuma informação de votos parciais ou credenciais de admin deve vazar em rotas públicas ou no bundle do frontend.
   - Rotas de API que realizam mutação administrativa (abrir, fechar, resetar, alterar candidatos) devem validar autenticação estrita no backend.
4. **Performance e Concorrência:**
   - Suporte simultâneo a ~30 eleitores votando em um intervalo de 5 minutos sem degradação ou lock de banco de dados.
   - Assets estáticos (imagens de candidatos, brasão e arquivos de áudio) otimizados e servidos com cache via Next.js/CDN.
5. **Responsividade Estrita:**
   - O contêiner principal da urna deve utilizar `h-dvh` e `overflow-hidden`.
   - Adaptação dinâmica para telas verticais (smartphones) e horizontais (desktops/tablets), mantendo a proporção dos botões e legibilidade do display.

---

## 5. 🗄️ Modelagem de Dados

### 5.1. Tabela: `elections`
* `id` (UUID / Serial, PK)
* `title` (VARCHAR)
* `status` (ENUM: `'DRAFT'`, `'OPEN'`, `'CLOSED'`)
* `created_at` (TIMESTAMP)
* `opened_at` (TIMESTAMP, nullable)
* `closed_at` (TIMESTAMP, nullable)

### 5.2. Tabela: `candidates`
* `id` (UUID / Serial, PK)
* `election_id` (FK -> elections.id)
* `name` (VARCHAR)
* `number` (VARCHAR(5))
* `role` (VARCHAR) - Ex: Presidente, Vice-Presidente, Diretor de Gestão e Gente
* `photo_url` (VARCHAR)
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)

### 5.3. Tabela: `votes`
* `id` (UUID / Serial, PK)
* `election_id` (FK -> elections.id)
* `candidate_id` (FK -> candidates.id, nullable - nulo caso seja voto branco ou nulo)
* `role` (VARCHAR)
* `is_blank` (BOOLEAN)
* `is_null` (BOOLEAN)
* `created_at` (TIMESTAMP)

### 5.4. Tabela: `voter_records` (Auditoria e Controle de Voto Único)
* `id` (UUID / Serial, PK)
* `election_id` (FK -> elections.id)
* `voter_signature` (VARCHAR / Hash do dispositivo e sessão)
* `voted_at` (TIMESTAMP)

---

## 6. 📂 Organização dos Assets do Projeto

Os arquivos da pasta temporária `tmp/` devem ser distribuídos na estrutura final do Next.js:

* `public/assets/audio/tecla.mp3` - Som de acionamento das teclas numéricas e de ação.
* `public/assets/audio/fim.mp3` - Som de encerramento da votação.
* `public/assets/images/brasao.png` - Brasão da República / Commit Jr. presente na urna.
* `public/assets/candidates/andre_guilherme.jpeg` - Foto do candidato André Guilherme.
* `public/assets/candidates/arhur_cordeiro.jpeg` - Foto do candidato Arthur Cordeiro.
* `public/assets/candidates/joao_vitor.jpeg` - Foto do candidato João Vitor.
* `src/data/seed-candidatos.json` (ou script de seed de banco) - Dados iniciais dos candidatos.

> [!NOTE]
> Após a migração correta de todos os assets para suas pastas definitivas e validação de funcionamento, a pasta `tmp/` será removida.

---

## 7. 🗺️ Roadmap de Implementação

1. **Fase 1: Configuração Base e Infraestrutura**
   - Inicialização do projeto Next.js com TypeScript e Tailwind CSS.
   - Configuração de `.gitignore`, `.env.example`, `AGENTS.md` e regras de versionamento.
   - Configuração da conexão com o Neon PostgreSQL e ORM (Drizzle/Prisma).
   - Migração dos assets de `tmp/` para `public/`.

2. **Fase 2: Interface da Urna Eletrônica (Frontend)**
   - Construção do componente visual da urna eletrônica (layout responsivo `100dvh` sem scroll).
   - Componente do Teclado Numérico + Botões (BRANCO, CORRIGE, CONFIRMA).
   - Módulo de reprodução de áudio sem latência.
   - Máquina de estados da votação (cargos sequenciais, digitação, validação de número, confirmação, tela de FIM).

3. **Fase 3: Backend e Persistência de Votos**
   - Rotas de API para consulta de candidatos e cargos da eleição ativa.
   - Rota de submissão de voto com transação atômica e bloqueio de voto duplicado.
   - Middleware de controle de estado da eleição (aberta vs. fechada).

4. **Fase 4: Painel Administrativo (`/admin`)**
   - Autenticação e proteção de rotas administrativas.
   - Script para geração de hash de senha de admin.
   - Interface de controle da eleição (Abrir, Fechar, Reiniciar).
   - CRUD completo de candidatos (com suporte a upload ou seleção de imagem).
   - Dashboard de apuração em tempo real com ranking e gráficos.

5. **Fase 5: Testes, Otimizações e Deploy**
   - Testes de carga simulando 30 usuários simultâneos.
   - Validação em múltiplos dispositivos móveis e navegadores (iOS Safari, Android Chrome, Desktop).
   - Deploy na Vercel e homologação final.
