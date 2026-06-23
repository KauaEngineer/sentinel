import Link from "next/link";

const FEATURES = [
  {
    title: "Monitoramento em tempo real",
    desc: "Health checks periodicos em todos os servicos, com status visual (online/offline) atualizado automaticamente a cada ciclo.",
    icon: "📡",
  },
  {
    title: "Arquitetura event-driven",
    desc: "Falhas detectadas sao publicadas no Kafka. Consumers independentes processam os eventos — persistencia e alertas desacoplados.",
    icon: "⚡",
  },
  {
    title: "Analise de padroes",
    desc: "Deteccao automatica de concentracao horaria de falhas, sequencias consecutivas e degradacao de performance.",
    icon: "📊",
  },
  {
    title: "Alertas automaticos",
    desc: "Sistema de alertas que dispara em falhas consecutivas e resolve sozinho quando o servico volta ao normal.",
    icon: "🔔",
  },
];

const STACK = [
  "FastAPI",
  "Apache Kafka",
  "PostgreSQL",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Docker",
  "Kubernetes",
  "AWS (EKS / RDS / S3)",
  "Terraform",
  "GitHub Actions",
];

const FLOW = [
  { label: "Mock APIs", sub: "5 servicos simulados" },
  { label: "Monitor", sub: "FastAPI health checks" },
  { label: "Kafka", sub: "service-events" },
  { label: "Consumers", sub: "persister + alerting" },
  { label: "PostgreSQL", sub: "eventos + alertas" },
  { label: "Dashboard", sub: "Next.js em tempo real" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-card-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-white">Sentinel</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/KauaEngineer/sentinel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-card border border-card-border rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">
            Plataforma de monitoramento full-stack
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight mb-6">
          Monitore servicos
          <br />
          <span className="text-accent">em tempo real</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Sentinel detecta falhas automaticamente, analisa padroes e dispara
          alertas — usando FastAPI, Kafka, Kubernetes e AWS. Um projeto que
          demonstra arquitetura event-driven de ponta a ponta.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="bg-accent hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Explorar Dashboard
          </Link>
          <a
            href="https://github.com/KauaEngineer/sentinel"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-card-border hover:border-slate-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Ver Codigo
          </a>
        </div>

        <p className="text-xs text-slate-600 mt-6">
          O dashboard roda com dados simulados nesta demo — o sistema completo
          sobe localmente com <code className="text-slate-400">docker compose up</code>
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-card-border rounded-xl p-6"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture flow */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-3">
          Como funciona
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto text-sm">
          O monitor publica eventos no Kafka. Consumers independentes processam
          esses eventos sem acoplamento — facil de escalar e estender.
        </p>

        <div className="flex flex-col md:flex-row items-stretch justify-center gap-3">
          {FLOW.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3 flex-1">
              <div className="bg-card border border-card-border rounded-xl p-4 text-center w-full">
                <p className="text-white font-semibold text-sm">{step.label}</p>
                <p className="text-xs text-slate-500 mt-1">{step.sub}</p>
              </div>
              {i < FLOW.length - 1 && (
                <span className="text-accent hidden md:block">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          Stack tecnologica
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {STACK.map((tech) => (
            <span
              key={tech}
              className="bg-card border border-card-border text-slate-300 text-sm px-4 py-2 rounded-lg"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="bg-card border border-card-border rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Veja o dashboard em acao
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm">
            Status em tempo real, graficos de resposta, historico de eventos e
            analise de padroes de falha.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-accent hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Abrir Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Desenvolvido por{" "}
            <span className="text-slate-300 font-medium">Kaua Santos</span>
          </p>
          <a
            href="https://github.com/KauaEngineer/sentinel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            github.com/KauaEngineer/sentinel
          </a>
        </div>
      </footer>
    </div>
  );
}
