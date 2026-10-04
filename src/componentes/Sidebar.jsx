// Estrutura compartilhada das áreas: menu, cabeçalho, saída e conferência do perfil ativo.
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Bell, Home, FilePlus2, FileText, GraduationCap, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { useStore, refresh, logout } from "../contextos/AuthContext";
import { Logo } from "./DetalhesJustificativa";
import { cn } from "./ui/utils";
const NAV = {
  aluno: [
    { to: "/aluno", label: "Início", icon: Home, exact: true },
    { to: "/aluno/nova", label: "Nova justificativa", icon: FilePlus2 },
    { to: "/aluno/justificativas", label: "Minhas justificativas", icon: FileText },
    { to: "/aluno/notificacoes", label: "Notificações", icon: Bell },
  ],
  professor: [
    { to: "/professor", label: "Início", icon: Home, exact: true },
    { to: "/professor/justificativas", label: "Justificativas", icon: FileText },
    { to: "/professor/turmas", label: "Minhas turmas", icon: Users },
    { to: "/professor/notificacoes", label: "Notificações", icon: Bell },
  ],
  secretaria: [
    { to: "/secretaria", label: "Início", icon: Home, exact: true },
    { to: "/secretaria/justificativas", label: "Justificativas", icon: FileText },
    { to: "/secretaria/alunos", label: "Alunos e turmas", icon: Users },
    { to: "/secretaria/notificacoes", label: "Notificações", icon: Bell },
  ],
};
const ROLE_LABEL = { aluno: "Aluno", professor: "Professor", secretaria: "Secretaria" };
const ROLE_AREA = {
  aluno: "Área do aluno",
  professor: "Área do professor",
  secretaria: "Área da secretaria",
};
const ROLE_HOME = { aluno: "/aluno", professor: "/professor", secretaria: "/secretaria" };
export function AppShell({ role }) {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const ready = useStore((s) => s.ready);
  const user = useStore((s) => s.users.find((u) => u.id === s.session));
  const notifs = useStore((s) => s.notifications);
  const mine = notifs.filter((n) => n.userId === user?.id);
  const unread = mine.filter((n) => !n.read).length;
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (!user) navigate("/", { replace: true });
    else if (user.role !== role) navigate(ROLE_HOME[user.role], { replace: true });
  }, [ready, user, role, navigate]);
  // real-time toast for new notifications
  const seen = useRef(null);
  useEffect(() => {
    if (!user) return;
    if (!seen.current) {
      seen.current = new Set(mine.map((n) => n.id));
      return;
    }
    for (const n of mine)
      if (!seen.current.has(n.id)) {
        seen.current.add(n.id);
        if (!n.read) toast(n.title, { description: n.body });
      }
  }, [mine, user]);
  if (!ready || !user || user.role !== role)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Carregando sua área…
      </div>
    );
  const items = NAV[role];
  const active = (to, exact) => (exact ? path === to : path.startsWith(to));
  const notifTo = `${ROLE_HOME[role]}/notificacoes`;
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <div className="px-2 py-3">
          <Logo light />
        </div>
        <nav className="mt-6 flex-1 space-y-1">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active(it.to, it.exact)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent",
              )}
            >
              <it.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              <span className="flex-1">{it.label}</span>
              {it.label === "Notificações" && unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 border-t border-sidebar-border px-2 pt-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {user.name.replace("Prof. ", "")[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="text-xs opacity-70">{ROLE_LABEL[role]}</div>
          </div>
          <button
            aria-label="Sair"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="rounded-lg p-2 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            SENAI-RN · {ROLE_AREA[role]}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={notifTo}
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Link>
            <button
              aria-label="Sair"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent md:hidden"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card md:hidden">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[11px]",
              active(it.to, it.exact) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <it.icon className="h-5 w-5" />
            {it.label.split(" ")[0]}
            {it.label === "Notificações" && unread > 0 && (
              <span className="absolute right-[30%] top-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Link>
        ))}
      </nav>
      <Toaster position="top-right" richColors />
    </div>
  );
}
export function PageTitle({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export { GraduationCap };
