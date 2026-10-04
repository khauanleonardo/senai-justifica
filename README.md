# SENAI Justifica (React + JavaScript puro)

Sistema para alunos enviarem atestados/declarações e para professores e secretaria analisarem.

## Como rodar
1. Instale o Node.js (versão 20 ou mais nova).
2. Copie `.env.example` para `.env` e preencha com o endereço e a chave pública do banco.
3. No terminal, dentro da pasta: `npm install` e depois `npm run dev`.
4. Abra http://localhost:5173

## Organização
```
src/
  api.js                 -> conexão com o banco e todas as chamadas de dados
  App.jsx                -> rotas (react-router-dom)
  main.jsx               -> ponto de entrada
  styles.css             -> cores e tema
  componentes/
    RotaPrivada.jsx      -> protege as áreas que exigem login
    Sidebar.jsx          -> menu lateral, cabeçalho e conferência do perfil
    Notificacoes.jsx     -> lista de avisos
    DetalhesJustificativa.jsx -> logos, cartões, selos de status e detalhes do documento
    ui/                  -> peças visuais reutilizáveis (janela modal, avisos, utilitário de classes)
  contextos/
    AuthContext.jsx      -> login, sessão e perfis (Aluno, Professor, Secretaria)
  paginas/
    Login.jsx, Aluno.jsx, NovaJustificativa.jsx,
    Professor.jsx, AnaliseJustificativa.jsx, Secretaria.jsx
banco/                   -> scripts SQL que criam as tabelas e as regras de segurança
public/assets/           -> imagens (logos e foto do campus)
```

## Segurança
Quem pode ver ou alterar cada informação é decidido pelas regras do banco (arquivos em `banco/`),
não apenas pelas telas. Nunca coloque senhas ou chaves secretas no código.
