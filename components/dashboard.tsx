"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { seedLessons, topicOrder } from "@/lib/lessons";

type Tab = "learn" | "progress" | "circle" | "settings";

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("learn");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [circle, setCircle] = useState(false);
  const [reminder, setReminder] = useState("18:00");
  const lesson = seedLessons[lessonIndex];
  const score = Object.entries(answers).filter(([questionIndex, optionIndex]) => lesson.questions[Number(questionIndex)].options[Number(optionIndex)].correct).length;
  const allAnswered = Object.keys(answers).length === lesson.questions.length;
  const completed = finished ? 1 : 0;

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${lesson.title}. ${lesson.bite}`));
  }

  function switchLesson(index: number) {
    setLessonIndex(index); setAnswers({}); setFinished(false); setTab("learn");
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/">iwe<span>.</span></Link>
      <p className="user-label">LEARNER SPACE</p>
      <nav className="side-nav">
        <Nav label="Today’s bite" active={tab === "learn"} onClick={() => setTab("learn")} icon="◐" />
        <Nav label="My progress" active={tab === "progress"} onClick={() => setTab("progress")} icon="↗" />
        <Nav label="My circle" active={tab === "circle"} onClick={() => setTab("circle")} icon="○" />
        <Nav label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} icon="⚙" />
      </nav>
      <div className="safe-note"><b>Private by default</b><br />Only you see your scores and answers.</div>
      <Link className="text-link" href="/privacy">Privacy, simply explained</Link>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-header"><div><p className="eyebrow">MONDAY · 5-MINUTE SESSION</p><h1>{tab === "learn" ? "A little today goes a long way." : tab === "progress" ? "Your learning path" : tab === "circle" ? "Study, together—privately." : "Make Iwe yours."}</h1></div><div className="profile"><span>AM</span><div><b>Amina</b><small>WAEC Mathematics</small></div></div></header>
      {tab === "learn" && <Learn lessonIndex={lessonIndex} lesson={lesson} answers={answers} setAnswers={setAnswers} allAnswered={allAnswered} score={score} finished={finished} complete={() => setFinished(true)} speak={speak} selectLesson={switchLesson} />}
      {tab === "progress" && <Progress completed={completed} onLessonClick={switchLesson} />}
      {tab === "circle" && <Circle circle={circle} setCircle={setCircle} />}
      {tab === "settings" && <Settings reminder={reminder} setReminder={setReminder} />}
    </section>
  </main>;
}

function Nav({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={active ? "active" : ""}><span>{icon}</span>{label}</button>;
}

function Learn({ lesson, lessonIndex, answers, setAnswers, allAnswered, score, finished, complete, speak, selectLesson }: any) {
  const topicLessons = useMemo(() => seedLessons.filter((entry) => entry.topic === lesson.topic), [lesson.topic]);
  return <div className="learn-grid">
    <article className="lesson-card">
      <div className="lesson-meta"><span>{lesson.topic.toUpperCase()}</span><span>LESSON {lessonIndex + 1} OF 12</span></div>
      <h2>{lesson.title}</h2><p className="concept">{lesson.bite}</p>
      <div className="lesson-tools"><button onClick={speak}>◖ Listen</button><a href={lesson.sourceUrl} target="_blank" rel="noreferrer">↗ Source: {lesson.sourceTitle}</a></div>
      <div className="checkin"><div><p className="eyebrow">CHECK YOUR UNDERSTANDING</p><h3>Three quick questions</h3></div><span>{Object.keys(answers).length}/3</span></div>
      {lesson.questions.map((question: any, qIndex: number) => <div className="question-card" key={question.prompt}><p><b>{qIndex + 1}.</b> {question.prompt}</p><div className="options">{question.options.map((option: any, optionIndex: number) => {
        const selected = answers[qIndex] === optionIndex; const revealed = allAnswered;
        return <button key={option.label} disabled={allAnswered} onClick={() => setAnswers((value: any) => ({ ...value, [qIndex]: optionIndex }))} className={`${selected ? "selected " : ""}${revealed && option.correct ? "correct" : ""}${revealed && selected && !option.correct ? "wrong" : ""}`}>{option.label}</button>;
      })}</div>{allAnswered && <p className="explanation">{question.explanation}</p>}</div>)}
      {allAnswered && !finished && <button className="primary complete" onClick={complete}>Finish today’s bite · {score}/3 correct <span>→</span></button>}
      {finished && <div className="completion"><b>✓ You showed up today.</b><span>Lesson complete · Your streak is now 4 days.</span></div>}
    </article>
    <aside className="lesson-rail"><div className="streak"><p>YOUR STEADY STREAK</p><strong>4</strong><span>days in a row</span><div className="week"><i className="done" /> <i className="done" /> <i className="done" /> <i className="done" /> <i /> <i /> <i /></div></div><div className="topic-list"><p className="eyebrow">KEEP LEARNING</p>{topicLessons.map((entry) => <button onClick={() => selectLesson(seedLessons.indexOf(entry))} className={entry.slug === lesson.slug ? "current" : ""} key={entry.slug}><span>{entry.slug === lesson.slug ? "●" : "○"}</span>{entry.title}</button>)}</div></aside>
  </div>;
}

function Progress({ completed, onLessonClick }: { completed: number; onLessonClick: (index: number) => void }) {
  return <div className="progress-view"><section className="stat-grid"><Stat value={completed ? "1" : "0"} label="lessons completed" /><Stat value="4" label="day steady streak" /><Stat value="12" label="curated lesson bites" /></section><section className="library"><div><p className="eyebrow">YOUR WAEC MATHS LIBRARY</p><h2>Choose the next small step.</h2></div>{topicOrder.map((topic) => <div className="topic-row" key={topic}><h3>{topic}</h3><div>{seedLessons.filter((lesson) => lesson.topic === topic).map((lesson) => <button key={lesson.slug} onClick={() => onLessonClick(seedLessons.indexOf(lesson))}>{lesson.title}<span>→</span></button>)}</div></div>)}</section></div>;
}
function Stat({ value, label }: { value: string; label: string }) { return <article className="stat"><strong>{value}</strong><span>{label}</span></article>; }
function Circle({ circle, setCircle }: { circle: boolean; setCircle: (value: boolean) => void }) { return <div className="circle-view"><section><p className="eyebrow">INVITE-ONLY · NO SCORES SHARED</p><h2>{circle ? "Even small circles make a difference." : "You don’t have to study alone."}</h2><p>Share a little encouragement with people you already know. Your answers, scores, and study history always stay private.</p>{circle ? <div className="invite"><b>Weekday Maths Circle</b><span>Invite link ready · expires in 7 days</span><code>iwe.africa/join/learn-8F2P</code><button className="secondary">Copy private invite</button></div> : <button className="primary" onClick={() => setCircle(true)}>Create a private study circle <span>→</span></button>}</section><aside className="circle-rules"><b>What your circle sees</b><p>• Your chosen name</p><p>• Whether you completed today</p><b>What stays yours</b><p>• Your answers and scores</p><p>• Your streak and lesson history</p></aside></div>; }
function Settings({ reminder, setReminder }: { reminder: string; setReminder: (value: string) => void }) { return <div className="settings"><section><p className="eyebrow">YOUR LEARNING RHYTHM</p><h2>When should Iwe check in?</h2><label>Daily reminder <input type="time" value={reminder} onChange={(event) => setReminder(event.target.value)} /></label><label>Timezone <select defaultValue="Africa/Lagos"><option>Africa/Lagos (WAT)</option><option>Africa/Accra (GMT)</option><option>Africa/Nairobi (EAT)</option></select></label><button className="primary">Save my learning settings</button></section><aside><b>Connected channels</b><p><span className="channel-dot" /> Telegram — ready to link</p><p><span className="channel-dot muted" /> WhatsApp — ready when approved</p><button className="secondary">Send a dashboard link to Telegram</button></aside></div>; }
