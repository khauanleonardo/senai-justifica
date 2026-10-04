// =====================================================================
// api.js — conexão com o banco (Supabase) e todas as chamadas de dados.
// As permissões (quem pode ver/alterar o quê) são garantidas pelas
// regras de segurança do próprio banco (RLS), não apenas pela tela.
// =====================================================================
import { createClient } from "@supabase/supabase-js";

// Endereço e chave pública com fallback garantido
const url =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://c--062105ac-0a35-4f14-938e-af46545d25a9-prod.lovable.cloud";

const chavePublica =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_n5E_3anuCdSfAW0f_gwFvw_qmSILyLL";

// Cliente único usado pelo app inteiro; mantém a sessão salva no navegador.
export const supabase = createClient(url, chavePublica, {
  auth: { persistSession: true, autoRefreshToken: true, storage: localStorage },
});


// Lança um erro legível quando o banco recusa a operação.
const check = (error) => {
  if (error) throw new Error(error.message);
};

// ---------- Autenticação ----------

// Entra com e-mail e senha. Retorna true se deu certo.
export async function entrar(email, senha) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  return !error;
}

// Encerra a sessão atual.
export async function sair() {
  await supabase.auth.signOut();
}

// Retorna o usuário logado (ou null).
export async function usuarioAtual() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

// ---------- Leitura de dados ----------

// Carrega tudo que a pessoa logada tem permissão de ver.
// Os documentos recebem links temporários (30 minutos) porque o armazenamento é privado.
export async function carregarDados() {
  const user = await usuarioAtual();
  if (!user) return null;
  const [profiles, roles, classes, enrollments, justifications, notifications] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,cpf"),
    supabase.from("user_roles").select("user_id,role"),
    supabase.from("classes").select("*"),
    supabase.from("enrollments").select("*"),
    supabase.from("justifications").select("*").order("created_at", { ascending: false }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }),
  ]);
  for (const item of [profiles, roles, classes, enrollments, justifications, notifications]) check(item.error);

  // Gera o link temporário de cada documento anexado.
  const documentos = await Promise.all(
    (justifications.data ?? []).map(async (j) => {
      const { data } = await supabase.storage.from("justificativas").createSignedUrl(j.document_path, 60 * 30);
      return { ...j, file_url: data?.signedUrl ?? null };
    }),
  );

  // Descobre qual professor é responsável por cada turma (pelo nome cadastrado na turma).
  const professores = (roles.data ?? []).filter((r) => r.role === "teacher");
  const teacherIds = {};
  for (const turma of classes.data ?? []) {
    const prof = (profiles.data ?? []).find((p) => p.full_name === turma.teacher_name);
    if (prof && professores.some((r) => r.user_id === prof.id)) teacherIds[turma.id] = prof.id;
  }

  return {
    session: user.id,
    users: profiles.data ?? [],
    roles: roles.data ?? [],
    classes: classes.data ?? [],
    teacherIds,
    enrollments: enrollments.data ?? [],
    justifications: documentos,
    notifications: notifications.data ?? [],
  };
}

// ---------- Escrita de dados ----------

const TIPOS_ARQUIVO = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

// Envia o documento para a pasta privada do aluno e grava a justificativa.
// Se a gravação falhar, apaga o arquivo para não deixar sobra no armazenamento.
export async function enviarJustificativa(userId, dados, arquivo) {
  if (!TIPOS_ARQUIVO.includes(arquivo.type)) throw new Error("Envie PDF, JPG, PNG ou WEBP.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error("O arquivo deve ter no máximo 5 MB.");
  const id = crypto.randomUUID();
  const caminho = `${userId}/${id}/${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: erroUpload } = await supabase.storage
    .from("justificativas")
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
  check(erroUpload);

  const { error } = await supabase.from("justifications").insert({
    id,
    student_id: userId,
    class_id: dados.courseId,
    type: dados.type,
    start_date: dados.startDate,
    end_date: dados.endDate,
    professional_name: dados.doctor ?? null,
    professional_registry: dados.crm ?? null,
    notes: dados.notes ?? null,
    document_name: arquivo.name,
    document_path: caminho,
  });
  if (error) {
    await supabase.storage.from("justificativas").remove([caminho]);
    throw new Error(error.message);
  }
  return id;
}

// Registra a decisão do professor/secretaria (aprovada, recusada ou correção).
// O banco só aceita se a pessoa tiver o perfil autorizado.
export async function analisarJustificativa(userId, id, status, motivo) {
  const statusBanco =
    status === "aprovada" ? "approved" : status === "recusada" ? "rejected" : "correction_requested";
  const { error } = await supabase
    .from("justifications")
    .update({
      status: statusBanco,
      review_notes: motivo ?? null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  check(error);
}

// Marca como lidas todas as notificações da pessoa logada.
export async function lerNotificacoes(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  check(error);
}
