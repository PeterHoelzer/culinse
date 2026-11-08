"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Notice, Wordmark } from "@/components/ui";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); } else { setDone(true); }
    setLoading(false);
  };

  const mismatch = confirm.length > 0 && password !== confirm ? "Passwords do not match." : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line">
        <div className="max-w-content mx-auto flex h-16 items-center px-4 sm:px-6">
          <Wordmark />
        </div>
      </header>
      <main className="max-w-content mx-auto w-full flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-md">
          {done ? (
            <div>
              <h1 className="text-h1-sm sm:text-h1">Password updated</h1>
              <Notice tone="success" className="mt-4 mb-6">You can now log in with your new password.</Notice>
              <Button href="/login">Go to login</Button>
            </div>
          ) : (
            <>
              <h1 className="text-h1-sm sm:text-h1">New password</h1>
              <p className="mt-2 mb-6 text-body-lg text-ink-2">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  hint="At least 6 characters"
                />
                <Input
                  label="Confirm password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  error={mismatch}
                />
                {error && !mismatch && <Notice tone="error">{error}</Notice>}
                <div>
                  <Button type="submit" loading={loading}>Update password</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
