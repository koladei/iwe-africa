import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function SignUp() { return <main className="auth-page"><Link className="brand" href="/">iwe<span>.</span></Link><section><p className="eyebrow">FOR LEARNERS AGED 13+</p><h1>Start with one small step.</h1><AuthForm mode="sign-up" /><p>By continuing, you confirm that you are at least 13. <Link href="/privacy">Read how Iwe protects your privacy</Link>.</p><p>Already have an account? <Link href="/sign-in">Sign in</Link>.</p></section></main>; }
