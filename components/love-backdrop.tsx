export function LoveBackdrop() {
  return (
    <div aria-hidden className="love-backdrop pointer-events-none fixed inset-0 overflow-hidden">
      <span className="love-doodle" style={{ left: "6%", top: "12%" }}>
        ♥
      </span>
      <span className="love-doodle love-doodle-sm" style={{ left: "18%", top: "72%" }}>
        ♥
      </span>
      <span className="love-doodle" style={{ left: "78%", top: "16%" }}>
        ♥
      </span>
      <span className="love-doodle love-doodle-sm" style={{ left: "88%", top: "64%" }}>
        ♥
      </span>
      <span className="love-doodle love-doodle-lg" style={{ left: "48%", top: "8%" }}>
        ♥
      </span>
      <span className="love-scribble" style={{ left: "10%", top: "38%" }} />
      <span className="love-scribble love-scribble-b" style={{ right: "8%", top: "48%" }} />
    </div>
  );
}
