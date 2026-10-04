// Lista de avisos do usuário e marcação de leitura após abrir a página.
import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { useStore, markAllRead, fmtDateTime } from "../contextos/AuthContext";
import { cn } from "./ui/utils";
const ICON = {
  aprovada: [CheckCircle2, "bg-success-soft text-success"],
  recusada: [XCircle, "bg-danger-soft text-destructive"],
  correcao: [AlertTriangle, "bg-warning-soft text-warning"],
  pendente: [Info, "bg-accent text-primary"],
  nova: [Info, "bg-accent text-primary"],
};
export function NotifItem({ n }) {
  const [Icon, cls] = ICON[n.kind];
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", cls)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{n.title}</div>
        <div className="text-sm text-muted-foreground">{n.body}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(n.at)}</div>
      </div>
      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </div>
  );
}
export function NotificationsPage() {
  const userId = useStore((s) => s.session);
  const all = useStore((s) => s.notifications);
  const mine = all.filter((n) => n.userId === userId);
  useEffect(() => {
    const t = setTimeout(() => userId && markAllRead(userId), 1500);
    return () => clearTimeout(t);
  }, [userId, mine.length]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Notificações</h1>
      <div className="divide-y rounded-2xl border bg-card px-5">
        {mine.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
        ) : (
          mine.map((n) => <NotifItem key={n.id} n={n} />)
        )}
      </div>
    </div>
  );
}
