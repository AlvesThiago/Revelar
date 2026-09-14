"use client";

import { useState } from "react";
import { unlockDeclarationAction } from "@/app/actions/declarations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Wallpaper } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LockedGate({
  slug,
  coupleName,
  title,
  wallpaper,
}: {
  slug: string;
  coupleName: string;
  title: string;
  wallpaper: Wallpaper;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className={cn("flex min-h-dvh items-center justify-center px-4", `wallpaper-${wallpaper}`)}>
      <form
        className="neu-card paper-grain w-full max-w-md rounded-3xl p-8 text-center"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          const result = await unlockDeclarationAction(slug, password);
          setPending(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          window.location.reload();
        }}
      >
        <p className="font-hand text-3xl text-rose">{coupleName}</p>
        <h1 className="mt-2 text-2xl font-semibold text-graphite">{title || "Uma carta fechada"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este envelope tem senha. Lembra da data em que vocês se conheceram?
        </p>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="neu-inset mt-5 h-11"
          placeholder="Senha"
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={pending} className="btn-love mt-4 h-11 w-full border-0">
          {pending ? "Abrindo..." : "Desbloquear"}
        </Button>
      </form>
    </div>
  );
}
