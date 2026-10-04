// =====================================================================
// RotaPrivada.jsx — protege as áreas internas.
// Quem não está logado volta para o login; quem tem outro perfil é
// levado para a própria área. O menu (Sidebar) faz essa conferência.
// =====================================================================
import { AppShell } from "./Sidebar";

export default function RotaPrivada({ perfil }) {
  // AppShell carrega a sessão, confere o perfil e desenha o menu + a página atual.
  return <AppShell role={perfil} />;
}
