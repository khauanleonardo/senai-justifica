// Página de login: o usuário escolhe o perfil, digita e-mail e senha e é levado para a área correta.
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Lock, User, ArrowRight, Stethoscope, FileText, Star, ShieldCheck } from "lucide-react";
import { login } from "../contextos/AuthContext";
import { Logo, SenaiMark } from "../componentes/DetalhesJustificativa";
import { cn } from "../componentes/ui/utils";
const campus = { url: "/assets/campus-natal.png" };

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("aluno");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = (r) =>
    navigate(r === "aluno" ? "/aluno" : r === "professor" ? "/professor" : "/secretaria");

  const submit = async (e) => {
    e.preventDefault();
    if (!id.trim() || pw.length < 4) return setErr("Informe e-mail e senha.");
    setErr("");
    setLoading(true);
    try {
      const u = await login(id, pw);
      if (!u) {
        setErr("E-mail ou senha incorretos.");
      } else {
        go(u.role);
      }
    } catch {
      setErr("Erro ao conectar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <img
          src={campus.url}
          alt="Campus SENAI-RN"
          width={1600}
          height={912}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-navy-foreground">
          <Logo light size="lg" />
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Mais organização para suas justificativas.
            </h1>
            <p className="mt-4 text-lg opacity-85">
              Envie seus atestados, declarações e outros documentos de forma simples, rápida e
              segura.
            </p>
            <div className="mt-10 grid grid-cols-4 gap-4 text-center text-xs">
              {[
                [Stethoscope, "Atestados médicos"],
                [FileText, "Declarações"],
                [Star, "Alistamento militar"],
                [ShieldCheck, "Seguro e organizado"],
              ].map(([I, l]) => {
                const Icon = I;
                return (
                  <div key={l}>
                    <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-primary/40">
                      <Icon className="h-5 w-5" />
                    </div>
                    {l}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="relative h-44 overflow-hidden lg:hidden">
          <img src={campus.url} alt="Campus SENAI-RN" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <Logo size="lg" />
            </div>
            <h2 className="text-3xl font-semibold">Bem-vindo(a)!</h2>
            <p className="mt-1 text-muted-foreground">Faça login para continuar.</p>

            <div className="mt-6 grid grid-cols-3 rounded-xl bg-muted p-1">
              {["aluno", "professor", "secretaria"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setErr("");
                  }}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium capitalize transition",
                    role === r
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">E-mail</span>
                <div className="flex items-center gap-2 rounded-xl border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    maxLength={120}
                    placeholder={
                      role === "aluno"
                        ? "aluno@senai.br"
                        : role === "professor"
                          ? "professor@senai.br"
                          : "secretaria@senai.br"
                    }
                    className="h-12 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Senha</span>
                <div className="flex items-center gap-2 rounded-xl border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={show ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    maxLength={64}
                    placeholder="Digite sua senha"
                    className="h-12 flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label="Mostrar senha"
                    className="text-muted-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <button
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <SenaiMark className="mt-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
