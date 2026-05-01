import Link from "next/link";

const LINKS = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/projects", label: "projects" },
  { href: "/services", label: "services" },
  { href: "/now", label: "now" },
  { href: "/contact", label: "contact" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-bg-border bg-bg-base/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight text-ink-primary hover:text-accent"
        >
          puddingsworld
        </Link>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {LINKS.slice(1).map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-mono text-ink-secondary transition-colors hover:text-ink-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
