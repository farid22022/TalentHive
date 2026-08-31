import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Button } from '../components/Button.jsx';

/** Empty-state placeholder for pages arriving in later phases. */
export default function Placeholder({ title = 'Coming soon', phase }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <Construction className="h-12 w-12 text-brand-500" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">
        This section is part of the incremental build{phase ? ` (${phase})` : ''}. The foundation and
        authentication are live — more marketplace features are landing phase by phase.
      </p>
      <Link to="/" className="mt-6"><Button variant="secondary">Back to home</Button></Link>
    </div>
  );
}
