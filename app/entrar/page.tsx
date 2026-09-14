import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-form";
import { LoveBackdrop } from "@/components/love-backdrop";
import { auth } from "@/lib/auth";
import { isGoogleAuthEnabled } from "@/lib/google-account";

export const metadata = { title: "Entrar" };

function oauthMessage(error?: string, erro?: string) {
  if (erro === "limite") return "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if (erro === "google") return "O login com Google ainda não está configurado.";
  if (!error) return undefined;
  if (error === "AccessDenied") {
    return "O Google não autorizou este acesso. Use um e-mail verificado ou entre com senha.";
  }
  if (error === "OAuthAccountNotLinked") {
    return "Este e-mail já tem uma conta. Entre com a senha para continuar.";
  }
  return "Não foi possível entrar com o Google. Tente de novo.";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; erro?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error, erro } = await searchParams;
  const googleEnabled = isGoogleAuthEnabled();

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-12">
      <LoveBackdrop />
      <Link href="/" className="font-hand relative z-10 mb-8 text-4xl text-graphite">
        revellar <span className="text-rose">♥</span>
      </Link>
      <div className="neu-card paper-grain relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8">
        <p className="font-hand text-2xl text-rose">oi de novo</p>
        <h1 className="text-2xl font-semibold text-graphite">Bem-vindo de volta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre para continuar o álbum, ver as respostas e saber se a pessoa já abriu o seu link.
        </p>
        <div className="mt-6">
          <LoginForm
            googleEnabled={googleEnabled}
            oauthError={oauthMessage(error, erro)}
          />
        </div>
      </div>
    </div>
  );
}
