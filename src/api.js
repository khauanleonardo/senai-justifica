import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://c--062105ac-0a35-4f14-938e-af46545d25a9-prod.lovable.cloud";

const chavePublica =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_n5E_3anuCdSfAW0f_gwFvw_qmSILyLL";

export const supabase = createClient(url, chavePublica, {
  auth: { persistSession: true, autoRefreshToken: true, storage: localStorage },
});

const check = (error) => {
  if (error) throw new Error(error.message);
};

const cacheUrlsAssinadas = new Map();

export async function entrar(email, senha) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  return !error;
}

export async function sair() {
  cacheUrlsAssinadas.clear();
  await supabase.auth.signOut();
}

export async function usuarioAtual() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

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

  const justificativasFiltradas = (justifications.data ?? []).filter((j) => {
    const nome = (j.document_name || "").toLowerCase();
    const caminho = (j.document_path || "").toLowerCase();
    return !nome.includes("1607564-1") && !caminho.includes("1607564-1");
  });

  const documentos = justificativasFiltradas.map((j) => ({
    ...j,
    file_url: cacheUrlsAssinadas.get(j.document_path) ?? null,
  }));

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

export async function obterLinkDocumento(documentPath) {
  if (!documentPath) return null;
  if (cacheUrlsAssinadas.has(documentPath)) {
    return cacheUrlsAssinadas.get(documentPath);
  }
  try {
    const { data, error } = await supabase.storage
      .from("justificativas")
      .createSignedUrl(documentPath, 60 * 30);
    if (error || !data?.signedUrl) return null;
    cacheUrlsAssinadas.set(documentPath, data.signedUrl);
    return data.signedUrl;
  } catch {
    return null;
  }
}

const TIPOS_ARQUIVO = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

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
    status: "pending",
  });
  if (error) {
    await supabase.storage.from("justificativas").remove([caminho]);
    throw new Error(error.message);
  }
  return id;
}

export async function editarJustificativa(id, userId, dados, novoArquivo = null, caminhoArquivoAntigo = null) {
  let novoCaminho = caminhoArquivoAntigo;
  let novoNome = dados.documentName;

  if (novoArquivo) {
    if (!TIPOS_ARQUIVO.includes(novoArquivo.type)) throw new Error("Envie PDF, JPG, PNG ou WEBP.");
    if (novoArquivo.size > TAMANHO_MAXIMO) throw new Error("O arquivo deve ter no máximo 5 MB.");

    novoCaminho = `${userId}/${id}/${novoArquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: erroUpload } = await supabase.storage
      .from("justificativas")
      .upload(novoCaminho, novoArquivo, { contentType: novoArquivo.type, upsert: true });
    check(erroUpload);
    novoNome = novoArquivo.name;

    if (caminhoArquivoAntigo && caminhoArquivoAntigo !== novoCaminho) {
      await supabase.storage.from("justificativas").remove([caminhoArquivoAntigo]);
      cacheUrlsAssinadas.delete(caminhoArquivoAntigo);
    }
  }

  const { error } = await supabase
    .from("justifications")
    .update({
      class_id: dados.courseId,
      type: dados.type,
      start_date: dados.startDate,
      end_date: dados.endDate,
      professional_name: dados.doctor ?? null,
      professional_registry: dados.crm ?? null,
      notes: dados.notes ?? null,
      document_name: novoNome,
      document_path: novoCaminho,
      status: "pending",
      review_notes: null,
      reviewed_by: null,
      reviewed_at: null,
    })
    .eq("id", id)
    .eq("student_id", userId);

  check(error);
  if (novoCaminho) cacheUrlsAssinadas.delete(novoCaminho);
  return id;
}

export async function excluirJustificativa(id, userId, documentPath) {
  const { error } = await supabase
    .from("justifications")
    .delete()
    .eq("id", id)
    .eq("student_id", userId);
  check(error);

  if (documentPath) {
    try {
      await supabase.storage.from("justificativas").remove([documentPath]);
      cacheUrlsAssinadas.delete(documentPath);
    } catch (e) {
      console.warn("Arquivo do storage não pôde ser excluído ou já não existia:", e);
    }
  }
}

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

export async function lerNotificacoes(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  check(error);
}