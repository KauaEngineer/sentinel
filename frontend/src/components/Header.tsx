import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-card-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-bold text-white">Sentinel</h1>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/alerts" className="hover:text-white transition-colors">
            Alertas
          </Link>
        </nav>
      </div>
    </header>
  );
}
