export function GridBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #faf8f4 1px, transparent 1px),
          linear-gradient(to bottom, #faf8f4 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
  );
}
