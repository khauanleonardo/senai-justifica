// =====================================================================
// App.jsx — mapa de rotas (endereços) do sistema com react-router-dom.
// Cada área fica dentro de <RotaPrivada>, que exige login e o perfil certo.
// =====================================================================
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RotaPrivada from "./componentes/RotaPrivada";
import { NotificationsPage } from "./componentes/Notificacoes";
import Login from "./paginas/Login";
import { AlunoInicio, AlunoJustificativas } from "./paginas/Aluno";
import NovaJustificativa from "./paginas/NovaJustificativa";
import { ProfessorInicio, ProfessorJustificativas, ProfessorTurmas } from "./paginas/Professor";
import { SecretariaInicio, SecretariaJustificativas, SecretariaAlunos } from "./paginas/Secretaria";
import { AnaliseProfessor, AnaliseSecretaria } from "./paginas/AnaliseJustificativa";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tela de login (pública) */}
        <Route path="/" element={<Login />} />

        {/* Área do aluno */}
        <Route path="/aluno" element={<RotaPrivada perfil="aluno" />}>
          <Route index element={<AlunoInicio />} />
          <Route path="nova" element={<NovaJustificativa />} />
          <Route path="justificativas" element={<AlunoJustificativas />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
        </Route>

        {/* Área do professor */}
        <Route path="/professor" element={<RotaPrivada perfil="professor" />}>
          <Route index element={<ProfessorInicio />} />
          <Route path="justificativas" element={<ProfessorJustificativas />} />
          <Route path="turmas" element={<ProfessorTurmas />} />
          <Route path="analise/:id" element={<AnaliseProfessor />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
        </Route>

        {/* Área da secretaria */}
        <Route path="/secretaria" element={<RotaPrivada perfil="secretaria" />}>
          <Route index element={<SecretariaInicio />} />
          <Route path="justificativas" element={<SecretariaJustificativas />} />
          <Route path="alunos" element={<SecretariaAlunos />} />
          <Route path="analise/:id" element={<AnaliseSecretaria />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
        </Route>

        {/* Qualquer endereço desconhecido volta para o login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
