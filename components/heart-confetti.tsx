"use client";

const HEARTS = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 9) * 0.18}s`,
  duration: `${6 + (index % 5)}s`,
  drift: `${-40 + ((index * 13) % 80)}px`,
  size: `${16 + (index % 7) * 4}px`,
}));

export function HeartConfetti({ intense = false }: { intense?: boolean }) {
  const hearts = intense
    ? [...HEARTS, ...HEARTS.map((heart, index) => ({
        ...heart,
        id: heart.id + HEARTS.length,
        left: `${((index * 53) + 11) % 100}%`,
        delay: `${((index % 7) * 0.12)}s`,
      }))]
    : HEARTS;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={`heart-fall absolute -top-8 text-[#d98989]${intense ? " heart-fall-loop" : ""}`}
          style={{
            left: heart.left,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            fontSize: heart.size,
            ["--drift" as string]: heart.drift,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
