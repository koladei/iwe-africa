import Link from "next/link";

export default async function JoinCircle({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  return <main className="legal"><Link className="brand" href="/">iwe<span>.</span></Link><p className="eyebrow">PRIVATE STUDY CIRCLE</p><h1>Learn with people you know.</h1><p>This invite lets you join a private Iwe circle. Other members can only see your display name and whether you completed today’s study bite—never your answers, score, or learning history.</p><Link className="primary" href={`/sign-in?join=${encodeURIComponent(token)}`}>Sign in to review and join</Link></main>;
}
