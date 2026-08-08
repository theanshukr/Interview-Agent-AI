import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.12),_transparent_28%)] px-4 py-8 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/90 p-8 shadow-xl shadow-black/5 backdrop-blur">
        <div className="text-center">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">Access Restricted</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="rounded-xl border border-border bg-surface/70 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">If you believe this is an error, you can:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
