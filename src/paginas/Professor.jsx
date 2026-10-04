// Páginas do professor: painel inicial, lista de justificativas das turmas e lista de turmas.
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Users, Clock, CheckCircle2, XCircle, ChevronRight, FileText, Eye } from "lucide-react";
import { useStore, DOC_LABEL, fmtShort, fmt } from "../contextos/AuthContext";
import { Card, StatusBadge } from "../componentes/DetalhesJustificativa";
import { PageTitle } from "../componentes/Sidebar";
import { cn } from "../componentes/ui/utils";

// ===== Painel inicial do professor =====
export function ProfessorInicio() {
  const s = useStore((x) => x);
  const me = s.users.find((u) => u.id === s.session);
  if (!me) return null;
  const courses = s.courses.filter((c) => c.teacherId === me.id);
  const [cid, setCid] = useState(courses[0]?.id ?? "");
  const course = courses.find((c) => c.id === cid);
  const js = s.justifications.filter((j) => j.courseId === cid);
  const pend = js.filter((j) => j.status === "pendente");
  const stats = [
    { l: "Alunos", v: course?.students.length ?? 0, I: Users, c: "bg-accent text-primary" },
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
          <p className="mt-1 text-sm text-muted-foreground">Aqui está o resumo da sua turma.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Turma:
          <select
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            className="h-10 rounded-xl border bg-card px-3"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ l, v, I, c }) => (
          <Card key={l} className="flex items-center gap-4">
            <div className={`grid h-12 w-12 place-items-center rounded-full ${c}`}>
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
            <h2 className="font-semibold">Fila de análise</h2>
            <Link to="/professor/justificativas" className="text-sm font-medium text-primary">
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
              return (
                <Link
                  key={j.id}
                  to={`/professor/analise/${j.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-muted/40"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {st?.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{st?.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {DOC_LABEL[j.type]} · {fmtShort(j.startDate)}
                      {j.days > 1 && ` → ${fmtShort(j.endDate)}`} · {j.days} dia(s)
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
          <h2 className="mb-3 font-semibold">Ações rápidas</h2>
          <div className="space-y-2">
            <Link
              to="/professor/justificativas"
              className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
            >
              <FileText className="h-4 w-4" />
              Ver todas as justificativas
            </Link>
            <Link
              to="/professor/turmas"
              className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
            >
              <Users className="h-4 w-4" />
              Relatório da turma
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ===== Justificativas das turmas do professor =====
const TABS = [
  { k: "pendente", l: "Pendentes" },
  { k: "todas", l: "Todas" },
  { k: "aprovada", l: "Aprovadas" },
  { k: "recusada", l: "Recusadas" },
  { k: "correcao", l: "Correção" },
];
export function ProfessorJustificativas() {
  const s = useStore((x) => x);
  const [tab, setTab] = useState("pendente");
  const [course, setCourse] = useState("all");
  const myCourses = s.courses.filter((c) => c.teacherId === s.session);
  const all = s.justifications.filter(
    (j) =>
      myCourses.some((c) => c.id === j.courseId) && (course === "all" || j.courseId === course),
  );
  const list = tab === "todas" ? all : all.filter((j) => j.status === tab);
  return (
    <div>
      <PageTitle
        title="Justificativas"
        subtitle="Analise as justificativas enviadas pelos alunos das suas turmas."
      >
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="h-10 rounded-xl border bg-card px-3 text-sm"
        >
          <option value="all">Todas as turmas</option>
          {myCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
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
              to={`/professor/analise/${j.id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 hover:bg-muted/40 md:grid-cols-[2fr_2fr_1fr_1fr_auto_auto]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{st?.name}</div>
                <div className="text-xs text-muted-foreground">
                  #{j.number} · enviada {fmt(j.createdAt)}
                </div>
              </div>
              <div className="hidden md:block text-sm">{DOC_LABEL[j.type]}</div>
              <div className="hidden md:block text-sm text-muted-foreground">{c?.code}</div>
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

// ===== Minhas turmas =====
export function ProfessorTurmas() {
  const s = useStore((x) => x);
  const courses = s.courses.filter((c) => c.teacherId === s.session);
  return (
    <div>
      <PageTitle title="Minhas turmas" subtitle="Relatório de justificativas por aluno." />
      <div className="space-y-6">
        {courses.map((c) => (
          <Card key={c.id}>
            <h2 className="font-semibold">
              {c.name}{" "}
              <span className="text-sm font-normal text-muted-foreground">· Turma {c.code}</span>
            </h2>
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Aluno</th>
                  <th>Enviadas</th>
                  <th>Aprovadas</th>
                  <th>Dias justificados</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {c.students.map((sid) => {
                  const u = s.users.find((x) => x.id === sid);
                  const js = s.justifications.filter(
                    (j) => j.studentId === sid && j.courseId === c.id,
                  );
                  const ap = js.filter((j) => j.status === "aprovada");
                  return (
                    <tr key={sid}>
                      <td className="py-2.5 font-medium">{u?.name}</td>
                      <td>{js.length}</td>
                      <td>{ap.length}</td>
                      <td>{ap.reduce((a, j) => a + j.days, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}
