export const PASSWORD_RULES = [
  {
    id: "length",
    label: "Pelo menos 8 caracteres",
    test: (password: string) => password.length >= 8,
  },
  {
    id: "lower",
    label: "Uma letra minúscula",
    test: (password: string) => /[a-zà-ÿ]/.test(password),
  },
  {
    id: "upper",
    label: "Uma letra maiúscula",
    test: (password: string) => /[A-ZÀ-Ÿ]/.test(password),
  },
  {
    id: "number",
    label: "Um número",
    test: (password: string) => /\d/.test(password),
  },
  {
    id: "special",
    label: "Um caractere especial (!@#$…)",
    test: (password: string) => /[^A-Za-z0-9À-ÿ\s]/.test(password),
  },
] as const;

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateName(name: string): string | undefined {
  const trimmed = normalizeName(name);
  if (trimmed.length < 2) {
    return "Escreva seu nome completo, com pelo menos 2 caracteres.";
  }
  if (trimmed.length > 80) {
    return "O nome pode ter no máximo 80 caracteres.";
  }
  if (!/[\p{L}]/u.test(trimmed)) {
    return "O nome precisa ter pelo menos uma letra.";
  }
  return undefined;
}

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email) && !email.includes("..") && email.length <= 254;
}

export function validateEmail(email: string): string | undefined {
  if (!isValidEmail(email)) {
    return "Use um e-mail válido, como voce@email.com.";
  }
  return undefined;
}

export function getUnmetPasswordRules(password: string) {
  return PASSWORD_RULES.filter((rule) => !rule.test(password));
}

export function validatePassword(password: string): string | undefined {
  const unmet = getUnmetPasswordRules(password);
  if (unmet.length === 0) return undefined;
  return "A senha ainda não atende às regras de segurança.";
}
