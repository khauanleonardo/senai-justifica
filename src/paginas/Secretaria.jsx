// Páginas da secretaria: painel inicial, todas as justificativas e cadastro de alunos/turmas.
import { Link, useNavigate } from "react-router-dom";
import { Users, Clock, CheckCircle2, XCircle, ChevronRight, BookOpen, Eye } from "lucide-react";
import { useStore, DOC_LABEL, fmtShort, fmt, STATUS_LABEL } from "../contextos/AuthContext";
import { Card, CourseIdentity, StatusBadge } from "../componentes/DetalhesJustificativa";
import { useState } from "react";
import { PageTitle } from "../componentes/Sidebar";
import { cn } from "../componentes/ui/utils";

// ===== Painel inicial da secretaria =====
export function SecretariaInicio() {
  const s = useStore((x) => x);
  const me = s.users.find((u) => u.id === s.session);
  if (!me) return null;
  const js = s.justifications;
  const pend = js.filter((j) => j.status === "pendente");
  const students = s.users.filter((u) => u.role === "aluno");
  const stats = [
    { l: "Alunos", v: students.length, I: Users, c: "bg-accent text-primary" },
    { l: "Turmas", v: s.courses.length, I: BookOpen, c: "bg-accent text-primary" },
    { l: "Pendentes", v: pend.length, I: Clock, c: "bg-warning-soft text-warning" },
    {
      l: "Aprovadas",
      v: js.filter((j) => j.status === "aprovada").length,
      I: CheckCircle2,
      c: "bg-success-soft text-success",
    },
    {
      l: "Recusadas",
      v: js.filter((j) => j.status === "recusada").length,
      I: XCircle,
      c: "bg-danger-soft text-destructive",
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Olá, {me.name} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral de todas as justificativas da unidade.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ l, v, I, c }) => (
          <Card key={l} className="flex items-center gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${c}`}>
              <I className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{l}</div>
              <div className="font-display text-2xl font-bold">{v}</div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Pendentes de análise</h2>
            <Link to="/secretaria/justificativas" className="text-sm font-medium text-primary">
              Ver todas
            </Link>
          </div>
          {pend.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma justificativa pendente. 🎉
            </p>
          )}
          <div className="divide-y">
            {pend.map((j) => {
              const st = s.users.find((u) => u.id === j.studentId);
              const c = s.courses.find((x) => x.id === j.courseId);
              return (
                <Link
                  key={j.id}
                  to={`/secretaria/analise/${j.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-muted/40"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {st?.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{st?.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {DOC_LABEL[j.type]} · {c?.shortCode} · {fmtShort(j.startDate)}
                      {j.days > 1 && ` → ${fmtShort(j.endDate)}`}
                    </div>
                  </div>
                  <StatusBadge status={j.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Turmas</h2>
          <div className="space-y-3">
            {s.courses.map((c) => (
              <div key={c.id} className="rounded-xl border p-3">
                <div className="text-sm font-semibold">{c.shortCode}</div>
                <div className="text-xs text-muted-foreground">{c.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.students.length} aluno(s) ·{" "}
                  {js.filter((j) => j.courseId === c.id && j.status === "pendente").length}{" "}
                  pendente(s)
                </div>
                <CourseIdentity petrobras={c.petrobras} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ===== Todas as justificativas =====
const TABS = [
  { k: "pendente", l: "Pendentes" },
  { k: "todas", l: "Todas" },
  { k: "aprovada", l: "Aprovadas" },
  { k: "recusada", l: "Recusadas" },
  { k: "correcao", l: "Correção" },
];
export function SecretariaJustificativas() {
  const s = useStore((x) => x);
  const [tab, setTab] = useState("pendente");
  const [course, setCourse] = useState("all");
  const all = s.justifications.filter((j) => course === "all" || j.courseId === course);
  const list = tab === "todas" ? all : all.filter((j) => j.status === tab);
  return (
    <div>
      <PageTitle
        title="Justificativas"
        subtitle="Todas as justificativas enviadas pelos alunos da unidade."
      >
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="h-10 rounded-xl border bg-card px-3 text-sm"
        >
          <option value="all">Todas as turmas</option>
          {s.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortCode}
            </option>
          ))}
        </select>
      </PageTitle>
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
            {t.l} ({t.k === "todas" ? all.length : all.filter((j) => j.status === t.k).length})
          </button>
        ))}
      </div>
      <div className="divide-y overflow-hidden rounded-2xl border bg-card">
        {list.map((j) => {
          const st = s.users.find((u) => u.id === j.studentId);
          const c = s.courses.find((x) => x.id === j.courseId);
          return (
            <Link
              key={j.id}
              to={`/secretaria/analise/${j.id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 hover:bg-muted/40 md:grid-cols-[2fr_2fr_1fr_1fr_auto_auto]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{st?.name}</div>
                <div className="text-xs text-muted-foreground">
                  #{j.number} · enviada {fmt(j.createdAt)}
                </div>
              </div>
              <div className="hidden md:block text-sm">{DOC_LABEL[j.type]}</div>
              <div className="hidden md:block text-sm text-muted-foreground">{c?.shortCode}</div>
              <div className="hidden md:block text-sm">
                {fmtShort(j.startDate)}
                {j.days > 1 && ` → ${fmtShort(j.endDate)}`}
              </div>
              <StatusBadge status={j.status} />
              <Eye className="hidden h-4 w-4 text-primary md:block" />
            </Link>
          );
        })}
        {list.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">Nada por aqui.</p>
        )}
      </div>
    </div>
  );
}

// ===== Alunos e turmas =====
export function SecretariaAlunos() {
  const s = useStore((x) => x);
  const students = s.users.filter((u) => u.role === "aluno");
  return (
    <div>
      <PageTitle
        title="Alunos e turmas"
        subtitle="Todos os alunos da unidade e suas turmas vinculadas."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {s.courses.map((c) => {
          const teacher = s.users.find((u) => u.id === c.teacherId);
          return (
            <Card key={c.id}>
              <div className="mb-3">
                <div className="font-semibold">
                  {c.shortCode} · {c.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Professor: {teacher?.name} · {c.students.length} aluno(s)
                </div>
                <CourseIdentity petrobras={c.petrobras} />
              </div>
              <div className="divide-y">
                {c.students.map((sid) => {
                  const st = students.find((u) => u.id === sid);
                  const js = s.justifications.filter(
                    (j) => j.studentId === sid && j.courseId === c.id,
                  );
                  const pend = js.filter((j) => j.status === "pendente").length;
                  return (
                    <div key={sid} className="flex items-center gap-3 py-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
                        {st?.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{st?.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{st?.email}</div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {js.length} justificativa(s)
                        {pend > 0 && (
                          <div className="font-medium text-warning">{pend} pendente(s)</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">Resumo por aluno</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Aluno</th>
                <th className="pb-2 pr-4 font-medium">Turmas</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Pendentes</th>
                <th className="pb-2 pr-4 font-medium">Aprovadas</th>
                <th className="pb-2 font-medium">Recusadas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((st) => {
                const js = s.justifications.filter((j) => j.studentId === st.id);
                const turmas = s.courses
                  .filter((c) => c.students.includes(st.id))
                  .map((c) => c.shortCode)
                  .join(", ");
                const count = (k) => js.filter((j) => j.status === k).length;
                return (
                  <tr key={st.id}>
                    <td className="py-2.5 pr-4 font-medium">{st.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{turmas}</td>
                    <td className="py-2.5 pr-4">{js.length}</td>
                    <td className="py-2.5 pr-4">{count("pendente")}</td>
                    <td className="py-2.5 pr-4">{count("aprovada")}</td>
                    <td className="py-2.5">
                      {count("recusada") + count("correcao") > 0
                        ? `${count("recusada")} / ${count("correcao")} ${STATUS_LABEL.correcao.toLowerCase()}`
                        : "0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
