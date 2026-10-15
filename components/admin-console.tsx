"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Privilege = { key: string; title: string; description: string };
type Role = { id: string; slug: string; name: string; description: string; isBuiltIn: boolean; privileges: { privilege: Privilege }[]; _count?: { memberships: number } };
type Topic = { id: string; title: string };
type User = { id: string; name: string; email: string; roleMemberships: { role: { id: string; name: string } }[]; directPrivileges: { privilege: Privilege }[]; effectivePrivileges: string[] };

type ProviderId = "whatsapp" | "telegram" | "openai";
type SettingDefinition = { key: string; label: string; help: string; secret?: boolean; optional?: boolean; placeholder: string };
type ProviderDefinition = { id: ProviderId; eyebrow: string; title: string; description: string; settings: SettingDefinition[]; setup: { title: string; detail: string; items: { label: string; value: string }[] } };

const providerConfiguration: ProviderDefinition[] = [
  {
    id: "whatsapp",
    eyebrow: "WHATSAPP CLOUD API",
    title: "WhatsApp credentials & webhooks",
    description: "Set the credentials Iwe needs to verify incoming messages and deliver learning reminders through WhatsApp.",
    settings: [
      { key: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone number ID", help: "Find this in Meta Developer Console → WhatsApp → API Setup.", placeholder: "Paste the phone number ID" },
      { key: "WHATSAPP_ACCESS_TOKEN", label: "Permanent access token", help: "Use a Meta system-user token with WhatsApp messaging permissions.", secret: true, placeholder: "Paste a new access token" },
      { key: "WHATSAPP_VERIFY_TOKEN", label: "Webhook verify token", help: "Use the same private token when completing Meta’s webhook verification.", secret: true, placeholder: "Enter a verification token" },
      { key: "WHATSAPP_APP_SECRET", label: "Meta app secret", help: "Used only to validate signed webhook requests from Meta.", secret: true, placeholder: "Paste the app secret" },
      { key: "WHATSAPP_REMINDER_TEMPLATE", label: "Reminder template name", help: "The exact name of an approved WhatsApp template for scheduled reminders.", optional: true, placeholder: "For example: daily_study_reminder" },
    ],
    setup: {
      title: "Meta webhook setup",
      detail: "Copy these details into Meta Developer Console → WhatsApp → Configuration.",
      items: [
        { label: "Callback URL", value: "https://iwe.cradlesoft.tech/api/webhooks/whatsapp" },
        { label: "Verification", value: "Use the webhook verify token stored above" },
        { label: "Subscription fields", value: "Subscribe to messages" },
      ],
    },
  },
  {
    id: "telegram",
    eyebrow: "TELEGRAM BOT API",
    title: "Telegram bot connection",
    description: "Connect Iwe to Telegram with a bot token and a private secret for validating webhook deliveries.",
    settings: [
      { key: "TELEGRAM_BOT_TOKEN", label: "Bot token", help: "Create or retrieve this token from BotFather. It is used to send Iwe messages.", secret: true, placeholder: "Paste a new bot token" },
      { key: "TELEGRAM_WEBHOOK_SECRET", label: "Webhook secret", help: "A private value Telegram includes with each webhook request for Iwe to verify.", secret: true, placeholder: "Enter a webhook secret" },
    ],
    setup: {
      title: "Telegram webhook setup",
      detail: "Register this endpoint as the bot webhook and supply the same secret token stored above.",
      items: [
        { label: "Webhook URL", value: "https://iwe.cradlesoft.tech/api/webhooks/telegram" },
        { label: "Secret token", value: "Use the webhook secret stored above" },
        { label: "Quick check", value: "Send /start in a private test chat" },
      ],
    },
  },
  {
    id: "openai",
    eyebrow: "AI EXPLANATIONS",
    title: "OpenAI explanation fallback",
    description: "Optionally configure concise, lesson-grounded explanations. Iwe keeps its curated explanation available if this service is unavailable.",
    settings: [
      { key: "OPENAI_API_KEY", label: "API key", help: "Used server-side only when a learner asks for an explanation in a different way.", secret: true, placeholder: "Paste a new API key" },
      { key: "OPENAI_MODEL", label: "Model", help: "Optional. Leave this unset to use Iwe’s default explanation model.", optional: true, placeholder: "For example: gpt-4o-mini" },
    ],
    setup: {
      title: "How explanations stay private",
      detail: "Iwe sends only the current lesson, question, answer rationale, and source metadata to the model.",
      items: [
        { label: "Never sent", value: "Names, contact details, or unrelated learner history" },
        { label: "Fallback", value: "The curated lesson explanation remains available" },
      ],
    },
  },
];

const can = (grants: string[], privilege: string) => grants.includes(privilege);

export function AdminConsole({ name, effectivePrivileges }: { name: string; effectivePrivileges: string[] }) {
  const [section, setSection] = useState<"content" | "settings" | "access">(can(effectivePrivileges, "content.read") ? "content" : can(effectivePrivileges, "configuration.read") ? "settings" : "access");
  const [message, setMessage] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalogue, setCatalogue] = useState<Privilege[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [settings, setSettings] = useState<Record<string, boolean>>({});

  async function load() {
    const requests: Promise<void>[] = [];
    if (can(effectivePrivileges, "content.read")) requests.push(fetch("/api/admin/content").then(async (response) => { if (response.ok) { const body = await response.json(); setLessons(body.lessons); setTopics(body.topics); } }));
    if (can(effectivePrivileges, "configuration.read")) requests.push(fetch("/api/admin/configuration").then(async (response) => { if (response.ok) setSettings((await response.json()).settings); }));
    if (can(effectivePrivileges, "access.roles.manage")) requests.push(fetch("/api/admin/access/roles").then(async (response) => { if (response.ok) { const body = await response.json(); setRoles(body.roles); setCatalogue(body.privileges); } }));
    if (can(effectivePrivileges, "access.assignments.manage") || can(effectivePrivileges, "access.direct-grants.manage")) requests.push(fetch("/api/admin/access/users").then(async (response) => { if (response.ok) setUsers((await response.json()).users); }));
    await Promise.all(requests);
  }

  useEffect(() => { void load(); }, []);
  const tabs = useMemo(() => [
    can(effectivePrivileges, "content.read") && ["content", "Content"],
    can(effectivePrivileges, "configuration.read") && ["settings", "Settings"],
    (can(effectivePrivileges, "access.roles.manage") || can(effectivePrivileges, "access.assignments.manage") || can(effectivePrivileges, "access.direct-grants.manage")) && ["access", "Access"],
  ].filter(Boolean) as ["content" | "settings" | "access", string][], [effectivePrivileges]);

  return <main className="admin-shell"><nav className="nav"><Link className="brand" href="/">iwe<span>.</span></Link><div><Link href="/app">Learner view</Link><span className="admin-user">{name}</span></div></nav><section className="admin-main"><p className="eyebrow">ADMINISTRATION · PRIVILEGE-BASED</p><h1>Manage Iwe safely.</h1><p className="admin-lead">Your access is the combined set of privileges assigned directly to you and through your roles.</p><div className="admin-tabs">{tabs.map(([id, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>{label}</button>)}</div>{message && <p className="admin-message">{message}</p>}
    {section === "content" && <ContentPanel grants={effectivePrivileges} lessons={lessons} topics={topics} refresh={load} say={setMessage} />}
    {section === "settings" && <SettingsPanel grants={effectivePrivileges} settings={settings} refresh={load} say={setMessage} />}
    {section === "access" && <AccessPanel grants={effectivePrivileges} roles={roles} catalogue={catalogue} users={users} refresh={load} say={setMessage} />}
  </section></main>;
}

function ContentPanel({ grants, lessons, topics, refresh, say }: any) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  async function action(url: string) { const response = await fetch(url, { method: "POST" }); say(response.ok ? "Content updated." : (await response.json()).error ?? "Unable to update content."); if (response.ok) await refresh(); }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const questions = [0, 1, 2].map((index) => ({ prompt: String(form.get(`q${index}`)), explanation: String(form.get(`e${index}`)), options: [0, 1, 2, 3].map((option) => ({ label: String(form.get(`q${index}o${option}`)), isCorrect: String(form.get(`q${index}correct`)) === String(option) })) }));
    const response = await fetch("/api/admin/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: String(form.get("slug")), topicId, title, conceptBite: String(form.get("conceptBite")), sourceTitle: String(form.get("sourceTitle")), sourceUrl: String(form.get("sourceUrl")), order: Number(form.get("order")), questions }) });
    const body = await response.json(); say(response.ok ? "Draft created." : body.error ?? "Unable to create draft."); if (response.ok) { setCreating(false); await refresh(); }
  }
  return <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Learning content</h2><p>Only published lessons reach learners and messaging channels. Revisions keep the current lesson live until approval.</p></div>{can(grants, "content.create") && <button className="primary" onClick={() => setCreating(!creating)}>{creating ? "Close editor" : "Create draft"}</button>}</div>
    {creating && <form className="admin-form" onSubmit={create}><label>Title<input value={title} onChange={(event) => { setTitle(event.target.value); }} required /></label><label>URL-safe slug<input name="slug" required placeholder="fractions-equivalent-values" /></label><label>Topic<select value={topicId} onChange={(event) => setTopicId(event.target.value)} required><option value="">Choose topic</option>{topics.map((topic: Topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></label><label>Display order<input name="order" type="number" min="1" required /></label><label className="wide">Concept Bite (150 words maximum)<textarea name="conceptBite" required /></label><label>Source title<input name="sourceTitle" required /></label><label>Source URL<input name="sourceUrl" type="url" required /></label>{[0,1,2].map((index) => <fieldset key={index}><legend>Question {index + 1}</legend><label>Prompt<input name={`q${index}`} required /></label><label>Explanation<input name={`e${index}`} required /></label>{[0,1,2,3].map((option) => <label key={option}>Option {option + 1}<input name={`q${index}o${option}`} required /></label>)}<label>Correct option<select name={`q${index}correct`} defaultValue="0">{[0,1,2,3].map((option) => <option key={option} value={option}>Option {option + 1}</option>)}</select></label></fieldset>)}<button className="primary">Save draft</button></form>}
    <div className="admin-list">{lessons.map((lesson: any) => <article key={lesson.id}><div><p className="eyebrow">{lesson.status} · {lesson.topic.title}</p><h3>{lesson.title}</h3><p>{lesson.revisionOf ? `Revision of ${lesson.revisionOf.title}` : lesson.sourceTitle}</p></div><div className="admin-actions">{lesson.status === "PUBLISHED" && can(grants, "content.update") && <button className="secondary" onClick={() => action(`/api/admin/content/${lesson.id}/revision`)}>Create revision</button>}{lesson.status === "DRAFT" && can(grants, "content.publish") && <button className="primary" onClick={() => action(`/api/admin/content/${lesson.id}/publish`)}>Publish</button>}{lesson.status === "PUBLISHED" && can(grants, "content.archive") && <button className="secondary" onClick={() => action(`/api/admin/content/${lesson.id}/archive`)}>Archive</button>}</div></article>)}</div></section>;
}

function SettingsPanel({ grants, settings, refresh, say }: any) {
  const [providerId, setProviderId] = useState<ProviderId>("whatsapp");
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const provider = providerConfiguration.find((entry) => entry.id === providerId) ?? providerConfiguration[0];
  const configuredCount = Object.values(settings).filter(Boolean).length;
  const totalCount = Object.keys(settings).length;
  const canUpdate = can(grants, "configuration.update");

  async function save(event: FormEvent<HTMLFormElement>, key: string) {
    event.preventDefault();
    const value = values[key]?.trim();
    if (!value) return;
    setSavingKey(key);
    try {
      const response = await fetch("/api/admin/configuration", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, value }) });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      say(response.ok ? `${provider.settings.find((setting) => setting.key === key)?.label ?? "Configuration value"} stored securely.` : body?.error ?? "Unable to save setting.");
      if (response.ok) {
        setValues((current) => ({ ...current, [key]: "" }));
        await refresh();
      }
    } catch {
      say("Unable to reach the server. Check the deployment and try again.");
    } finally {
      setSavingKey(null);
    }
  }

  return <section className="configuration-panel">
    <header className="configuration-header">
      <div><p className="eyebrow">ENCRYPTED PROVIDER SETTINGS</p><h2>Configuration center</h2><p>Organize credentials by service, see what is ready, and replace values without exposing anything already stored.</p></div>
      <div className="configuration-progress" aria-label={`${configuredCount} of ${totalCount} settings configured`}><span>{configuredCount}/{totalCount}</span><small>settings ready</small></div>
    </header>
    <div className="configuration-security"><span aria-hidden="true">●</span><p><b>Stored securely.</b> Provider values are encrypted at rest and are never displayed in this portal after saving.</p><em>Server-side only</em></div>
    <div className="provider-tabs" role="tablist" aria-label="Provider configuration">
      {providerConfiguration.map((entry) => {
        const ready = entry.settings.filter((setting) => settings[setting.key]).length;
        return <button key={entry.id} type="button" role="tab" aria-selected={providerId === entry.id} className={providerId === entry.id ? "active" : ""} onClick={() => setProviderId(entry.id)}><span>{entry.title.replace(" credentials & webhooks", "").replace(" connection", "").replace(" explanation fallback", "")}</span><small>{ready}/{entry.settings.length} ready</small></button>;
      })}
    </div>
    <div className="provider-layout">
      <section className="provider-credentials" aria-labelledby={`${provider.id}-title`}>
        <div className="provider-heading"><div><p className="eyebrow">{provider.eyebrow}</p><h3 id={`${provider.id}-title`}>{provider.title}</h3><p>{provider.description}</p></div><span className={provider.settings.every((setting) => setting.optional || settings[setting.key]) ? "provider-state ready" : "provider-state"}>{provider.settings.filter((setting) => settings[setting.key]).length} of {provider.settings.length} stored</span></div>
        <div className="provider-fields">
          {provider.settings.map((setting) => <form className="configuration-field" key={setting.key} onSubmit={(event) => void save(event, setting.key)}>
            <label htmlFor={setting.key}><span><b>{setting.label}{!setting.optional && <i>Required</i>}</b><small>{setting.help}</small></span><span className={settings[setting.key] ? "configured" : "not-configured"}>{settings[setting.key] ? "Configured" : "Not configured"}</span></label>
            {canUpdate && <div className="configuration-input"><input id={setting.key} type={setting.secret ? "password" : "text"} autoComplete="off" value={values[setting.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [setting.key]: event.target.value }))} placeholder={settings[setting.key] ? `Replace: ${setting.placeholder}` : setting.placeholder} required /><button className="secondary" disabled={savingKey === setting.key}>{savingKey === setting.key ? "Saving…" : settings[setting.key] ? "Replace" : "Save"}</button></div>}
          </form>)}
        </div>
        {!canUpdate && <p className="configuration-read-only">You can view configuration status. Ask a staff member with configuration-update access to replace a value.</p>}
      </section>
      <aside className="provider-setup"><p className="eyebrow">SETUP NOTES</p><h3>{provider.setup.title}</h3><p>{provider.setup.detail}</p><dl>{provider.setup.items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></aside>
    </div>
  </section>;
}

function AccessPanel({ grants, roles, catalogue, users, refresh, say }: any) {
  const [newRole, setNewRole] = useState({ slug: "", name: "", description: "", privilegeKeys: [] as string[] });
  async function createRole(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/admin/access/roles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(newRole) }); say(response.ok ? "Custom role created." : (await response.json()).error ?? "Unable to create role."); if (response.ok) { setNewRole({ slug: "", name: "", description: "", privilegeKeys: [] }); await refresh(); } }
  async function replace(url: string, body: unknown) { const response = await fetch(url, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); say(response.ok ? "Access assignment updated." : (await response.json()).error ?? "Unable to update access."); if (response.ok) await refresh(); }
  return <section className="admin-panel"><h2>Roles and direct grants</h2><p>Effective access is the unique union of role privileges and direct grants. The privilege catalogue is reviewed in code and cannot be changed here.</p>{can(grants, "access.roles.manage") && <><h3>Create custom role</h3><form className="admin-form" onSubmit={createRole}><label>Role name<input value={newRole.name} onChange={(event) => setNewRole({ ...newRole, name: event.target.value })} required /></label><label>Slug<input value={newRole.slug} onChange={(event) => setNewRole({ ...newRole, slug: event.target.value.toLowerCase() })} required /></label><label className="wide">Description<input value={newRole.description} onChange={(event) => setNewRole({ ...newRole, description: event.target.value })} required /></label><fieldset className="wide"><legend>Privileges</legend>{catalogue.map((privilege: Privilege) => <label className="check" key={privilege.key}><input type="checkbox" checked={newRole.privilegeKeys.includes(privilege.key)} onChange={(event) => setNewRole({ ...newRole, privilegeKeys: event.target.checked ? [...newRole.privilegeKeys, privilege.key] : newRole.privilegeKeys.filter((key) => key !== privilege.key) })} />{privilege.title}</label>)}</fieldset><button className="primary">Create role</button></form></>}<div className="admin-list">{roles.map((role: Role) => <article key={role.id}><div><p className="eyebrow">{role.isBuiltIn ? "BUILT-IN" : "CUSTOM"} · {role._count?.memberships ?? 0} members</p><h3>{role.name}</h3><p>{role.privileges.map((grant) => grant.privilege.key).join(", ")}</p></div></article>)}</div><h3>Users</h3><div className="admin-list">{users.map((user: User) => <article key={user.id}><div><h3>{user.name}</h3><p>{user.email}</p><p><b>Roles:</b> {user.roleMemberships.map((membership) => membership.role.name).join(", ") || "None"}</p><p><b>Effective:</b> {user.effectivePrivileges.join(", ") || "Learner access only"}</p></div><div className="admin-actions">{can(grants, "access.assignments.manage") && <button className="secondary" onClick={() => { const roleIds = prompt("Role IDs (comma-separated). Available roles are listed above.", user.roleMemberships.map((membership) => membership.role.id).join(",")); if (roleIds !== null) void replace(`/api/admin/access/users/${user.id}/roles`, { roleIds: roleIds.split(",").map((id) => id.trim()).filter(Boolean) }); }}>Set roles</button>}{can(grants, "access.direct-grants.manage") && <button className="secondary" onClick={() => { const privilegeKeys = prompt("Privilege keys (comma-separated).", user.directPrivileges.map((grant) => grant.privilege.key).join(",")); if (privilegeKeys !== null) void replace(`/api/admin/access/users/${user.id}/privileges`, { privilegeKeys: privilegeKeys.split(",").map((key) => key.trim()).filter(Boolean) }); }}>Set direct grants</button>}</div></article>)}</div></section>;
}
