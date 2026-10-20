import { signOut } from '../api.js';
import Logo from './Logo.jsx';

const LINKS = [
  ['', 'Tableau de bord'],
  ['depenses', 'Dépenses'],
  ['budgets', 'Budgets'],
  ['defi', 'Défi du jour'],
];

export default function Nav({ route, user }) {
  return (
    <header className="nav">
      <a href="#/" className="brand" aria-label="Pécule, tableau de bord"><Logo />Pécule</a>
      <nav aria-label="Navigation principale">
        {LINKS.map(([path, label]) => (
          <a key={path} href={`#/${path}`} aria-current={route === path ? 'page' : undefined}>{label}</a>
        ))}
      </nav>
      <div className="nav-user">
        <span className="muted" title={user.email}>{user.name || user.email}</span>
        <button className="btn ghost small" onClick={signOut}>Déconnexion</button>
      </div>
    </header>
  );
}
