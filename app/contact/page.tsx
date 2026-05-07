export const metadata = {
  title: "Contact · puddingsworld",
};

const CONTACT = {
  email: "geniuspuddingforgames@gmail.com",
  github: "https://github.com/GeniusPudding",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          contact
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Get in touch.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-secondary">
          The fastest way to reach me is email. I read everything; replies
          take a few days.
        </p>
      </header>

      <section className="mt-10 space-y-4">
        <ContactRow label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
        <ContactRow
          label="GitHub"
          value={CONTACT.github.replace("https://", "")}
          href={CONTACT.github}
          external
        />
      </section>

      <p className="mt-12 text-sm text-ink-muted">
        For consulting / custom development inquiries, please mention your
        rough scope, timeline, and budget so I can tell you quickly whether
        I&apos;m a good fit.
      </p>
    </main>
  );
}

function ContactRow({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-bg-border bg-bg-panel px-5 py-4">
      <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="font-mono text-sm text-ink-primary hover:text-accent"
      >
        {value}
      </a>
    </div>
  );
}
