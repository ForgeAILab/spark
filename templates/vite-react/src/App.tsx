import { Link, Route } from 'wouter';
import { Router } from './router';

export default function App() {
  return (
    <main>
      <h1>Welcome to spark</h1>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
      </nav>
      <Router>
        <Route path="/">Home content</Route>
        <Route path="/about">About content</Route>
      </Router>
    </main>
  );
}
