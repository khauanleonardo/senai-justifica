// Páginas do aluno: painel inicial e histórico das justificativas enviadas.
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  FilePlus2,
  GraduationCap,
  Eye,
  Pencil,
  Trash2,
  Send,
  CloudUpload,
  AlertCircle,
} from "lucide-react";
import {
  useStore,
  DOC_LABEL,
  fmtShort,
  fmt,
  updateJustification,
  deleteJustification,
} from "../contextos/AuthContext";
import {
  Card,
  CourseIdentity,
  StatTile,
  StatusBadge,
  DOC_ICON,
  JustificationDetails,
} from "../componentes/DetalhesJustificativa";
import { NotifItem } from "../componentes/Notificacoes";
import { useState } from "react";
import { PageTitle } from "../componentes/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../componentes/ui/dialog";
import { cn } from "../componentes/ui/utils";
import { toast } from "sonner";

const campus = { url: "/assets/campus-natal.png" };

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
              const Icon = DOC_ICON[j.type] ?? FilePlus2;
              const c = s.courses.find((x) => x.id === j.courseId);
              return (
                <Link
                  to={`/aluno/justificativas?id=${j.id}`}
                  key={j.id}
                  className="flex items-center gap-3 py-3 hover:bg-muted/50"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{DOC_LABEL[j.type] ?? j.type}</div>
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

const TABS = [
  { k: "todas", l: "Todas" },
  { k: "pendente", l: "Pendentes" },
  { k: "aprovada", l: "Aprovadas" },
  { k: "recusada", l: "Recusadas" },
  { k: "correcao", l: "Correção" },
];

export function AlunoJustificativas() {
  const [params] = useSearchParams();
  const id = params.get("id") ?? undefined;
  const navigate = useNavigate();
  const [tab, setTab] = useState("todas");
  const s = useStore((x) => x);
  const mine = s.justifications.filter((j) => j.studentId === s.session);
  const list = tab === "todas" ? mine : mine.filter((j) => j.status === tab);
  const open = mine.find((j) => j.id === id);

  const setId = (v) => navigate(v ? `/aluno/justificativas?id=${v}` : "/aluno/justificativas");

  const [justificativaParaExcluir, setJustificativaParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [justificativaParaEditar, setJustificativaParaEditar] = useState(null);

  const confirmarExclusao = async () => {
    if (!justificativaParaExcluir) return;
    setExcluindo(true);
    try {
      await deleteJustification(
        justificativaParaExcluir.id,
        justificativaParaExcluir.documentPath,
      );
      toast.success("Justificativa removida com sucesso!");
      setJustificativaParaExcluir(null);
      if (open?.id === justificativaParaExcluir.id) {
        setId(undefined);
      }
    } catch (err) {
      toast.error("Erro ao remover justificativa", {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde.",
      });
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageTitle
        title="Minhas justificativas"
        subtitle="Acompanhe o status, edite justificativas recusadas ou envie novos documentos."
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
              tab === t.k
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
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
            {list.map((j) => {
              const podeModificar = j.status === "recusada" || j.status === "correcao";
              return (
                <tr key={j.id} className="hover:bg-muted/40">
                  <td className="p-3">{fmt(j.createdAt)}</td>
                  <td>{DOC_LABEL[j.type] ?? j.type}</td>
                  <td>{s.courses.find((c) => c.id === j.courseId)?.name}</td>
                  <td>
                    {fmtShort(j.startDate)}
                    {j.days > 1 && ` → ${fmtShort(j.endDate)}`}
                  </td>
                  <td>
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setId(j.id)}
                        className="rounded-lg p-2 text-primary hover:bg-accent"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {podeModificar && (
                        <>
                          <button
                            onClick={() => setJustificativaParaEditar(j)}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            title="Editar e reenviar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setJustificativaParaExcluir(j)}
                            className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                            title="Remover justificativa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="divide-y md:hidden">
          {list.map((j) => {
            const podeModificar = j.status === "recusada" || j.status === "correcao";
            return (
              <div key={j.id} className="p-4">
                <div
                  onClick={() => setId(j.id)}
                  className="flex cursor-pointer items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{fmt(j.startDate)}</div>
                    <div className="font-medium">{DOC_LABEL[j.type] ?? j.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.courses.find((c) => c.id === j.courseId)?.shortCode}
                    </div>
                  </div>
                  <StatusBadge status={j.status} />
                </div>
                {podeModificar && (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t pt-2">
                    <button
                      onClick={() => setJustificativaParaEditar(j)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => setJustificativaParaExcluir(j)}
                      className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {list.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma justificativa encontrada nesta categoria.
          </p>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setId(undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Justificativa #{open?.number}</DialogTitle>
          </DialogHeader>
          {open && (
            <JustificationDetails
              j={open}
              onEditar={(just) => {
                setId(undefined);
                setJustificativaParaEditar(just);
              }}
              onRemover={(just) => {
                setJustificativaParaExcluir(just);
              }}
              onOutra={() => {
                navigate("/aluno/nova");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Remover com a mensagem solicitada */}
      <Dialog
        open={!!justificativaParaExcluir}
        onOpenChange={(o) => !o && setJustificativaParaExcluir(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-destructive/15 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg">
              Você tem certeza que quer remover essa justificativa?
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-sm text-muted-foreground">
            <p>
              O documento anexado{" "}
              <span className="font-semibold text-foreground">
                "{justificativaParaExcluir?.fileName}"
              </span>{" "}
              e todos os dados desta justificativa serão apagados permanentemente.
            </p>
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-center">
            <button
              type="button"
              disabled={excluindo}
              onClick={() => setJustificativaParaExcluir(null)}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={excluindo}
              onClick={confirmarExclusao}
              className="rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {excluindo ? "Removendo..." : "Sim, remover"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      {justificativaParaEditar && (
        <ModalEditarJustificativa
          justificativa={justificativaParaEditar}
          onClose={() => setJustificativaParaEditar(null)}
        />
      )}
    </div>
  );
}

function ModalEditarJustificativa({ justificativa, onClose }) {
  const s = useStore((x) => x);
  const courses = s.courses.filter(
    (c) => Boolean(s.session) && c.students.includes(s.session ?? ""),
  );

  const [form, setForm] = useState({
    courseId: justificativa.courseId,
    type: justificativa.type,
    startDate: justificativa.startDate,
    endDate: justificativa.endDate,
    doctor: justificativa.doctor || "",
    crmNum: (justificativa.crm || "").split("/")[0] || "",
    crmUf: (justificativa.crm || "").split("/")[1] || "RN",
    notes: justificativa.notes || "",
  });

  const [novoArquivo, setNovoArquivo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const isMed = form.type === "atestado";
  const up = (k, v) => setForm({ ...form, [k]: v });

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return setErro("Informe as datas de início e término.");
    if (new Date(form.endDate) < new Date(form.startDate))
      return setErro("A data de término deve ser igual ou posterior ao início.");

    setErro("");
    setSalvando(true);
    try {
      await updateJustification(
        justificativa.id,
        {
          courseId: form.courseId,
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          doctor: isMed ? form.doctor.trim() : undefined,
          crm: isMed && form.crmNum ? `${form.crmNum}/${form.crmUf}` : undefined,
          notes: form.notes.trim() || undefined,
          documentName: novoArquivo ? novoArquivo.name : justificativa.fileName,
        },
        novoArquivo,
        justificativa.documentPath,
      );
      toast.success("Justificativa atualizada e enviada para nova análise!");
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar justificativa.");
    } finally {
      setSalvando(false);
    }
  };

  const inputCls =
    "h-10 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Justificativa #{justificativa.number}</DialogTitle>
        </DialogHeader>

        {justificativa.reason && (
          <div className="rounded-xl border border-destructive/20 bg-danger-soft p-3 text-xs text-destructive">
            <b>Motivo informado pelo revisor:</b> {justificativa.reason}
          </div>
        )}

        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium">Curso / Turma</label>
            <select
              className={inputCls}
              value={form.courseId}
              onChange={(e) => up("courseId", e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Turma {c.shortCode}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Data de início</label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) => up("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Data de término</label>
              <input
                type="date"
                className={inputCls}
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => up("endDate", e.target.value)}
              />
            </div>
          </div>

          {isMed && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Nome do médico</label>
                <input
                  className={inputCls}
                  placeholder="Nome do profissional"
                  value={form.doctor}
                  onChange={(e) => up("doctor", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">CRM</label>
                  <input
                    className={inputCls}
                    placeholder="12345"
                    value={form.crmNum}
                    onChange={(e) => up("crmNum", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">UF</label>
                  <select
                    className={inputCls}
                    value={form.crmUf}
                    onChange={(e) => up("crmUf", e.target.value)}
                  >
                    {["RN", "PB", "PE", "CE", "BA", "SP", "RJ", "MG", "Outra"].map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium">Observações / Esclarecimento</label>
            <textarea
              className={cn(inputCls, "h-20 py-2")}
              placeholder="Explique as alterações ou adicione novas observações..."
              value={form.notes}
              onChange={(e) => up("notes", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Substituir documento (opcional)
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-accent/40 p-3 text-xs text-primary hover:bg-accent">
              <CloudUpload className="h-4 w-4" />
              <span>
                {novoArquivo ? novoArquivo.name : "Clique para anexar um novo arquivo (se necessário)"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => setNovoArquivo(e.target.files?.[0] || null)}
              />
            </label>
            {novoArquivo && (
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Novo arquivo selecionado</span>
                <button
                  type="button"
                  onClick={() => setNovoArquivo(null)}
                  className="text-destructive hover:underline"
                >
                  Cancelar troca
                </button>
              </div>
            )}
            {!novoArquivo && (
              <div className="mt-1 text-xs text-muted-foreground">
                Arquivo atual mantido: <span className="font-medium">{justificativa.fileName}</span>
              </div>
            )}
          </div>

          {erro && <p className="text-xs text-destructive">{erro}</p>}

          <DialogFooter className="flex gap-2">
            <button
              type="button"
              disabled={salvando}
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar e reenviar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
