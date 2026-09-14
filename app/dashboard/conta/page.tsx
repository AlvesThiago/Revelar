import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { getAccountForUser } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Conta" };

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const account = await getAccountForUser(sessionUser.id);
  if (!account) redirect("/entrar");

  const firstName = account.name.split(" ")[0] || "você";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <p className="font-hand text-2xl text-rose">olá, {firstName} ♥</p>
        <h1 className="text-3xl font-semibold text-graphite">Conta e configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha no menu o que você quer ajustar.
        </p>
        <AccountSettings account={account} memberSince={formatMemberSince(account.createdAt)} />
      </main>
    </div>
  );
}
