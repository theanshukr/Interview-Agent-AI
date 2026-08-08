import { useLocation, Link } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.12),_transparent_28%)] p-6 text-foreground">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card/90 p-8 text-center shadow-xl shadow-black/5 backdrop-blur">
                <div className="space-y-2">
                    <h1 className="text-7xl font-light text-muted-foreground/70">404</h1>
                    <div className="mx-auto h-0.5 w-16 bg-border" />
                </div>
                <div className="mt-6 space-y-3">
                    <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        The page <span className="font-medium text-foreground">"{pageName}"</span> could not be found in this application.
                    </p>
                </div>
                <div className="mt-8">
                    <Link to="/" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}