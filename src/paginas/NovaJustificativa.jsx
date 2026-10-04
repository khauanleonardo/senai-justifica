// Formulário em etapas para o aluno enviar um novo atestado ou declaração com o documento anexado.
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CloudUpload, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useStore, submitJustification, DOC_LABEL } from "../contextos/AuthContext";
import { DOC_ICON, DocPreview, Field, Card } from "../componentes/DetalhesJustificativa";
import { cn } from "../componentes/ui/utils";

// ===== Formulário de nova justificativa =====
const TYPES = [
  { k: "atestado", d: "Envio de atestado médico com CID ou sem CID." },
  { k: "declaracao", d: "Consulta, exame, etc." },
  { k: "alistamento", d: "Documento de alistamento ou seleção." },
  { k: "compromisso", d: "Trabalho, justiça, etc." },
  { k: "outro", d: "Outros tipos de justificativa." },
];
const STEPS = ["Tipo", "Informações", "Documento", "Revisar"];
const SPECS = [
  "Clínico Geral",
  "Pediatria",
  "Ortopedia",
  "Odontologia",
  "Dermatologia",
  "Ginecologia",
  "Oftalmologia",
  "Psiquiatria",
  "Outra",
];
const UFS = ["RN", "PB", "PE", "CE", "BA", "SP", "RJ", "MG", "Outra"];
const inputCls =
  "h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
export default function NovaJustificativa() {
  const navigate = useNavigate();
  const s = useStore((x) => x);
  const courses = s.courses.filter(
    (c) => Boolean(s.session) && c.students.includes(s.session ?? ""),
  );
  const [step, setStep] = useState(0);
  const [type, setType] = useState(null);
  const [f, setF] = useState({
    courseId: courses[0]?.id ?? "",
    withCid: false,
    cid: "",
    startDate: "",
    endDate: "",
    doctor: "",
    crmNum: "",
    crmUf: "RN",
    specialty: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [raw, setRaw] = useState(null);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState([]);
  const up = (k, v) => setF({ ...f, [k]: v });
  const days =
    f.startDate && f.endDate
      ? Math.max(0, Math.round((+new Date(f.endDate) - +new Date(f.startDate)) / 864e5) + 1)
      : 0;
  const isMed = type === "atestado";
  const validate = () => {
    if (step === 0 && !type) return ["Selecione o tipo de justificativa."];
    if (step === 1) {
      const e = [];
      if (!f.courseId) e.push("Selecione o curso/turma.");
      if (!f.startDate || !f.endDate) e.push("Informe as datas de início e término.");
      else if (days <= 0) e.push("A data de término deve ser igual ou posterior ao início.");
      else if (days > 60) e.push("Período máximo de 60 dias.");
      if (isMed) {
        if (f.doctor.trim().length < 3) e.push("Informe o nome do médico.");
        if (!/^\d{3,7}$/.test(f.crmNum)) e.push("CRM deve ter de 3 a 7 números.");
        if (!f.specialty) e.push("Selecione a especialidade.");
        if (f.withCid && !/^[A-Za-z]\d{2}(\.\d)?$/.test(f.cid.trim()))
          e.push("CID inválido (ex: J11 ou J11.1).");
      }
      return e;
    }
    if (step === 2 && !file) return ["Anexe a foto ou PDF do documento."];
    return [];
  };
  const next = () => {
    const e = validate();
    setErrors(e);
    if (!e.length) setStep(step + 1);
  };
  const onFile = (fl) => {
    if (!fl) return;
    if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/.test(fl.type))
      return setErrors(["Formato não aceito. Use JPG, PNG ou PDF."]);
    if (fl.size > 5 * 1024 * 1024) return setErrors(["Arquivo maior que 5 MB."]);
    const r = new FileReader();
    r.onload = () => {
      setRaw(fl);
      setFile({ fileName: fl.name, fileType: fl.type, fileData: r.result, fileSize: fl.size });
      setErrors([]);
    };
    r.readAsDataURL(fl);
  };
  const send = async () => {
    if (!raw || sending) return;
    setSending(true);
    try {
      if (!type) return;
      const id = await submitJustification(
        {
          courseId: f.courseId,
          type,
          withCid: isMed ? f.withCid : undefined,
          cid: isMed && f.withCid ? f.cid.toUpperCase() : undefined,
          startDate: f.startDate,
          endDate: f.endDate,
          days,
          doctor: isMed ? f.doctor.trim() : undefined,
          crm: isMed ? `${f.crmNum}/${f.crmUf}` : undefined,
          specialty: isMed ? f.specialty : undefined,
          notes: f.notes.trim() || undefined,
        },
        raw,
      );
      toast.success("Justificativa enviada!", {
        description: "O professor foi notificado automaticamente.",
      });
      navigate(`/aluno/justificativas?id=${id}`);
    } catch (e) {
      toast.error("Não foi possível enviar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSending(false);
    }
  };
  const course = courses.find((c) => c.id === f.courseId);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Nova justificativa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Preencha as informações abaixo para enviar sua justificativa.
      </p>

      <ol className="my-6 flex items-center gap-2">
        {STEPS.map((l, i) => (
          <li key={l} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold",
                i < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === step
                    ? "border-primary text-primary"
                    : "text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:block",
                i === step ? "font-semibold text-primary" : "text-muted-foreground",
              )}
            >
              {l}
            </span>
            {i < STEPS.length - 1 && (
              <span className={cn("h-0.5 flex-1 rounded", i < step ? "bg-primary" : "bg-border")} />
            )}
          </li>
        ))}
      </ol>

      <Card className="p-5 md:p-7">
        {step === 0 && (
          <>
            <h2 className="mb-4 font-semibold">1. Qual o motivo da sua ausência?</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TYPES.map((t) => {
                const Icon = DOC_ICON[t.k];
                const sel = type === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setType(t.k)}
                    className={cn(
                      "relative rounded-2xl border-2 p-4 text-left transition",
                      sel ? "border-primary bg-accent" : "hover:border-primary/40",
                    )}
                  >
                    {sel && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={cn("font-semibold", sel && "text-primary")}>
                      {DOC_LABEL[t.k]}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.d}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="mb-4 font-semibold">
              2. Informações {isMed ? "do atestado" : "do documento"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <L label="Curso / Turma" full>
                <select
                  className={inputCls}
                  value={f.courseId}
                  onChange={(e) => up("courseId", e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Turma {c.shortCode}
                    </option>
                  ))}
                </select>
              </L>
              <L label="Data de início">
                <input
                  type="date"
                  className={inputCls}
                  value={f.startDate}
                  onChange={(e) => up("startDate", e.target.value)}
                />
              </L>
              <L label="Data de término">
                <input
                  type="date"
                  className={inputCls}
                  value={f.endDate}
                  min={f.startDate}
                  onChange={(e) => up("endDate", e.target.value)}
                />
              </L>
              <L label="Quantidade de dias">
                <div className={cn(inputCls, "flex items-center bg-muted")}>
                  {days || "—"} {days ? (days > 1 ? "dias" : "dia") : ""}
                </div>
              </L>
              {isMed && (
                <>
                  <L label="Atestado possui CID?">
                    <div className="grid grid-cols-2 gap-2">
                      {[false, true].map((v) => (
                        <button
                          type="button"
                          key={String(v)}
                          onClick={() => up("withCid", v)}
                          className={cn(
                            "h-11 rounded-xl border text-sm font-medium",
                            f.withCid === v ? "border-primary bg-accent text-primary" : "",
                          )}
                        >
                          {v ? "Com CID" : "Sem CID"}
                        </button>
                      ))}
                    </div>
                  </L>
                  {f.withCid && (
                    <L label="CID">
                      <input
                        className={inputCls}
                        maxLength={6}
                        placeholder="Ex: J11"
                        value={f.cid}
                        onChange={(e) => up("cid", e.target.value)}
                      />
                    </L>
                  )}
                  <L label="Nome do médico" full>
                    <input
                      className={inputCls}
                      maxLength={100}
                      placeholder="Digite o nome do profissional"
                      value={f.doctor}
                      onChange={(e) => up("doctor", e.target.value)}
                    />
                  </L>
                  <L label="CRM">
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        inputMode="numeric"
                        maxLength={7}
                        placeholder="12345"
                        value={f.crmNum}
                        onChange={(e) => up("crmNum", e.target.value.replace(/\D/g, ""))}
                      />
                      <select
                        className={cn(inputCls, "w-24")}
                        value={f.crmUf}
                        onChange={(e) => up("crmUf", e.target.value)}
                      >
                        {UFS.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </L>
                  <L label="Especialidade">
                    <select
                      className={inputCls}
                      value={f.specialty}
                      onChange={(e) => up("specialty", e.target.value)}
                    >
                      <option value="">Selecione a especialidade</option>
                      {SPECS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </L>
                </>
              )}
              <L label="Observação (opcional)" full>
                <textarea
                  className={cn(inputCls, "h-24 py-2")}
                  maxLength={500}
                  placeholder="Ex: Consulta médica."
                  value={f.notes}
                  onChange={(e) => up("notes", e.target.value)}
                />
              </L>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-1 font-semibold">3. Anexar documento</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Envie uma foto ou PDF do seu documento.
            </p>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files[0]);
              }}
              className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-primary/40 bg-accent/40 p-10 text-center hover:bg-accent"
            >
              <CloudUpload className="mb-3 h-10 w-10 text-primary" />
              <span className="font-medium">Toque para selecionar ou arraste o arquivo aqui</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, PDF · Tamanho máximo: 5 MB
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
            {file && (
              <div className="relative mt-4">
                <DocPreview j={file} />
                <button
                  onClick={() => setFile(null)}
                  aria-label="Remover"
                  className="absolute -right-2 -top-2 rounded-full bg-card p-1 shadow"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        {step === 3 && type && (
          <>
            <h2 className="mb-4 font-semibold">4. Revise seus dados</h2>
            <div className="space-y-4">
              <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                <Field
                  label="Tipo"
                  value={
                    DOC_LABEL[type] +
                    (isMed ? (f.withCid ? ` (CID ${f.cid.toUpperCase()})` : " (sem CID)") : "")
                  }
                />
                <Field
                  label="Curso / Turma"
                  value={course && `${course.name} · ${course.shortCode}`}
                />
                <Field
                  label="Período"
                  value={`${new Date(f.startDate + "T12:00").toLocaleDateString("pt-BR")} → ${new Date(f.endDate + "T12:00").toLocaleDateString("pt-BR")} (${days} ${days > 1 ? "dias" : "dia"})`}
                />
                {isMed && (
                  <>
                    <Field label="Médico" value={f.doctor} />
                    <Field label="CRM" value={`${f.crmNum}/${f.crmUf}`} />
                    <Field label="Especialidade" value={f.specialty} />
                  </>
                )}
                <Field label="Observação" value={f.notes} />
              </div>
              {file && <DocPreview j={file} />}
              <p className="text-center text-xs text-muted-foreground">
                Após o envio, o professor será notificado automaticamente.
              </p>
            </div>
          </>
        )}

        {errors.length > 0 && (
          <ul className="mt-5 space-y-1 rounded-xl bg-danger-soft p-3 text-sm text-destructive">
            {errors.map((e) => (
              <li key={e}>• {e}</li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <button
            disabled={step === 0}
            onClick={() => {
              setErrors([]);
              setStep(step - 1);
            }}
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium text-primary disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          {step < 3 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={send}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
              Enviar justificativa
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
function L({ label, full, children }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
