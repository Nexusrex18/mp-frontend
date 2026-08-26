/* ---------------------------------------------------------------
   StatsSection — counter row showing system-level stats.
   Mock numbers for now — in production these could come from
   read-only on-chain event counts.
----------------------------------------------------------------*/

const STATS = [
  { n: "12,400+", l: "Batches Registered" },
  { n: "98,000+", l: "Medicines Verified" },
  { n: "150+", l: "Supply Chain Partners" },
  { n: "12", l: "Countries Covered" },
];

export default function StatsSection() {
  return (
    <section className="mt-bg-indigo" style={{ padding: "64px 24px" }}>
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-4"
        style={{ maxWidth: 1180, margin: "0 auto", gap: 18 }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            className="mt-stat-chip"
            style={{ padding: "22px 18px", textAlign: "center" }}
          >
            <div
              className="mt-mono mt-text-white"
              style={{ fontSize: 30, fontWeight: 600 }}
            >
              {s.n}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                marginTop: 6,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
