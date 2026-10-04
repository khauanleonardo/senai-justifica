// =====================================================================
// AuthContext.jsx — guarda quem está logado (Aluno, Professor ou
// Secretaria) e os dados que as telas exibem. Qualquer tela pode ler
// esse estado com useStore(...).
// =====================================================================
import { useSyncExternalStore } from "react";
import { entrar, sair, carregarDados, enviarJustificativa, analisarJustificativa, lerNotificacoes } from "../api";

// Nomes amigáveis exibidos nas telas.
export const DOC_LABEL = {
  atestado: "Atestado médico",
  declaracao: "Declaração de comparecimento",
  alistamento: "Alistamento militar",
  compromisso: "Compromisso oficial",
  outro: "Outro documento",
};
export const STATUS_LABEL = {
  pendente: "Em análise",
  aprovada: "Aprovada",
  recusada: "Recusada",
  correcao: "Correção solicitada",
};

// Estado inicial (ninguém logado, nada carregado).
const vazio = { users: [], courses: [], justifications: [], notifications: [], session: null, ready: false, error: null };
let state = vazio;
const ouvintes = new Set();

// Atualiza o estado e avisa todas as telas para se redesenharem.
function publicar(novo) {
  state = novo;
  ouvintes.forEach((fn) => fn());
}

// Hook usado pelas telas: useStore((s) => s.justifications), por exemplo.
export function useStore(selecionar) {
  return useSyncExternalStore(
    (fn) => {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
    () => selecionar(state),
    () => selecionar(vazio),
  );
}
export const getState = () => state;

// Converte os nomes do banco (inglês) para os nomes das telas (português).
const perfil = (r) => (r === "teacher" ? "professor" : r === "secretary" ? "secretaria" : "aluno");
const situacao = (s) =>
  s === "approved" ? "aprovada" : s === "rejected" ? "recusada" : s === "correction_requested" ? "correcao" : "pendente";

let carregando = null;

// Busca novamente os dados do banco e atualiza as telas.
export function refresh() {
  if (carregando) return carregando;
  carregando = (async () => {
    try {
      const data = await carregarDados();
      if (!data) return publicar({ ...vazio, ready: true });
      const perfilPorId = new Map(data.roles.map((x) => [x.user_id, perfil(x.role)]));
      const users = data.users.map((u) => ({
        id: u.id, name: u.full_name, email: u.email, cpf: u.cpf ?? "", role: perfilPorId.get(u.id) ?? "aluno",
      }));
      const courses = data.classes.map((c) => ({
        id: c.id, name: c.course_name, code: c.code, shortCode: c.student_code,
        teacherId: data.teacherIds[c.id] ?? "", petrobras: Boolean(c.sponsor),
        students: data.enrollments.filter((e) => e.class_id === c.id).map((e) => e.student_id),
      }));
      const justifications = data.justifications.map((j, i) => ({
        id: j.id, number: data.justifications.length - i, studentId: j.student_id, courseId: j.class_id, type: j.type,
        startDate: j.start_date, endDate: j.end_date,
        days: Math.max(1, Math.round((new Date(j.end_date) - new Date(j.start_date)) / 86400000) + 1),
        doctor: j.professional_name ?? undefined, crm: j.professional_registry ?? undefined, notes: j.notes ?? undefined,
        fileName: j.document_name, fileData: j.file_url ?? undefined, status: situacao(j.status),
        reason: j.review_notes ?? undefined, createdAt: j.created_at,
        history: j.reviewed_at
          ? [{ label: "Justificativa enviada", at: j.created_at }, { label: "Justificativa analisada", at: j.reviewed_at }]
          : [{ label: "Justificativa enviada", at: j.created_at }],
      }));
      const notifications = data.notifications.map((n) => ({
        id: n.id, userId: n.user_id, title: n.title, body: n.message, at: n.created_at, read: n.read, kind: "nova",
      }));
      publicar({ users, courses, justifications, notifications, session: data.session, ready: true, error: null });
    } catch (e) {
      publicar({ ...state, ready: true, error: e.message || "Falha ao carregar dados." });
    }
  })().finally(() => {
    carregando = null;
  });
  return carregando;
}

// Faz login e devolve o perfil da pessoa (ou null se e-mail/senha estiverem errados).
export async function login(email, senha) {
  if (!(await entrar(email, senha))) return null;
  await refresh();
  return state.users.find((u) => u.id === state.session) ?? null;
}

// Sai da conta e limpa os dados da tela.
export async function logout() {
  await sair();
  publicar({ ...vazio, ready: true });
}

// Envia uma nova justificativa com o documento anexado.
export async function submitJustification(dados, arquivo) {
  if (!state.session) throw new Error("Entre novamente para enviar.");
  const id = await enviarJustificativa(state.session, dados, arquivo);
  await refresh();
  return id;
}

// Registra a decisão sobre uma justificativa.
export async function decide(id, status, motivo) {
  await analisarJustificativa(state.session, id, status, motivo);
  await refresh();
}

// Marca todas as notificações como lidas.
export async function markAllRead(userId) {
  await lerNotificacoes(userId);
  await refresh();
}

// Formatação de datas no padrão brasileiro.
export const fmt = (d) => new Date(d.length === 10 ? d + "T12:00" : d).toLocaleDateString("pt-BR");
export const fmtShort = (d) => fmt(d).slice(0, 5);
export const fmtDateTime = (d) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
