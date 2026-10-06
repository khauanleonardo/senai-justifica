// Peças visuais reutilizadas nas telas: marcas, status, documento e histórico.
import { useState, useEffect } from "react";
import {
  Stethoscope,
  FileText,
  Shield,
  Briefcase,
  File,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Loader2,
} from "lucide-react";
import {
  STATUS_LABEL,
  DOC_LABEL,
  fmt,
  fmtDateTime,
  useStore,
  getDocumentLink,
} from "../contextos/AuthContext";
import { cn } from "./ui/utils";

const senaiLogo = { url: "/assets/senai-atual.png" };
const programLogo = { url: "/assets/programa-autonomia-renda.png" };
const petrobrasLogo = { url: "/assets/petrobras.png" };

export function Logo({ light = false, size = "md" }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-md bg-card px-2 py-1",
          size === "lg" ? "h-14 w-32" : "h-10 w-24",
        )}
      >
        <img src={senaiLogo.url} alt="SENAI" className="h-full w-full scale-[2.2] object-contain" />
      </div>
      <div
        className={cn(
          "font-display font-semibold",
          light ? "text-navy-foreground" : "text-foreground",
          size === "lg" ? "text-xl" : "text-sm",
        )}
      >
        Justifica
      </div>
    </div>
  );
}

export function PetrobrasBadge({ className }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md border bg-card p-2", className)}>
      <img
        src={programLogo.url}
        alt="Programa Autonomia e Renda Petrobras"
        className="h-8 min-w-0 flex-1 object-contain object-left"
      />
      <img src={petrobrasLogo.url} alt="Petrobras" className="h-8 w-20 object-contain" />
    </div>
  );
}

export function CourseIdentity({ petrobras }) {
  if (!petrobras) return null;
  return (
    <div className="mt-3">
      <PetrobrasBadge />
    </div>
  );
}

export function SenaiMark({ className }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <span className="h-10 w-24 overflow-hidden">
        <img src={senaiLogo.url} alt="SENAI" className="h-full w-full scale-[2.2] object-contain" />
      </span>
      <span className="h-8 w-px bg-border" />
      <span className="text-left text-xs font-medium leading-relaxed text-muted-foreground">
        Educação profissional
        <br />
        que transforma.
      </span>
    </div>
  );
}

export const DOC_ICON = {
  atestado: Stethoscope,
  declaracao: FileText,
  alistamento: Shield,
  compromisso: Briefcase,
  outro: File,
};

const S = {
  pendente: { cls: "bg-warning-soft text-warning", Icon: Clock },
  aprovada: { cls: "bg-success-soft text-success", Icon: CheckCircle2 },
  recusada: { cls: "bg-danger-soft text-destructive", Icon: XCircle },
  correcao: { cls: "bg-warning-soft text-warning", Icon: AlertTriangle },
};

export function StatusBadge({ status }) {
  const item = S[status] ?? S.pendente;
  const { cls, Icon } = item;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function Card({ className, children }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm", className)}>{children}</div>
  );
}

export function StatTile({ label, value, tone }) {
  const t = {
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-destructive",
    primary: "bg-accent text-primary",
  }[tone];
  return (
    <div className={cn("rounded-xl p-3 text-center", t)}>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}

export function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

export function JustificationDetails({ j, onEditar, onRemover, onOutra }) {
  const courses = useStore((s) => s.courses);
  const role = useStore((s) => s.users.find((u) => u.id === s.session)?.role);
  const course = courses.find((c) => c.id === j.courseId);
  const courseCode = role === "professor" ? course?.code : course?.shortCode;
  const Icon = DOC_ICON[j.type] ?? File;
  const podeAcoesAluno = role === "aluno" && (j.status === "recusada" || j.status === "correcao");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            {DOC_LABEL[j.type] ?? j.type}
            {j.type === "atestado" && (j.withCid ? " (com CID)" : " (sem CID)")}
          </div>
          <div className="text-xs text-muted-foreground">
            #{j.number} · enviada em {fmtDateTime(j.createdAt)}
          </div>
        </div>
        <StatusBadge status={j.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Curso / Turma" value={course && `${course.name} · ${courseCode}`} />
        <Field
          label="Período"
          value={`${fmt(j.startDate)} → ${fmt(j.endDate)} (${j.days} ${j.days > 1 ? "dias" : "dia"})`}
        />
        {j.type === "atestado" && (
          <>
            <Field label="Profissional" value={j.doctor} />
            <Field label="CRM" value={j.crm} />
            <Field label="Especialidade" value={j.specialty} />
            {j.withCid && <Field label="CID" value={j.cid} />}
          </>
        )}
        <div className="col-span-2">
          <Field label="Observação" value={j.notes} />
        </div>
      </div>

      {j.reason && (
        <div className="rounded-xl border border-destructive/20 bg-danger-soft p-3 text-sm text-destructive">
          <b>Motivo informado pelo revisor:</b>
          <p className="mt-1">{j.reason}</p>
        </div>
      )}

      {podeAcoesAluno && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft/30 p-3">
          <p className="text-xs font-semibold text-warning">
            {j.status === "recusada"
              ? "Esta justificativa foi recusada. Você pode editá-la, removê-la ou enviar outra."
              : "Foi solicitada correção. Corrija as informações ou envie outro documento."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onEditar && (
              <button
                onClick={() => onEditar(j)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Editar e reenviar
              </button>
            )}
            {onRemover && (
              <button
                onClick={() => onRemover(j)}
                className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                Remover justificativa
              </button>
            )}
            {onOutra && (
              <button
                onClick={() => onOutra(j)}
                className="rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Enviar nova
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">DOCUMENTO ANEXADO</div>
        <DocPreview j={j} />
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">HISTÓRICO</div>
        <ol className="space-y-2 border-l-2 border-accent pl-4">
          {(j.history ?? []).map((h, i) => (
            <li key={i} className="relative text-sm">
              <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              {h.label}
              <div className="text-xs text-muted-foreground">{fmtDateTime(h.at)}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function DocPreview({ j }) {
  const [url, setUrl] = useState(j.fileData || null);
  const [carregandoUrl, setCarregandoUrl] = useState(false);

  useEffect(() => {
    if (j.fileData) {
      setUrl(j.fileData);
      return;
    }
    if (j.documentPath && !url) {
      setCarregandoUrl(true);
      getDocumentLink(j.documentPath)
        .then((link) => {
          if (link) setUrl(link);
        })
        .finally(() => setCarregandoUrl(false));
    }
  }, [j.fileData, j.documentPath, url]);

  const isImg =
    j.fileType?.startsWith("image/") ||
    (j.fileName && /\.(png|jpe?g|webp)$/i.test(j.fileName));

  return (
    <div className="rounded-xl border bg-card p-3">
      {url && isImg && (
        <img
          src={url}
          alt="Documento anexado"
          className="mb-3 max-h-72 w-full rounded-lg bg-muted object-contain"
        />
      )}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-danger-soft text-destructive">
          <File className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{j.fileName ?? "Documento"}</div>
          <div className="text-xs text-muted-foreground">
            {j.fileSize ? `${(j.fileSize / 1e6).toFixed(1)} MB` : "Documento anexado"}
          </div>
        </div>
        {carregandoUrl ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Carregando...
          </div>
        ) : (
          url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download={j.fileName}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent"
            >
              <Eye className="h-3.5 w-3.5" />
              Visualizar
            </a>
          )
        )}
      </div>
    </div>
  );
}
