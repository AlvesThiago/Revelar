"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { loginAction, registerAction, googleSignInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PASSWORD_RULES,
  isValidEmail,
  validateName,
} from "@/lib/auth-validation";

export function LoginForm({
  googleEnabled = false,
  oauthError,
}: {
  googleEnabled?: boolean;
  oauthError?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <div className="space-y-4">
      {googleEnabled ? <GoogleAuth error={oauthError} /> : null}
      <form action={action} className="space-y-4">
        <Field
          label="E-mail"
          name="email"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="btn-love h-11 w-full border-0">
          {pending ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem um álbum?{" "}
          <Link href="/cadastrar" className="text-rose underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}

export function RegisterForm({
  googleEnabled = false,
  oauthError,
}: {
  googleEnabled?: boolean;
  oauthError?: string;
}) {
  const [state, action, pending] = useActionState(registerAction, {});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const nameError = useMemo(() => validateName(name), [name]);
  const emailError = useMemo(() => {
    if (email.trim().length === 0) return "Informe um e-mail.";
    return isValidEmail(email.trim().toLowerCase())
      ? undefined
      : "Use um e-mail válido, como voce@email.com.";
  }, [email]);
  const passwordReady = PASSWORD_RULES.every((rule) => rule.test(password));
  const canSubmit = !nameError && !emailError && passwordReady && !pending;
  const showNameError = Boolean(nameError) && (touched.name || name.length > 0);
  const showEmailError = Boolean(emailError) && (touched.email || email.length > 0);

  return (
    <div className="space-y-4">
      {googleEnabled ? <GoogleAuth error={oauthError} /> : null}
      <form action={action} noValidate className="space-y-4">
        <Field
          label="Nome"
          name="name"
          placeholder="Como você quer ser chamado"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={setName}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          error={showNameError ? nameError : undefined}
          hint="Esse nome aparece na sua conta e nas respostas do álbum."
        />
        <Field
          label="E-mail"
          name="email"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          error={showEmailError ? emailError : undefined}
        />
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Crie uma senha forte"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            aria-invalid={touched.password && !passwordReady}
            className="neu-inset h-11 bg-cream/70"
          />
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
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
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="btn-love h-11 w-full border-0"
        >
          {pending ? "Criando..." : "Começar a revelar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-rose underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}

function GoogleAuth({ error }: { error?: string }) {
  return (
    <div className="space-y-4">
      <form action={googleSignInAction}>
        <GoogleSignInButton />
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

function GoogleSignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="h-11 w-full gap-2 border-graphite/15 bg-white text-graphite hover:bg-blush/60"
    >
      <GoogleMark />
      {pending ? "Abrindo o Google..." : "Continuar com o Google"}
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.97 10.97 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.59 6.59 0 0 1 5.5 12c0-.72.12-1.43.34-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  value,
  onChange,
  onBlur,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className="neu-inset h-11 bg-cream/70"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
