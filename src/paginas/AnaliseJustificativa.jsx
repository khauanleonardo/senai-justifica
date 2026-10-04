// Tela de análise: professor ou secretaria vê o documento e aprova, recusa ou pede correção.
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useStore, decide, fmtDateTime } from "../contextos/AuthContext";
import { Card, JustificationDetails } from "../componentes/DetalhesJustificativa";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../componentes/ui/dialog";

// ===== Análise feita pelo professor =====
export function AnaliseProfessor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const s = useStore((x) => x);
  const j = s.justifications.find((x) => x.id === id);
  const student = s.users.find((u) => u.id === j?.studentId);
  const course = s.courses.find((c) => c.id === j?.courseId);
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  if (!j)
    return (
      <p className="text-muted-foreground">
        Justificativa não encontrada.{" "}
        <Link to="/professor/justificativas" className="text-primary">
          Voltar
        </Link>
      </p>
    );
  const act = async (st, r) => {
    await decide(j.id, st, r);
    toast.success(
      st === "aprovada"
        ? "Justificativa aprovada"
        : st === "recusada"
          ? "Justificativa recusada"
          : "Correção solicitada",
      { description: `${student?.name} foi notificado(a).` },
    );
    setMode(null);
    setReason("");
    const nextPend = s.justifications.find(
      (x) =>
        x.id !== j.id &&
        x.status === "pendente" &&
        s.courses.some((c) => c.id === x.courseId && c.teacherId === s.session),
    );
    if (nextPend) navigate(`/professor/analise/${nextPend.id}`);
    else navigate("/professor/justificativas");
  };
  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => history.back()}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>
      <h1 className="mb-6 text-2xl font-semibold">Justificativa #{j.number}</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/60 p-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">
              {student?.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{student?.name}</div>
              <div className="text-xs text-muted-foreground">
                Turma {course?.code} · {student?.email}
              </div>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              Data de envio
              <div className="font-medium text-foreground">{fmtDateTime(j.createdAt)}</div>
            </div>
          </div>
          <JustificationDetails j={j} />
        </Card>
        <div>
          <Card className="lg:sticky lg:top-20">
            <h2 className="mb-3 font-semibold">Ações</h2>
            {j.status !== "pendente" && (
              <p className="mb-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                Esta justificativa já foi analisada. Você pode alterar a decisão.
              </p>
            )}
            <div className="space-y-2">
              <button
                onClick={() => act("aprovada")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 font-semibold text-primary-foreground hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                Aprovar
              </button>
              <button
                onClick={() => setMode("correcao")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-warning py-3 font-semibold text-primary-foreground hover:opacity-90"
              >
                <AlertTriangle className="h-4 w-4" />
                Solicitar correção
              </button>
              <button
                onClick={() => setMode("recusada")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-3 font-semibold text-destructive-foreground hover:opacity-90"
              >
                <X className="h-4 w-4" />
                Recusar
              </button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "recusada" ? "Recusar justificativa" : "Solicitar correção"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {[
              "Imagem ilegível",
              "Documento incompleto",
              "Datas divergentes",
              "CRM ausente ou inválido",
            ].map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="rounded-full border px-3 py-1 text-xs hover:bg-accent"
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Descreva o motivo para o aluno..."
            className="h-28 w-full rounded-xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <button onClick={() => setMode(null)} className="rounded-xl border px-4 py-2 text-sm">
              Cancelar
            </button>
            <button
              disabled={!mode || reason.trim().length < 3}
              onClick={() => mode && act(mode, reason.trim())}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Confirmar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Análise feita pela secretaria =====
export function AnaliseSecretaria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const s = useStore((x) => x);
  const j = s.justifications.find((x) => x.id === id);
  const student = s.users.find((u) => u.id === j?.studentId);
  const course = s.courses.find((c) => c.id === j?.courseId);
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  if (!j)
    return (
      <p className="text-muted-foreground">
        Justificativa não encontrada.{" "}
        <Link to="/secretaria/justificativas" className="text-primary">
          Voltar
        </Link>
      </p>
    );
  const act = async (st, r) => {
    await decide(j.id, st, r);
    toast.success(
      st === "aprovada"
        ? "Justificativa aprovada"
        : st === "recusada"
          ? "Justificativa recusada"
          : "Correção solicitada",
      { description: `${student?.name} foi notificado(a).` },
    );
    setMode(null);
    setReason("");
    const nextPend = s.justifications.find((x) => x.id !== j.id && x.status === "pendente");
    if (nextPend) navigate(`/secretaria/analise/${nextPend.id}`);
    else navigate("/secretaria/justificativas");
  };
  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => history.back()}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>
      <h1 className="mb-6 text-2xl font-semibold">Justificativa #{j.number}</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/60 p-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">
              {student?.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{student?.name}</div>
              <div className="text-xs text-muted-foreground">
                Turma {course?.shortCode} · {student?.email}
              </div>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              Data de envio
              <div className="font-medium text-foreground">{fmtDateTime(j.createdAt)}</div>
            </div>
          </div>
          <JustificationDetails j={j} />
        </Card>
        <div>
          <Card className="lg:sticky lg:top-20">
            <h2 className="mb-3 font-semibold">Ações</h2>
            {j.status !== "pendente" && (
              <p className="mb-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                Esta justificativa já foi analisada. Você pode alterar a decisão.
              </p>
            )}
            <div className="space-y-2">
              <button
                onClick={() => act("aprovada")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 font-semibold text-primary-foreground hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                Aprovar
              </button>
              <button
                onClick={() => setMode("correcao")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-warning py-3 font-semibold text-primary-foreground hover:opacity-90"
              >
                <AlertTriangle className="h-4 w-4" />
                Solicitar correção
              </button>
              <button
                onClick={() => setMode("recusada")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-3 font-semibold text-destructive-foreground hover:opacity-90"
              >
                <X className="h-4 w-4" />
                Recusar
              </button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "recusada" ? "Recusar justificativa" : "Solicitar correção"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {[
              "Imagem ilegível",
              "Documento incompleto",
              "Datas divergentes",
              "CRM ausente ou inválido",
            ].map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="rounded-full border px-3 py-1 text-xs hover:bg-accent"
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Descreva o motivo para o aluno..."
            className="h-28 w-full rounded-xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <button onClick={() => setMode(null)} className="rounded-xl border px-4 py-2 text-sm">
              Cancelar
            </button>
            <button
              disabled={!mode || reason.trim().length < 3}
              onClick={() => mode && act(mode, reason.trim())}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Confirmar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
