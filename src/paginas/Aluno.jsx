// Páginas do aluno: painel inicial e histórico das justificativas enviadas.
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, FilePlus2, GraduationCap, Eye } from "lucide-react";
import { useStore, DOC_LABEL, fmtShort, fmt } from "../contextos/AuthContext";
import { Card, CourseIdentity, StatTile, StatusBadge, DOC_ICON, JustificationDetails } from "../componentes/DetalhesJustificativa";
import { NotifItem } from "../componentes/Notificacoes";
import { useState } from "react";
import { PageTitle } from "../componentes/Sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../componentes/ui/dialog";
import { cn } from "../componentes/ui/utils";
const campus = { url: "/assets/campus-natal.png" };

// ===== Painel inicial do aluno =====
export function AlunoInicio() {
  const s = useStore((x) => x);
  const me = s.users.find((u) => u.id === s.session);
  if (!me) return null;
  const courses = s.courses.filter((c) => c.students.includes(me.id));
  const mine = s.justifications.filter((j) => j.studentId === me.id);
  const count = (st) => mine.filter((j) => j.status === st).length;
  const notifs = s.notifications.filter((n) => n.userId === me.id).slice(0, 3);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-navy text-navy-foreground">
          <img
            src={campus.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/75 to-transparent" />
          <div className="relative p-6 md:p-8">
            <h1 className="text-2xl font-semibold md:text-3xl">Olá, {me.name} 👋</h1>
            <p className="mt-2 max-w-md text-sm opacity-90">
              Aqui você pode enviar suas justificativas de ausência, acompanhar o status e manter
              tudo organizado.
            </p>
          </div>
        </div>

        <Link
          to="/aluno/nova"
          className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-foreground/15">
            <FilePlus2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-semibold">Nova justificativa</div>
            <div className="text-sm opacity-85">
              Envie um atestado, declaração ou outro documento.
            </div>
          </div>
          <ChevronRight />
        </Link>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Minhas justificativas</h2>
            <Link to="/aluno/justificativas" className="text-sm font-medium text-primary">
              Ver todas
            </Link>
          </div>
          <div className="divide-y">
            {mine.slice(0, 5).map((j) => {
              const Icon = DOC_ICON[j.type];
              const c = s.courses.find((x) => x.id === j.courseId);
              return (
                <Link
                  to="/aluno/justificativas"
                  search={{ id: j.id }}
                  key={j.id}
                  className="flex items-center gap-3 py-3 hover:bg-muted/50"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{DOC_LABEL[j.type]}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c?.name} · {fmtShort(j.startDate)}
                      {j.days > 1 && ` → ${fmtShort(j.endDate)}`}
                    </div>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {fmt(j.createdAt)}
                  </span>
                  <StatusBadge status={j.status} />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 font-semibold">Minha situação</h2>
          <div className="grid grid-cols-4 gap-2">
            <StatTile
              label="Pendentes"
              value={count("pendente") + count("correcao")}
              tone="warning"
            />
            <StatTile label="Aprovadas" value={count("aprovada")} tone="success" />
            <StatTile label="Recusadas" value={count("recusada")} tone="danger" />
            <StatTile label="Total" value={mine.length} tone="primary" />
          </div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Meus cursos</h2>
              <p className="text-xs text-muted-foreground">{courses.length} cursos ativos</p>
            </div>
          </div>
          <div className="space-y-2">
            {courses.map((c) => (
              <div key={c.id} className="rounded-xl border p-3">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">Turma {c.shortCode}</div>
                <CourseIdentity petrobras={c.petrobras} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold">Últimas notificações</h2>
            <Link to="/aluno/notificacoes" className="text-sm font-medium text-primary">
              Ver todas
            </Link>
          </div>
          <div className="divide-y">
            {notifs.map((n) => (
              <NotifItem key={n.id} n={n} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ===== Minhas justificativas (lista + detalhes) =====
const TABS = [
  { k: "todas", l: "Todas" },
  { k: "pendente", l: "Pendentes" },
  { k: "aprovada", l: "Aprovadas" },
  { k: "recusada", l: "Recusadas" },
  { k: "correcao", l: "Correção" },
];
export function AlunoJustificativas() {
  // O id da justificativa aberta fica na barra de endereço (?id=...).
  const [params] = useSearchParams();
  const id = params.get("id") ?? undefined;
  const navigate = useNavigate();
  const [tab, setTab] = useState("todas");
  const s = useStore((x) => x);
  const mine = s.justifications.filter((j) => j.studentId === s.session);
  const list = tab === "todas" ? mine : mine.filter((j) => j.status === tab);
  const open = mine.find((j) => j.id === id);
  const setId = (v) => navigate(v ? `/aluno/justificativas?id=${v}` : "/aluno/justificativas");
  return (
    <div>
      <PageTitle
        title="Minhas justificativas"
        subtitle="Acompanhe o status de todas as suas justificativas."
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
              tab === t.k
                ? "bg-primary text-primary-foreground"
                : "border bg-card text-muted-foreground",
            )}
          >
            {t.l}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="hidden w-full text-sm md:table">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Envio</th>
              <th>Tipo</th>
              <th>Curso</th>
              <th>Período</th>
              <th>Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((j) => (
              <tr key={j.id} className="hover:bg-muted/40">
                <td className="p-3">{fmt(j.createdAt)}</td>
                <td>{DOC_LABEL[j.type]}</td>
                <td>{s.courses.find((c) => c.id === j.courseId)?.name}</td>
                <td>
                  {fmtShort(j.startDate)}
                  {j.days > 1 && ` → ${fmtShort(j.endDate)}`}
                </td>
                <td>
                  <StatusBadge status={j.status} />
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setId(j.id)}
                    className="rounded-lg p-2 text-primary hover:bg-accent"
                    aria-label="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="divide-y md:hidden">
          {list.map((j) => (
            <button
              key={j.id}
              onClick={() => setId(j.id)}
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{fmt(j.startDate)}</div>
                <div className="font-medium">{DOC_LABEL[j.type]}</div>
                <div className="text-xs text-muted-foreground">
                  {s.courses.find((c) => c.id === j.courseId)?.shortCode}
                </div>
              </div>
              <StatusBadge status={j.status} />
            </button>
          ))}
        </div>
        {list.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma justificativa aqui.
          </p>
        )}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setId(undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Justificativa #{open?.number}</DialogTitle>
          </DialogHeader>
          {open && <JustificationDetails j={open} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
