import PlaceholderImage from "@/components/PlaceholderImage";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-content px-5 py-10 sm:px-10 sm:py-16">
      <div className="eyebrow">About</div>
      <h1 className="mt-2 max-w-[560px] font-display text-[38px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[48px]">
        Forty pieces, chosen each season.
      </h1>
      <p className="mt-5 max-w-[480px] text-[15px] leading-relaxed text-muted">
        Arca is a small, considered edit — electronics, fashion, home and beauty, chosen by a team that tests everything
        before it ships. We work directly with a small set of makers and manufacturers, keep the range tight, and would
        rather sell forty good things than four hundred forgettable ones.
      </p>

      <PlaceholderImage alt="Studio" label="studio photograph" className="mt-10 h-[260px] w-full sm:h-[380px]" />

      <div className="rule-strong mt-14 grid gap-10 pt-8 sm:grid-cols-3">
        <Principle title="Considered sourcing" body="Every product is tested by the team before it's listed — no dropshipping, no unseen samples." />
        <Principle title="Built to last" body="We favour materials and construction that age well over ones that just photograph well." />
        <Principle title="Direct and honest" body="Real stock counts, real delivery estimates, and a straightforward returns policy." />
      </div>
    </div>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-[16px] font-bold text-ink">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}
