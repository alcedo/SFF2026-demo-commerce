export default function HowItWorksPage() {
  const steps = [
    "Complete your purchase with USDC on Sepolia.",
    "Copy the voucher code from the success page.",
    "Open the brand redeem page and sign in.",
    "Paste the code. The balance is added to your account.",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="kicker">Define district</p>
      <h1 className="mt-3 text-4xl md:text-5xl">How to redeem</h1>
      <p className="mt-3 text-muted">Four steps from payment to credit on the brand platform.</p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="panel flex gap-4 p-4">
            <span className="flex h-8 w-8 items-center justify-center bg-green font-mono text-sm font-bold text-ink notch-sm">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="pt-1 text-paper">{step}</p>
          </li>
        ))}
      </ol>
      <div className="panel mt-10 p-6">
        <h2 className="text-2xl">Need help?</h2>
        <p className="mt-2 text-sm text-muted">
          If you paid and did not receive codes, include your transaction hash when you write.
        </p>
        <a href="mailto:support@vouchershop.example" className="btn btn-ghost mt-4">
          Contact support
        </a>
      </div>
    </div>
  );
}
