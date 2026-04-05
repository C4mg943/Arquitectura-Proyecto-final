import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-headline text-5xl font-extrabold text-primary">404</h1>
      <p className="mt-2 text-on-surface-variant">La página que buscas no existe.</p>
      <Link className="mt-6 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:brightness-110" to="/">
        Volver al dashboard
      </Link>
    </section>
  )
}
