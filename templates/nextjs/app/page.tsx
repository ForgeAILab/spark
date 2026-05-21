export default function Home() {
  return (
    <main>
      <h1>{'{{appName}}'}</h1>
      <p>
        Start by reading <a href="./AGENTS.md">AGENTS.md</a> and keeping the
        project plan in the `.ai/` artifacts.
      </p>
      <ul>
        <li>Move one board task to `Approved for execution` before implementation.</li>
        <li>Use `app-skills add &lt;pack&gt;` to add capabilities when the board calls for them.</li>
        <li>Run `bun dev` while working on the app.</li>
      </ul>
    </main>
  );
}
