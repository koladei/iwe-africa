import Link from "next/link";

export default function PrivacyPage() {
  return <main className="legal"><Link className="brand" href="/">iwe<span>.</span></Link><p className="eyebrow">PRIVACY, IN PLAIN LANGUAGE</p><h1>Your learning is yours.</h1><p>Iwe is designed for learners aged 13 and above. We keep only what helps your learning work: an account, a display name, a messaging identity if you connect one, your settings, and your lesson progress.</p><h2>What we never make public</h2><p>Your quiz answers, scores, streak counts, study history, and contact details are not public. Study circles show only a member’s chosen name and whether they completed today’s learning.</p><h2>Your choices</h2><p>You can change your reminder, leave a circle, unlink a chat account, or request deletion of your learning account. Iwe does not collect your school, home address, exact location, or date of birth.</p><Link className="primary" href="/dashboard">Return to Iwe</Link></main>;
}
