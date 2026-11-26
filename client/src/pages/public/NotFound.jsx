import { ArrowLeft } from 'lucide-react';
import Seo from '../../components/seo/Seo';
import Button from '../../components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found | Hospitality369" noindex />
      <section className="container-page flex min-h-[70vh] flex-col items-center justify-center pb-20 pt-36 text-center">
        <p className="font-display text-[120px] leading-none text-brand-300">404</p>
        <h1 className="mt-4 text-4xl font-medium">This table isn't set yet</h1>
        <p className="mt-3 max-w-md text-navy-500">The page you're looking for doesn't exist or has moved.</p>
        <div className="mt-8 flex gap-3">
          <Button to="/" icon={ArrowLeft}>Back home</Button>
          <Button to="/recruiting" variant="outline">View open roles</Button>
        </div>
      </section>
    </>
  );
}
