export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="font-display text-4xl text-text-heading mb-4">University Portal</h1>
      <p className="text-text-body text-lg mb-8">GlimmoraTeam — Monorepo canary page</p>
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-card bg-brand-primary" title="brand-primary" />
        <div className="w-16 h-16 rounded-card bg-brand-sand" title="brand-sand" />
        <div className="w-16 h-16 rounded-card bg-brand-forest" title="brand-forest" />
        <div className="w-16 h-16 rounded-card bg-brand-teal" title="brand-teal" />
        <div className="w-16 h-16 rounded-card bg-brand-gold" title="brand-gold" />
      </div>
    </main>
  )
}
