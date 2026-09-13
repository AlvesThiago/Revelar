import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-form";
import { auth } from "@/lib/auth";

export const metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="font-hand mb-8 text-4xl text-graphite">
        revelar
      </Link>
      <div className="neu-card paper-grain w-full max-w-md rounded-3xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-graphite">Comece a declaração</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie sua conta para montar as polaroids, escolher a trilha e gerar o link.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
