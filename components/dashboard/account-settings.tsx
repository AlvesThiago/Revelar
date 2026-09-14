"use client";

import { useMemo, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import {
  deleteAccountAction,
  signOutAction,
  updateEmailAction,
  updatePasswordAction,
  updateProfileAction,
  type AccountFormState,
} from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RULES } from "@/lib/auth-validation";
import type { AccountSummary } from "@/lib/queries";
import { cn } from "@/lib/utils";

function Status({ state }: { state: AccountFormState }) {
  if (state.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-emerald-700">{state.ok}</p>;
  return null;
}

function SubmitButton({
  label,
  pendingLabel,
  disabled,
  variant = "love",
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  variant?: "love" | "destructive";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      variant={variant === "destructive" ? "destructive" : "default"}
      className={variant === "love" ? "btn-love h-11 border-0" : undefined}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateProfileAction, {});

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Como você quer ser chamado</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          maxLength={80}
          autoComplete="name"
          required
          className="neu-inset h-11 bg-cream/70"
        />
        <p className="text-xs text-muted-foreground">
          Esse nome aparece no painel e nas respostas dos seus álbuns.
        </p>
      </div>
      <Status state={state} />
      <SubmitButton label="Guardar nome" pendingLabel="Guardando..." />
    </form>
  );
}

export function EmailForm({
  email,
  hasPassword,
  googleLinked,
}: {
  email: string;
  hasPassword: boolean;
  googleLinked: boolean;
}) {
  const [state, action] = useActionState(updateEmailAction, {});

  if (!hasPassword) {
    return (
      <div className="space-y-2">
        <p className="rounded-2xl bg-blush/60 px-4 py-3 text-sm text-graphite">{email}</p>
        <p className="text-sm text-muted-foreground">
          {googleLinked
            ? "Este e-mail vem da sua conta Google. Crie uma senha se quiser trocá-lo por aqui."
            : "Crie uma senha para poder alterar o e-mail."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
          required
          className="neu-inset h-11 bg-cream/70"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email-password">Senha atual</Label>
        <Input
          id="email-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="neu-inset h-11 bg-cream/70"
        />
      </div>
      <Status state={state} />
      <SubmitButton label="Atualizar e-mail" pendingLabel="Atualizando..." />
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(updatePasswordAction, {});
  const [nextPassword, setNextPassword] = useState("");
  const ready = useMemo(
    () => PASSWORD_RULES.every((rule) => rule.test(nextPassword)),
    [nextPassword]
  );

  return (
    <form action={action} className="space-y-4">
      {hasPassword ? (
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="neu-inset h-11 bg-cream/70"
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">{hasPassword ? "Nova senha" : "Criar senha"}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
          className="neu-inset h-11 bg-cream/70"
        />
        <ul className="mt-2 space-y-1">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(nextPassword);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-2 text-xs ${
                  ok ? "text-emerald-700" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full border ${
                    ok
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {ok ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      </div>
      <Status state={state} />
      <SubmitButton
        label={hasPassword ? "Trocar senha" : "Criar senha"}
        pendingLabel={hasPassword ? "Trocando..." : "Criando..."}
        disabled={!ready}
      />
    </form>
  );
}

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(deleteAccountAction, {});

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        Isso apaga a conta, os álbuns, as fotos, as músicas e as respostas. Não tem volta.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Digite apagar para confirmar</Label>
        <Input
          id="confirm"
          name="confirm"
          autoComplete="off"
          required
          className="neu-inset h-11 bg-cream/70"
        />
      </div>
      {hasPassword ? (
        <div className="space-y-1.5">
          <Label htmlFor="delete-password">Senha atual</Label>
          <Input
            id="delete-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="neu-inset h-11 bg-cream/70"
          />
        </div>
      ) : null}
      <Status state={state} />
      <SubmitButton
        label="Apagar minha conta"
        pendingLabel="Apagando..."
        variant="destructive"
      />
    </form>
  );
}

type Section = "resumo" | "perfil" | "email" | "senha" | "sessao" | "apagar";

const MENU: {
  id: Section;
  label: string;
  hint: string;
  danger?: boolean;
}[] = [
  { id: "resumo", label: "Resumo", hint: "Álbuns e visitas" },
  { id: "perfil", label: "Perfil", hint: "Como te chamamos" },
  { id: "email", label: "E-mail", hint: "Acesso da conta" },
  { id: "senha", label: "Senha", hint: "Entrar com e-mail" },
  { id: "sessao", label: "Sessão", hint: "Sair deste dispositivo" },
  { id: "apagar", label: "Apagar conta", hint: "Zona perigosa", danger: true },
];

export function AccountSettings({
  account,
  memberSince,
}: {
  account: AccountSummary;
  memberSince: string;
}) {
  const [section, setSection] = useState<Section>("resumo");
  const menu = MENU.map((item) =>
    item.id === "senha"
      ? { ...item, hint: account.hasPassword ? "Trocar a senha" : "Criar uma senha" }
      : item
  );
  const current = menu.find((item) => item.id === section) ?? menu[0];

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <nav className="neu-card rounded-3xl p-3 lg:sticky lg:top-24">
        <p className="px-3 pt-2 font-hand text-xl text-rose">menu</p>
        <ul className="mt-1 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {menu.map((item) => {
            const active = item.id === section;
            return (
              <li key={item.id} className="shrink-0 lg:w-full">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSection(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSection(item.id);
                    }
                  }}
                  className={cn(
                    "flex w-full cursor-pointer flex-col rounded-2xl px-3 py-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-rose/40",
                    active && !item.danger &&
                      "bg-gradient-to-b from-[#ee8592] to-[#d85a6c] text-white shadow-[0_8px_18px_rgba(216,90,108,0.25)]",
                    active && item.danger && "bg-destructive text-white",
                    !active && item.danger && "text-destructive hover:bg-destructive/10",
                    !active && !item.danger && "text-graphite hover:bg-blush/70"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-white" : item.danger ? "text-destructive" : "text-graphite"
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "hidden text-xs lg:block",
                      active ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    {item.hint}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      <section
        className={cn(
          "rounded-3xl p-6",
          section === "apagar"
            ? "border border-destructive/20 bg-[#fff6f4]"
            : "neu-card"
        )}
      >
        <p className={cn("font-hand text-2xl", section === "apagar" ? "text-destructive" : "text-rose")}>
          {current.hint}
        </p>
        <h2
          className={cn(
            "text-lg font-semibold",
            section === "apagar" ? "text-destructive" : "text-graphite"
          )}
        >
          {current.label}
        </h2>

        <div className="mt-5">
          {section === "resumo" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Stat label="Álbuns" value={String(account.albums)} />
              <Stat label="No ar" value={String(account.published)} />
              <Stat
                label="Visitas"
                value={String(account.views)}
                hint="Soma de aberturas dos seus links"
              />
              <Stat label="Com você desde" value={memberSince} />
              <Stat
                label="Como entra"
                value={
                  account.googleLinked && account.hasPassword
                    ? "Google e senha"
                    : account.googleLinked
                      ? "Google"
                      : "E-mail e senha"
                }
              />
            </div>
          ) : null}

          {section === "perfil" ? <ProfileForm name={account.name} /> : null}

          {section === "email" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {account.hasPassword
                  ? "Usamos este e-mail para você entrar. Confirme com a senha atual."
                  : "Este é o e-mail da sua conta Google."}
              </p>
              <EmailForm
                email={account.email}
                hasPassword={account.hasPassword}
                googleLinked={account.googleLinked}
              />
            </div>
          ) : null}

          {section === "senha" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {account.hasPassword
                  ? "A nova senha segue as mesmas regras de quando você criou a conta."
                  : "Crie uma senha se quiser também entrar com e-mail, sem o Google."}
              </p>
              <PasswordForm hasPassword={account.hasPassword} />
            </div>
          ) : null}

          {section === "sessao" ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Você permanece conectado por 7 dias neste dispositivo, com cookie seguro.
              </p>
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  Sair desta sessão
                </Button>
              </form>
            </div>
          ) : null}

          {section === "apagar" ? (
            <DeleteAccountForm hasPassword={account.hasPassword} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose/80">{label}</p>
      <p className="mt-1 text-xl font-semibold text-graphite">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
