"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDeclarationAction } from "@/app/actions/declarations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteAlbumButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const label = name.trim() || "este álbum";

  function confirm() {
    setError("");
    startTransition(async () => {
      const result = await deleteDeclarationAction(id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 />
        Excluir álbum
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir {label}?</DialogTitle>
            <DialogDescription>
              Fotos, música, link e respostas deste álbum somem de vez. Isso não tem volta.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="border-0 bg-transparent">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirm} disabled={pending}>
              {pending ? "Excluindo..." : "Excluir de vez"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
