# Regras do Projeto - Urna Commit Jr.

## Regras de Versionamento e Commits
- **Obrigatório:** Toda nova feature, bug fix, refatoração, ajuste de layout ou alteração de configuração deve gerar um commit imediato e atômico.
- **Formato:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`).
- **Sem Segredos:** Nunca comitar senhas, tokens ou `.env` contendo credenciais reais.

## Regras de Interface e UX
- A aplicação não deve possuir barra de rolagem (vertical ou horizontal). O layout da urna deve caber em `100dvh` / `100vh` adaptável a smartphones, tablets e desktop.
- Manter a fidelidade à urna eletrônica real do Brasil: teclado com botões característicos, layout de tela, brasão e efeitos sonoros `tecla.mp3` e `fim.mp3`.

## Regras de Segurança e Backend
- As ações de administrador em `/admin` e rotas `/api/admin/*` devem exigir autenticação robusta.
- Não expor resultados de votação ou senhas no frontend público.
- Garantir voto único por eleitor através de cookies HttpOnly + LocalStorage sincronizados com o ciclo ativo da eleição.
