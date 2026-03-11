import { Role } from '@asko/shared';

export default function Home() {
  return (
    <main>
      <h1>ASKO Admin</h1>
      <p>Roles: {Object.values(Role).join(', ')}</p>
    </main>
  );
}
