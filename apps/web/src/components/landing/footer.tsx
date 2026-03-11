import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@asko/ui';

export function LandingFooter() {
  return (
    <footer className="bg-dark text-page-bg/60 py-8">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/">
            <Image
              src="/images/logo.svg"
              alt="ASKO"
              width={65}
              height={20}
              className="brightness-0 invert"
            />
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-page-bg transition-colors">Политика конфиденциальности</Link>
            <Link href="#" className="hover:text-page-bg transition-colors">Условия использования</Link>
          </div>
          <span className="text-sm">&copy; {new Date().getFullYear()} ASKO. Все права защищены.</span>
        </div>
      </Container>
    </footer>
  );
}
