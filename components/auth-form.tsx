"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password"), ...(mode === "sign-up" ? { name: form.get("name") } : {}) }) });
    if (!response.ok) { setError("We could not complete that request. Check your details and try again."); setLoading(false); return; }
    router.push("/app"); router.refresh();
  }
  return <form className="auth-form" onSubmit={submit}>{mode === "sign-up" && <label>Your name<input required minLength={2} name="name" autoComplete="name" /></label>}<label>Email address<input required type="email" name="email" autoComplete="email" /></label><label>Password<input required type="password" minLength={10} name="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} /></label>{error && <p className="form-error">{error}</p>}<button className="primary" disabled={loading}>{loading ? "One moment…" : mode === "sign-up" ? "Create my Iwe account" : "Sign in to Iwe"}</button></form>;
}
