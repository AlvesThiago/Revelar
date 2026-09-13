export type TimeTogether = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function timeTogether(fromIso: string, now = new Date()): TimeTogether {
  const start = new Date(fromIso);
  if (Number.isNaN(start.getTime()) || start > now) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();
  let seconds = now.getSeconds() - start.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days, hours, minutes, seconds };
}

export function formatLastSeen(iso: string | null) {
  if (!iso) return "Ainda não foi aberto";
  const then = new Date(iso);
  const diff = Date.now() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Visto agora há pouco";
  if (minutes < 60) return `Visto pela última vez há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Visto pela última vez há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Visto pela última vez há ${days} ${days === 1 ? "dia" : "dias"}`;
  return `Visto pela última vez em ${then.toLocaleDateString("pt-BR")}`;
}
