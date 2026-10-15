import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <nav className="nav"><Link className="brand" href="/">iwe<span>.</span></Link><div><Link href="/privacy">Privacy</Link><Link className="nav-button" href="/dashboard">Open demo</Link></div></nav>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">WAEC MATHEMATICS • LOW DATA • 13+</p>
          <h1>Small lessons.<br /><em>Steady progress.</em></h1>
          <p className="lead">Iwe turns the chat apps learners already use into a five-minute daily study habit—grounded in trusted WAEC-aligned learning bites.</p>
          <div className="actions"><Link className="primary" href="/sign-up">Start learning <span>→</span></Link><Link className="secondary" href="/dashboard">Try the demo</Link><a className="secondary how-link" href="#how">How Iwe works</a></div>
          <p className="quiet">No public profiles. No scoreboards. Just learning that stays with you.</p>
        </div>
        <div className="phone" aria-label="Example Iwe lesson message">
          <div className="phone-top"><span className="dot" /> iwe <small>online</small></div>
          <div className="chat-date">TODAY, 6:00 PM</div>
          <div className="bubble"><b>Today’s 5-minute bite</b><br />Angles on a straight line add to <b>180°</b>.<br /><span>Read · Listen · Try a question</span></div>
          <div className="bubble question"><b>Quick check</b><br />One angle is 65°. The other is?<div className="reply">115°</div><div className="reply">125°</div></div>
          <div className="bubble success">✓ Nice work, Amina. Your 4-day streak is growing.</div>
        </div>
      </section>
      <section id="how" className="pillars">
        <article><span>01</span><h2>One clear bite</h2><p>Short, cited explanations that match what learners need for WAEC Mathematics.</p></article>
        <article><span>02</span><h2>Practice now</h2><p>Three quick checks help a learner remember, not just scroll past a lesson.</p></article>
        <article><span>03</span><h2>Keep showing up</h2><p>Gentle reminders and invite-only circles make progress feel possible every day.</p></article>
      </section>
    </main>
  );
}
