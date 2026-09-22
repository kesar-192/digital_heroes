const steps = [
  { title: "Subscribe", body: "Pick monthly or yearly. A share of your fee goes straight to your chosen charity." },
  { title: "Log your rounds", body: "Enter your last 5 Stableford scores — they double as your numbers for the monthly draw." },
  { title: "Monthly draw", body: "Every month we draw 5 numbers. Match 3, 4, or 5 of your scores and you win a share of that tier's pool." },
  { title: "Verify & get paid", body: "Winners upload a quick screenshot of their scores, we verify, and payouts go out." },
];

export const metadata = { title: "How it works · Digital Heroes" };

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-white">How it works</h1>
      <ol className="mt-10 space-y-8">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-sm font-semibold text-black">
              {i + 1}
            </span>
            <div>
              <h2 className="font-medium text-white">{s.title}</h2>
              <p className="mt-1 text-sm text-white/60">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
