import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.tsx';
import Materia from './pages/Materia.tsx';
import Topico from './pages/Topico.tsx';

function Header() {
  return (
    <header className="mb-8 flex items-center gap-3">
      <Link
        to="/"
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-soft text-xl shadow-lg shadow-brand/30"
      >
        🎓
      </Link>
      <div>
        <Link
          to="/"
          className="bg-gradient-to-r from-brand-soft to-accent bg-clip-text text-2xl font-extrabold text-transparent"
        >
          ENEM Estudos
        </Link>
        <p className="text-sm text-muted">Mapas mentais · resumos · flashcards · questões</p>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:materiaId" element={<Materia />} />
          <Route path="/:materiaId/:topicoId" element={<Topico />} />
        </Routes>
        <footer className="mt-16 border-t border-border pt-6 text-center text-xs text-muted">
          Feito para estudar de verdade · ENEM Estudos
        </footer>
      </div>
    </BrowserRouter>
  );
}
