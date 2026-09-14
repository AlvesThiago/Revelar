"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Check } from "lucide-react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PASSWORD_RULES,
  isValidEmail,
  validateName,
} from "@/lib/auth-validation";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <div className="space-y-4">
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

export function RegisterForm() {
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
