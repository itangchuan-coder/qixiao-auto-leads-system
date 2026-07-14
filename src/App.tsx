import { lazy, Suspense } from 'react'

const Application = lazy(() => import('./components/app/Application'))

export default function App() {
  return <Suspense fallback={null}><Application /></Suspense>
}
