import Link from 'next/link';
import { Container } from '@asko/ui';

export function Footer() {
  return (
    <footer className="bg-dark text-text-muted">
      <Container>
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="text-xl font-bold text-text-on-dark">
              ASKO
            </Link>
            <p className="mt-3 text-sm leading-relaxed">
              Modern platform for your business needs.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-on-dark uppercase tracking-wider">Product</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/#features" className="text-sm hover:text-text-on-dark transition-colors">Features</Link></li>
              <li><Link href="/#about" className="text-sm hover:text-text-on-dark transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-on-dark uppercase tracking-wider">Account</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/login" className="text-sm hover:text-text-on-dark transition-colors">Sign in</Link></li>
              <li><Link href="/register" className="text-sm hover:text-text-on-dark transition-colors">Sign up</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-on-dark uppercase tracking-wider">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="#" className="text-sm hover:text-text-on-dark transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm hover:text-text-on-dark transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-deep py-6 text-center text-sm">
          &copy; {new Date().getFullYear()} ASKO. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
