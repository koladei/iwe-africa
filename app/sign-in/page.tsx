import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function SignIn() { return <main className="auth-page"><Link className="brand" href="/">iwe<span>.</span></Link><section><p className="eyebrow">WELCOME BACK</p><h1>Keep your learning going.</h1><AuthForm mode="sign-in" /><p>New to Iwe? <Link href="/sign-up">Create an account</Link>.</p></section></main>; }
