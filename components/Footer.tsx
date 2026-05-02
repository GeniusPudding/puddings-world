import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-bg-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 sm:flex-row sm:items-center">
        <p className="font-mono text-xs text-ink-muted">
          © {new Date().getFullYear()} puddingsworld
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
          <li>
            <Link
              href="/contact"
              className="text-ink-muted transition-colors hover:text-accent"
            >
              contact
            </Link>
          </li>
          <li>
            <a
              href="https://github.com/GeniusPudding"
              target="_blank"
              rel="noreferrer"
              className="text-ink-muted transition-colors hover:text-accent"
            >
              github ↗
            </a>
          </li>
          <li>
            <a
              href="https://github.com/GeniusPudding/puddings-world"
              target="_blank"
              rel="noreferrer"
              className="text-ink-muted transition-colors hover:text-accent"
            >
              source ↗
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
