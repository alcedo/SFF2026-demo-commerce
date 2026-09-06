export default function HowItWorksPage() {
  const steps = [
    "Complete your purchase with USDC on Sepolia.",
    "Copy the voucher code from the success page.",
    "Open the brand redeem page and sign in.",
    "Paste the code. The balance is added to your account.",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">How to Redeem</h1>
      <p className="mt-2 text-slate-500">
        Four steps from payment to credit on the brand platform.
      </p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4 rounded-xl border border-slate-100 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {index + 1}
            </span>
            <p className="pt-1 text-slate-700">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-2xl bg-slate-50 p-6">
        <h2 className="font-semibold">Need Help?</h2>
        <p className="mt-2 text-sm text-slate-600">
          If you paid and did not receive codes, include your transaction hash when you write.
        </p>
        <a
          href="mailto:support@vouchershop.example"
          className="mt-4 inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
