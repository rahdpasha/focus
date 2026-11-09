import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
  Plus,
  X,
  Sun,
  Settings2,
  Sparkles,
  Leaf,
  Backpack,
  BookOpen,
  ShieldCheck,
  Download,
  Trash2,
  Pencil,
  Bell,
  AlertCircle,
  Globe2,
  GraduationCap,
  Code2,
  Heart,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import {
  createOuting,
  startOuting,
  finishOuting,
  localDate,
  rankTasks,
  wallToInstant,
  type Workspace,
  type Task,
  type Outing,
  type Template,
} from "./domain";
type Modal =
  | "capture"
  | "outing"
  | "template"
  | "memory"
  | "profile"
  | "settings"
  | "ask"
  | null;
import { useMuseWorkspace } from "./useMuseWorkspace";
import { useI18n } from "../useI18n";
import "./muse.css";

export default function MusePage({
  userId,
  displayName,
  advisor,
  studyMinutes,
  onFocus,
  onSettings,
}: {
  userId: string | null;
  displayName?: string;
  advisor: ReactNode;
  studyMinutes: number;
  onFocus: () => void;
  onSettings: () => void;
}) {
  const workspace = useMuseWorkspace(userId, displayName);
  const { data, ready, busy, error, status, retry } = workspace;
  const { language, tr: t } = useI18n();
  const [page, setPage] = useState("today"),
    [modal, setModal] = useState<Modal>(null),
    [filter, setFilter] = useState("all"),
    [toast, setToast] = useState(""),
    [editing, setEditing] = useState<Task | null>(null),
    [editingTemplate, setEditingTemplate] = useState<Template | null>(null),
    [editingMemory, setEditingMemory] = useState<
      Workspace["memories"][number] | null
    >(null);
  const [clock, setClock] = useState(new Date()),
    [notification, setNotification] = useState(""),
    [activeOutingId, setActiveOutingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const ku = language === "ku";
  const today = localDate(clock),
    openTasks = rankTasks(data.tasks, today),
    current =
      data.outings.find((o) => o.id === activeOutingId) ??
      data.outings.find((o) =>
        ["preparing", "out", "returning"].includes(o.state),
      );
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (modal) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [modal]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  async function save(next: Workspace, message = "") {
    const ok = await workspace.save(next);
    if (ok && message) setToast(message);
    return ok;
  }
  function openCapture(task: Task | null = null) {
    setEditing(task);
    setModal("capture");
  }
  async function patchOuting(o: Outing) {
    return save({
      ...data,
      outings: data.outings.map((v) => (v.id === o.id ? o : v)),
    });
  }
  async function newOuting(template: Template) {
    if (
      data.outings.some((o) =>
        ["preparing", "out", "returning"].includes(o.state),
      )
    ) {
      setToast(
        t(
          "Finish or skip your current outing first.",
          "سەرەتا دەرچوونە ئێستاکەت تەواو بکە یان تێپەڕێنە.",
        ),
      );
      return;
    }
    const o = createOuting(template);
    if (await save({ ...data, outings: [o, ...data.outings] })) {
      setActiveOutingId(o.id);
      setModal(null);
      setPage("today");
    }
  }
  const statusName = (s: string) =>
    ({
      preparing: t("Getting ready", "ئامادەکاری"),
      out: t("Out and about", "لە دەرەوە"),
      returning: t("Return check", "پشکنینی گەڕانەوە"),
      finished: t("Finished", "تەواوبوو"),
      skipped: t("Not checked", "نەپشکنراو"),
    })[s] ?? s;
  const kindName = (s: string) =>
    ({
      task: t("Task", "ئەرک"),
      deadline: t("Deadline", "وادە"),
      event: t("Event", "ڕووداو"),
      goal: t("Goal", "ئامانج"),
    })[s] ?? s;
  const areaName = (s: string) =>
    ({
      university: t("University", "زانکۆ"),
      engineering: t("Engineering", "ئەندازیاری"),
      personal: t("Personal", "کەسی"),
      english: t("English", "ئینگلیزی"),
    })[s] ?? s;
  const dateLabel = (v: string | null) =>
    !v
      ? t("No date", "بێ بەروار")
      : v === today
        ? t("Today", "ئەمڕۆ")
        : new Intl.DateTimeFormat(ku ? "ckb" : "en-GB", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }).format(new Date(v + "T12:00:00Z"));
  const stampLabel = (v: string) =>
    new Intl.DateTimeFormat(ku ? "ckb" : "en-GB", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Baghdad",
    }).format(new Date(v));
  async function submitTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      reminder = String(f.get("reminder") || "");
    const task: Task = {
      id: editing?.id ?? crypto.randomUUID(),
      title: String(f.get("title")).trim(),
      kind: f.get("kind") as Task["kind"],
      area: f.get("area") as Task["area"],
      due: String(f.get("due") || "") || null,
      important: f.get("important") === "on",
      done: editing?.done ?? false,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      completedAt: editing?.completedAt ?? null,
      reminderAt: reminder
        ? wallToInstant(reminder)
        : (editing?.reminderAt ?? null),
      reminderStatus: reminder
        ? "pending"
        : (editing?.reminderStatus ?? "pending"),
    };
    if (f.get("clearReminder")) {
      task.reminderAt = null;
      task.reminderStatus = "dismissed";
    }
    if (
      await save(
        {
          ...data,
          tasks: editing
            ? data.tasks.map((v) => (v.id === editing.id ? task : v))
            : [task, ...data.tasks],
        },
        t(
          "Saved. One less thing to hold in your head.",
          "پاشەکەوت کرا. شتێکی کەمتر بۆ بیرکردنەوە.",
        ),
      )
    )
      setModal(null);
  }
  async function testNotification() {
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setNotification(
          t(
            "Notifications are unavailable in this browser. On iPhone, try an installed Home Screen app.",
            "ئاگادارکردنەوە لەم وێبگەڕەدا بەردەست نییە.",
          ),
        );
        return;
      }
      const p = await Notification.requestPermission();
      if (p !== "granted") {
        setNotification(
          t(
            "Permission not granted. In-app reminders still work.",
            "ڕێگەپێدان نییە. بیرخستنەوەی ناو ئەپ کار دەکات.",
          ),
        );
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) {
        setNotification(
          t(
            "Open the app again once its service worker is ready.",
            "دوای ئامادەبوونی ئەپ دووبارە بیکەرەوە.",
          ),
        );
        return;
      }
      await registration.showNotification("Muse · Test notification", {
        body: t(
          "A little reminder, when it matters.",
          "بیرخستنەوەیەکی بچووک، لە کاتی پێویستدا.",
        ),
        tag: "muse-diagnostic",
        icon: "/favicon.svg",
      });
      setNotification(
        t(
          "Test requested. Confirm on your device. This does not test closed-app scheduling or guarantee sound.",
          "تاقیکردنەوە نێردرا. لە ئامێرەکەت بپشکنە؛ ئەمە تاقیکردنەوەی کاتی داخستنی ئەپ نییە.",
        ),
      );
    } catch {
      setNotification(
        t(
          "The browser could not show the test. Check notification settings.",
          "وێبگەڕ نەتوانی تاقیکردنەوەکە پیشان بدات. ڕێکخستنەکان بپشکنە.",
        ),
      );
    }
  }
  function exportData() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [
          !ready
            ? workspace.rawBackup()
            : JSON.stringify(
                { version: 1, exportedAt: new Date().toISOString(), ...data },
                null,
                2,
              ),
        ],
        { type: "application/json" },
      ),
    );
    a.download = `muse-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Baghdad",
    }).format(clock),
  );
  function renderTaskRow(task: Task) {
    return (
      <div key={task.id} className={"task-row " + (task.done ? "done" : "")}>
        <button
          className={"check-button " + (task.done ? "checked" : "")}
          aria-label={
            t(
              task.done ? "Reopen " : "Complete ",
              task.done ? "کردنەوە " : "تەواوکردنی ",
            ) + task.title
          }
          disabled={busy}
          onClick={() =>
            save({
              ...data,
              tasks: data.tasks.map((v) =>
                v.id === task.id
                  ? {
                      ...v,
                      done: !v.done,
                      completedAt: !v.done ? new Date().toISOString() : null,
                    }
                  : v,
              ),
            })
          }
        >
          {task.done && <Check size={14} />}
        </button>
        <button className="task-detail" onClick={() => openCapture(task)}>
          <span>
            {task.title}
            {task.important && (
              <span className="priority-dot" title={t("Important", "گرنگ")} />
            )}
          </span>
          <small>
            {areaName(task.area)} <span>·</span> {kindName(task.kind)}
          </small>
        </button>
        <span
          className={
            "due " +
            (task.due && task.due < today && !task.done ? "overdue" : "")
          }
        >
          {task.due && task.due < today && !task.done
            ? t("Overdue · ", "دواکەوتوو · ")
            : ""}
          {dateLabel(task.due)}
        </span>
      </div>
    );
  }
  function renderOutingView(o: Outing) {
    const returning = o.state === "returning",
      preparing = o.state === "preparing",
      items = returning
        ? o.items.filter((i) => i.departure === "ready")
        : o.items;
    return (
      <section className="outing-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{statusName(o.state)}</span>
            <h2>{o.name}</h2>
          </div>
          <span className="round-icon">
            <Backpack size={22} />
          </span>
        </div>
        <p className="muted">
          {preparing
            ? t(
                "Tell Muse what you are taking. Nothing is checked for you.",
                "دیاری بکە چی لەگەڵ خۆت دەبەیت.",
              )
            : returning
              ? t(
                  "Check the things you took. This confirms what you have now, not that you arrived home.",
                  "ئەو شتانە بپشکنە کە بردووتن. ئەمە گەیشتن بە ماڵ پشتڕاست ناکاتەوە.",
                )
              : t(
                  "Your departure is saved. When you are ready, check that everything is still with you.",
                  "دەرچوونەکەت پاشەکەوت کرا. لە کاتی گەڕانەوە شتەکانت بپشکنە.",
                )}
        </p>
        {o.state === "out" ? (
          <>
            <div className="taken-items">
              {o.items
                .filter((i) => i.departure === "ready")
                .map((i) => (
                  <span key={i.id}>
                    <Check size={13} />
                    {i.name}
                  </span>
                ))}
            </div>
            <button
              className="primary"
              disabled={busy}
              onClick={() => patchOuting({ ...o, state: "returning" })}
            >
              {t("Check my belongings", "پشکنینی شتەکانم")}
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="checklist">
              {items.map((i) => (
                <div className="checklist-row" key={i.id}>
                  <strong>{i.name}</strong>
                  <div className="segments">
                    {(returning
                      ? ["have", "missing", "na"]
                      : ["ready", "not-taking", "na"]
                    ).map((s) => (
                      <button
                        key={s}
                        disabled={busy}
                        className={
                          (returning ? i.returned : i.departure) === s
                            ? "selected " + (s === "missing" ? "danger" : "")
                            : ""
                        }
                        onClick={() =>
                          patchOuting({
                            ...o,
                            items: o.items.map((v) =>
                              v.id === i.id
                                ? {
                                    ...v,
                                    ...(returning
                                      ? {
                                          returned:
                                            s as Outing["items"][number]["returned"],
                                        }
                                      : {
                                          departure:
                                            s as Outing["items"][number]["departure"],
                                        }),
                                  }
                                : v,
                            ),
                          })
                        }
                      >
                        {
                          {
                            have: t("Have it", "لامە"),
                            missing: t("Missing", "ونە"),
                            na: t("N/A", "پەیوەندی نییە"),
                            ready: t("Ready", "ئامادەیە"),
                            "not-taking": t("Not taking", "نایبەم"),
                          }[s]
                        }
                      </button>
                    ))}
                    {preparing && (
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={t("Remove ", "سڕینەوەی ") + i.name}
                        onClick={() =>
                          patchOuting({
                            ...o,
                            items: o.items.filter((v) => v.id !== i.id),
                          })
                        }
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {preparing && (
              <button
                className="text-button"
                disabled={busy || !o.items.length}
                onClick={async () => {
                  if (
                    await save({
                      ...data,
                      templates: [
                        ...data.templates,
                        {
                          id: crypto.randomUUID(),
                          name: o.name,
                          items: o.items.map((i) => i.name),
                        },
                      ],
                    })
                  )
                    setToast(
                      t(
                        "Saved as a reusable template.",
                        "وەک قاڵب پاشەکەوت کرا.",
                      ),
                    );
                }}
              >
                {t(
                  "Save this list as a template",
                  "پاشەکەوتکردنی ئەم لیستە وەک قاڵب",
                )}
              </button>
            )}
            {preparing && (
              <form
                className="inline-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    name = String(new FormData(form).get("item")).trim();
                  if (
                    name &&
                    (await patchOuting({
                      ...o,
                      items: [
                        ...o.items,
                        {
                          id: crypto.randomUUID(),
                          name,
                          departure: "unanswered",
                          returned: "unanswered",
                        },
                      ],
                    }))
                  )
                    form.reset();
                }}
              >
                <input
                  name="item"
                  aria-label={t(
                    "Add an outing item",
                    "زیادکردنی شت بۆ دەرچوون",
                  )}
                  placeholder={t("Anything else to take?", "شتی تر دەبەیت؟")}
                  maxLength={100}
                  required
                />
                <button
                  className="icon-button"
                  disabled={busy || o.items.length >= 30}
                  aria-label={t("Add item", "زیادکردنی شت")}
                >
                  <Plus size={18} />
                </button>
              </form>
            )}
            <div className="button-row">
              <button
                className="primary"
                disabled={
                  busy ||
                  (preparing
                    ? !o.items.length ||
                      o.items.some((i) => i.departure === "unanswered")
                    : items.some((i) => i.returned === "unanswered"))
                }
                onClick={() =>
                  patchOuting(preparing ? startOuting(o) : finishOuting(o))
                }
              >
                {preparing
                  ? t("Start outing", "دەستپێکردنی دەرچوون")
                  : t("Finish check", "تەواوکردنی پشکنین")}
                <ArrowRight size={16} />
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  patchOuting({
                    ...o,
                    state: "skipped",
                    finishedAt: new Date().toISOString(),
                  })
                }
              >
                {t("Skip this check", "تێپەڕاندنی ئەم پشکنینە")}
              </button>
            </div>
          </>
        )}
      </section>
    );
  }
  return (
    <section className="muse">
      <header className="muse-header">
        <div>
          <span className="eyebrow">
            {t("FOCUS + MUSE · ONE WORKSPACE", "فۆکەس + میوز · یەک شوێن")}
          </span>
          <strong className="muse-wordmark">
            muse<span>.</span>
          </strong>
        </div>
        <button className="outline" onClick={onFocus}>
          <ArrowLeft size={15} />
          {t("Back to focus", "گەڕانەوە بۆ سەرنج")}
        </button>
      </header>
      <nav
        className="muse-tabs"
        aria-label={t("Muse navigation", "ڕێنیشاندەری میوز")}
      >
        {[
          { id: "today", en: "Today", ku: "ئەمڕۆ", icon: Sun },
          { id: "life", en: "My life", ku: "ژیانم", icon: Backpack },
          { id: "memory", en: "Memory", ku: "بیرگە", icon: BookOpen },
          { id: "assistant", en: "Assistant", ku: "یاریدەدەر", icon: Sparkles },
        ].map((n) => (
          <button
            key={n.id}
            aria-current={page === n.id ? "page" : undefined}
            onClick={() => setPage(n.id)}
          >
            <n.icon size={17} />
            {t(n.en, n.ku)}
          </button>
        ))}
        <button
          className="muse-options"
          aria-label={t(
            "Muse privacy and sync",
            "تایبەتمەندی و هاوکاتکردنی میوز",
          )}
          onClick={() => setModal("settings")}
        >
          <Settings2 size={17} />
        </button>
      </nav>
      <div className="muse-body">
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => void retry()}>
              {t("Retry", "دووبارە")}
            </button>
            {status === "conflict" && (
              <button onClick={() => setModal("settings")}>
                {t("Resolve", "چارەسەر")}
              </button>
            )}
          </div>
        )}
        {!ready ? (
          <div className="loading-state">
            <Leaf size={38} />
            <h1>{t("A little room for you.", "کەمێک شوێن بۆ تۆ.")}</h1>
            <p>
              {error
                ? t(
                    "Your private workspace will appear once connected.",
                    "شوێنی تایبەتیت دوای پەیوەستبوون دەردەکەوێت.",
                  )
                : t("Opening your space…", "کردنەوەی شوێنەکەت…")}
            </p>
          </div>
        ) : (
          <>
            {page === "today" && (
              <>
                <div className="page-title">
                  <div>
                    <div className="eyebrow date-line">
                      <span className="live-dot" />
                      {new Intl.DateTimeFormat(ku ? "ckb" : "en-GB", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        timeZone: "Asia/Baghdad",
                      }).format(clock)}
                      <span>·</span>
                      {t("Baghdad time", "کاتی بەغدا")}
                    </div>
                    <h1>
                      {hour < 12
                        ? t("Good morning", "بەیانی باش")
                        : hour < 17
                          ? t("Good afternoon", "نیوەڕۆ باش")
                          : t("Good evening", "ئێوارە باش")}
                      , {data.profile.name}
                      <span className="greeting-dot">.</span>
                    </h1>
                    <p>
                      {t(
                        "Let’s make room for what matters today.",
                        "با شوێن بۆ ئەوە بکەینەوە کە ئەمڕۆ گرنگە.",
                      )}
                    </p>
                  </div>
                  <button className="outline" onClick={() => setModal("ask")}>
                    <Sparkles size={16} />
                    {t("Ask Muse", "لە میوز بپرسە")}
                  </button>
                </div>
                <section className="hero">
                  <div className="hero-copy">
                    <span className="eyebrow">
                      {t(
                        "A calmer kind of productive",
                        "بەرهەمدارییەکی ئارامتر",
                      )}
                    </span>
                    <h2>
                      {openTasks.length
                        ? t("One thing at a time.", "یەک شت لە هەر کاتێکدا.")
                        : t(
                            "A clear mind.\nA little more space.",
                            "بیرێکی ڕوون.\nکەمێک شوێنی زیاتر.",
                          )}
                    </h2>
                    <p>
                      {openTasks.length
                        ? t(
                            `${openTasks.length} open ${openTasks.length === 1 ? "responsibility" : "responsibilities"}. Choose what deserves your attention; the rest can wait.`,
                            `${openTasks.length} بەرپرسیارێتی کراوە. دیاری بکە چی شایەنی سەرنجتە.`,
                          )
                        : t(
                            "You don’t need to plan your whole life.\nJust put down the next thing on your mind.",
                            "پێویست ناکات پلانی هەموو ژیانت دابنێیت.\nتەنها شتی داهاتووی ناو بیرت تۆمار بکە.",
                          )}
                    </p>
                    <button className="hero-cta" onClick={() => openCapture()}>
                      {t("Get it off your mind", "بیخەرە دەرەوەی بیرت")}
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                  <div className="orb-art" aria-hidden="true">
                    <div className="orbit o1" />
                    <div className="orbit o2" />
                    <div className="orbit o3" />
                    <div className="orb">
                      <Leaf size={64} strokeWidth={0.7} />
                    </div>
                    <span className="orbit-speck s1" />
                    <span className="orbit-speck s2" />
                    <span className="orbit-speck s3" />
                  </div>
                  <span className="hero-foot">
                    {t(
                      "LESS NOISE. MORE INTENTION.",
                      "دەنگی کەمتر. مەبەستی زیاتر.",
                    )}
                  </span>
                </section>
                <div className="dashboard-grid">
                  <div className="left-column">
                    <section className="priorities-section">
                      <div className="section-heading">
                        <h2>
                          {t("What matters today", "ئەوەی ئەمڕۆ گرنگە")}
                          <span className="count">{openTasks.length}</span>
                        </h2>
                        <button
                          className="text-button"
                          onClick={() => setPage("life")}
                        >
                          {t("View all", "هەمووی ببینە")}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      {openTasks.length ? (
                        <>
                          <p className="small-muted">
                            {t(
                              "Overdue and due-today items first, then your important ones.",
                              "سەرەتا دواکەوتوو و ئەوەی ئەمڕۆیە، پاشان گرنگەکان.",
                            )}
                          </p>
                          {openTasks
                            .slice(0, 3)
                            .map((task) => renderTaskRow(task))}
                          <button
                            className="add-line"
                            onClick={() => openCapture()}
                          >
                            <Plus size={16} />
                            {t(
                              "Add a responsibility",
                              "زیادکردنی بەرپرسیارێتی",
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="empty-tasks">
                          <span className="empty-symbol">
                            <CheckCheck size={23} />
                          </span>
                          <h3>
                            {t(
                              "Nothing you have to hold onto.",
                              "هیچ شتێک نییە لە بیرت بگریت.",
                            )}
                          </h3>
                          <p>
                            {t(
                              "Add an assignment, a commitment, or something you want to follow through on.",
                              "ئەرکێک، بەڵێنێک یان شتێک زیاد بکە کە دەتەوێت تەواوی بکەیت.",
                            )}
                          </p>
                          <button
                            className="text-button"
                            onClick={() => openCapture()}
                          >
                            <Plus size={15} />
                            {t(
                              "Add your first responsibility",
                              "یەکەم بەرپرسیارێتیت زیاد بکە",
                            )}
                          </button>
                        </div>
                      )}
                    </section>
                    {current &&
                    ["preparing", "out", "returning"].includes(
                      current.state,
                    ) ? (
                      renderOutingView(current)
                    ) : (
                      <section className="departure-card">
                        <div className="round-icon">
                          <Backpack size={23} />
                        </div>
                        <div>
                          <span className="eyebrow">
                            {t("Before you go", "پێش ئەوەی بڕۆیت")}
                          </span>
                          <h2>
                            {t("Everything with you?", "هەموو شتێکت لەگەڵە؟")}
                          </h2>
                          <p>
                            {t(
                              "A quick check now. One less worry later.",
                              "پشکنینێکی خێرا ئێستا. نیگەرانییەکی کەمتر دواتر.",
                            )}
                          </p>
                        </div>
                        <button
                          className="primary"
                          onClick={() => setModal("outing")}
                        >
                          {t("Start an outing", "دەستپێکردنی دەرچوون")}
                          <ArrowRight size={16} />
                        </button>
                      </section>
                    )}
                    {data.tasks
                      .filter(
                        (v) =>
                          !v.done &&
                          v.reminderAt &&
                          v.reminderStatus === "pending" &&
                          v.reminderAt <= clock.toISOString(),
                      )
                      .map((v) => (
                        <div className="reminder-banner" key={v.id}>
                          <Bell size={19} />
                          <div>
                            <strong>{v.title}</strong>
                            <small>
                              {t("In-app reminder", "بیرخستنەوەی ناو ئەپ")}
                            </small>
                          </div>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() =>
                              save({
                                ...data,
                                tasks: data.tasks.map((a) =>
                                  a.id === v.id
                                    ? {
                                        ...a,
                                        reminderAt: new Date(
                                          Date.now() + 600000,
                                        ).toISOString(),
                                      }
                                    : a,
                                ),
                              })
                            }
                          >
                            {t("10 min", "١٠ خولەک")}
                          </button>
                          <button
                            className="icon-button"
                            aria-label={t(
                              "Dismiss reminder",
                              "لابردنی بیرخستنەوە",
                            )}
                            onClick={() =>
                              save({
                                ...data,
                                tasks: data.tasks.map((a) =>
                                  a.id === v.id
                                    ? { ...a, reminderStatus: "dismissed" }
                                    : a,
                                ),
                              })
                            }
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                  <aside className="right-column">
                    <section className="direction">
                      <div className="muse-study-link">
                        <span>
                          {t(
                            "From your FOCUS sessions",
                            "لە سێشنەکانی فۆکەسەوە",
                          )}
                        </span>
                        <strong>
                          {studyMinutes} {t("min today", "خولەک ئەمڕۆ")}
                        </strong>
                      </div>
                      <span className="eyebrow">
                        {t("Your bigger picture", "وێنە گەورەکەت")}
                      </span>
                      <h2>
                        {t(
                          "A direction, not a race.",
                          "ئاڕاستەیەک، نەک پێشبڕکێ.",
                        )}
                      </h2>
                      <div className="directions">
                        {data.profile.priorities.map((p, i) => {
                          const Icon = [
                            GraduationCap,
                            Code2,
                            MessageCircle,
                            Heart,
                            Leaf,
                          ][i];
                          return (
                            <div key={i}>
                              <Icon size={18} />
                              <span>{p}</span>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setModal("profile")}
                      >
                        {t("Adjust my priorities", "ڕێکخستنی ئەولەویەتەکانم")}
                        <ArrowUpRight size={14} />
                      </button>
                    </section>
                    <section className="quiet-note">
                      <span className="tiny-leaf">
                        <Sparkles size={19} />
                      </span>
                      <h3>
                        {t(
                          "Useful, when it’s ready.",
                          "سوودبەخش، کاتێک ئامادەیە.",
                        )}
                      </h3>
                      <p>
                        {t(
                          "Your sourced morning briefing comes in a later phase. For now, we’re building a dependable foundation.",
                          "پوختەی بەیانی لە قۆناغێکی دواتر دێت. ئێستا بنەمایەکی متمانەپێکراو دروست دەکەین.",
                        )}
                      </p>
                      <span className="phase-tag">
                        {t("FOUNDATION · PHASE 01", "بنەما · قۆناغی ٠١")}
                      </span>
                    </section>
                  </aside>
                </div>
              </>
            )}
            {page === "life" && (
              <>
                <div className="page-title">
                  <div>
                    <span className="eyebrow">
                      {t("Everything in its place", "هەموو شتێک لە شوێنی خۆی")}
                    </span>
                    <h1>
                      {t("My life", "ژیانم")}
                      <span className="greeting-dot">.</span>
                    </h1>
                    <p>
                      {t(
                        "Responsibilities, intentions, and the things you take with you.",
                        "بەرپرسیارێتی، مەبەست و ئەو شتانەی لەگەڵ خۆت دەیبەیت.",
                      )}
                    </p>
                  </div>
                  <button className="primary" onClick={() => openCapture()}>
                    <Plus size={17} />
                    {t("Add responsibility", "زیادکردنی بەرپرسیارێتی")}
                  </button>
                </div>
                <div className="filter-bar">
                  {[
                    "all",
                    "task",
                    "deadline",
                    "event",
                    "goal",
                    "completed",
                  ].map((f) => (
                    <button
                      className={filter === f ? "active" : ""}
                      key={f}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all"
                        ? t("Open", "کراوە")
                        : f === "completed"
                          ? t("Completed", "تەواوبوو")
                          : kindName(f)}
                    </button>
                  ))}
                </div>
                <section className="list-panel">
                  {data.tasks.filter((v) =>
                    filter === "completed"
                      ? v.done
                      : !v.done && (filter === "all" || v.kind === filter),
                  ).length ? (
                    data.tasks
                      .filter((v) =>
                        filter === "completed"
                          ? v.done
                          : !v.done && (filter === "all" || v.kind === filter),
                      )
                      .map((v) => renderTaskRow(v))
                  ) : (
                    <div className="empty-tasks">
                      <Circle size={24} />
                      <h3>
                        {t("A little breathing room.", "کەمێک هەناسەی ئارام.")}
                      </h3>
                      <p>
                        {t(
                          "Nothing here yet. Add only what is useful.",
                          "هێشتا هیچ نییە. تەنها ئەوە زیاد بکە کە سوودبەخشە.",
                        )}
                      </p>
                    </div>
                  )}
                </section>
                <div className="section-heading spaced">
                  <div>
                    <span className="eyebrow">
                      {t(
                        "Take care of the little things",
                        "گرنگی بە شتە بچووکەکان بدە",
                      )}
                    </span>
                    <h2>{t("Outing templates", "قاڵبی دەرچوون")}</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setModal("template");
                    }}
                  >
                    <Plus size={16} />
                    {t("New template", "قاڵبی نوێ")}
                  </button>
                </div>
                <div className="template-grid">
                  {data.templates.map((v) => (
                    <div className="template-card" key={v.id}>
                      <div className="section-heading">
                        <Backpack size={24} />
                        <button
                          className="icon-button"
                          aria-label={t("Edit ", "دەستکاریکردنی ") + v.name}
                          onClick={() => {
                            setEditingTemplate(v);
                            setModal("template");
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                      <h3>{v.name}</h3>
                      <p>{v.items.join(" · ")}</p>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => newOuting(v)}
                      >
                        {t("Use checklist", "بەکارهێنانی لیست")}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="section-heading spaced">
                  <h2>{t("Outing history", "مێژووی دەرچوون")}</h2>
                </div>
                {!data.outings.length ? (
                  <p className="muted">
                    {t(
                      "Your actual outings will appear here.",
                      "دەرچوونە ڕاستەقینەکانت لێرە دەردەکەون.",
                    )}
                  </p>
                ) : (
                  data.outings.map((o) => (
                    <details className="history-row" key={o.id}>
                      <summary>
                        <span>
                          <strong>{o.name}</strong>
                          <small>{stampLabel(o.createdAt)}</small>
                        </span>
                        <span
                          className={
                            o.items.some((i) => i.returned === "missing")
                              ? "missing-label"
                              : "status-badge"
                          }
                        >
                          {o.items.some((i) => i.returned === "missing")
                            ? t("Missing item", "شتێک ونە")
                            : statusName(o.state)}
                        </span>
                      </summary>
                      <div className="history-content">
                        {o.items.map((i) => (
                          <div key={i.id}>
                            <span>{i.name}</span>
                            <span>
                              {i.departure !== "ready"
                                ? t(
                                    "Not confirmed taken",
                                    "بردنی پشتڕاست نەکراوەتەوە",
                                  )
                                : i.returned === "have"
                                  ? t(
                                      "Had it at return check",
                                      "لە پشکنینی گەڕانەوەدا لای بوو",
                                    )
                                  : i.returned === "missing"
                                    ? t("Missing", "ونە")
                                    : i.returned === "na"
                                      ? t("Not applicable", "پەیوەندی نییە")
                                      : t(
                                          "Return not checked",
                                          "گەڕانەوە نەپشکنراوە",
                                        )}
                            </span>
                            {i.returned === "missing" && (
                              <button
                                className="text-button"
                                disabled={busy}
                                onClick={() =>
                                  patchOuting({
                                    ...o,
                                    items: o.items.map((v) =>
                                      v.id === i.id
                                        ? { ...v, returned: "have" }
                                        : v,
                                    ),
                                  })
                                }
                              >
                                {t("Mark found", "دۆزرایەوە")}
                              </button>
                            )}
                          </div>
                        ))}
                        {["preparing", "out", "returning"].includes(
                          o.state,
                        ) && (
                          <button
                            className="primary"
                            onClick={() => {
                              setActiveOutingId(o.id);
                              setPage("today");
                            }}
                          >
                            {t("Continue outing", "بەردەوامبوونی دەرچوون")}
                          </button>
                        )}
                      </div>
                    </details>
                  ))
                )}
              </>
            )}
            {page === "memory" && (
              <>
                <div className="page-title">
                  <div>
                    <span className="eyebrow">
                      {t("Remember with intention", "بە مەبەست بیر بکەوە")}
                    </span>
                    <h1>
                      {t("What Muse knows", "ئەوەی میوز دەیزانێت")}
                      <span className="greeting-dot">.</span>
                    </h1>
                    <p>
                      {t(
                        "Your words. Your context. Always yours to change.",
                        "وشە و زانیارییەکانی تۆ. هەمیشە دەتوانیت بیگۆڕیت.",
                      )}
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      setEditingMemory(null);
                      setModal("memory");
                    }}
                  >
                    <Plus size={16} />
                    {t("Add a memory", "زیادکردنی بیرەوەری")}
                  </button>
                </div>
                <div className="memory-info">
                  <ShieldCheck size={22} />
                  <p>
                    {t(
                      "Only what you explicitly save is remembered here. Muse memories are not sent to the study advisor or an AI provider.",
                      "تەنها ئەوەی خۆت پاشەکەوتی دەکەیت لێرە دەمێنێت. هیچ زانیارییەک بۆ دابینکەری زیرەکی دەستکرد نانێردرێت.",
                    )}
                  </p>
                </div>
                <section className="list-panel profile-summary">
                  <span className="eyebrow">
                    {t("Profile & priorities", "پرۆفایل و ئەولەویەتەکان")}
                  </span>
                  <h2>{data.profile.name}</h2>
                  <p>{data.profile.priorities.join(" · ")}</p>
                  <button
                    className="text-button"
                    onClick={() => setModal("profile")}
                  >
                    <Pencil size={14} />
                    {t("Review profile", "پێداچوونەوەی پرۆفایل")}
                  </button>
                </section>
                {data.memories.length ? (
                  data.memories.map((m) => (
                    <article className="memory-card" key={m.id}>
                      <span className="eyebrow">
                        {m.kind === "preference"
                          ? t("Long-term preference", "هەڵبژاردنی درێژخایەن")
                          : t("Current context", "زانیاریی ئێستا")}
                      </span>
                      <p>{m.text}</p>
                      <footer>
                        <small>
                          {t("Added by you", "لەلایەن خۆتەوە زیادکراوە")} ·{" "}
                          {stampLabel(m.updatedAt)}
                        </small>
                        <button
                          className="icon-button"
                          aria-label={t(
                            "Edit memory",
                            "دەستکاریکردنی بیرەوەری",
                          )}
                          onClick={() => {
                            setEditingMemory(m);
                            setModal("memory");
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                      </footer>
                    </article>
                  ))
                ) : (
                  <div className="empty-tasks">
                    <BookOpen size={28} />
                    <h3>
                      {t(
                        "An intentionally small memory.",
                        "بیرگەیەکی بچووک بە مەبەست.",
                      )}
                    </h3>
                    <p>
                      {t(
                        "Save a working preference or a current project. You decide what stays.",
                        "هەڵبژاردنێک یان پڕۆژەی ئێستا پاشەکەوت بکە. خۆت بڕیار دەدەیت چی بمێنێت.",
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
            {page === "assistant" && (
              <section className="muse-advisor">
                <p className="memory-info">
                  {t(
                    "Your existing FOCUS study advisor, using the same account and study data. Personal-assistant research and tools will be added gradually.",
                    "ڕاوێژکاری خوێندنی فۆکەس، بە هەمان هەژمار و داتای خوێندن. تایبەتمەندییە نوێکان بە قۆناغ زیاد دەکرێن.",
                  )}
                </p>
                {advisor}
              </section>
            )}
            <footer className="page-footer">
              <span>
                <Leaf size={13} />
                {t(
                  "A little more present. A little less overwhelmed.",
                  "کەمێک ئامادەتر. کەمێک باری کەمتر.",
                )}
              </span>
              <span>
                {busy
                  ? t("Saving…", "پاشەکەوتکردن…")
                  : status === "synced"
                    ? t(
                        "Synced to FOCUS account",
                        "هاوکاتکراو لەگەڵ هەژماری فۆکەس",
                      )
                    : t("Saved on this device", "پاشەکەوتکراو لەم ئامێرە")}
              </span>
            </footer>
          </>
        )}
      </div>
      <dialog
        ref={dialogRef}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setModal(null);
        }}
      >
        <div className="modal-content">
          <button
            className="modal-close icon-button"
            aria-label={t("Close", "داخستن")}
            onClick={() => setModal(null)}
          >
            <X size={20} />
          </button>
          {modal === "capture" && (
            <form onSubmit={submitTask} key={editing?.id ?? "new"}>
              <span className="eyebrow">
                {t("A place to put it", "شوێنێک بۆ تۆمارکردن")}
              </span>
              <h2>
                {editing
                  ? t("Edit responsibility", "دەستکاریکردنی بەرپرسیارێتی")
                  : t("What’s on your mind?", "چی لە بیرتە؟")}
              </h2>
              <label>
                {t("What is it?", "چییە؟")}
                <input
                  autoFocus
                  name="title"
                  required
                  maxLength={300}
                  defaultValue={editing?.title}
                  placeholder={t(
                    "e.g. Finish my database assignment",
                    "بۆ نموونە: تەواوکردنی ئەرکی داتابەیس",
                  )}
                />
              </label>
              <div className="form-grid">
                <label>
                  {t("Type", "جۆر")}
                  <select name="kind" defaultValue={editing?.kind ?? "task"}>
                    {["task", "deadline", "event", "goal"].map((k) => (
                      <option value={k} key={k}>
                        {kindName(k)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("Area", "بوار")}
                  <select
                    name="area"
                    defaultValue={editing?.area ?? "university"}
                  >
                    {["university", "engineering", "english", "personal"].map(
                      (k) => (
                        <option value={k} key={k}>
                          {areaName(k)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <label>
                {t("Date · optional", "بەروار · ئارەزوومەندانە")}
                <input
                  name="due"
                  type="date"
                  defaultValue={editing?.due ?? ""}
                />
              </label>
              <label className="check-label">
                <input
                  name="important"
                  type="checkbox"
                  defaultChecked={editing?.important}
                />
                {t("This is important to me", "ئەمە بۆ من گرنگە")}
              </label>
              <details className="reminder-details">
                <summary>
                  <Bell size={15} />
                  {t("Add an in-app reminder", "زیادکردنی بیرخستنەوەی ناو ئەپ")}
                </summary>
                <p className="small-muted">
                  {t(
                    "Shown when Muse is open. Closed-app alerts are not configured. All times are Asia/Baghdad.",
                    "کاتێک میوز کراوەیە پیشان دەدرێت. هەموو کاتەکان کاتی بەغدان.",
                  )}
                </p>
                {editing?.reminderAt && <p>{stampLabel(editing.reminderAt)}</p>}
                <input
                  type="datetime-local"
                  name="reminder"
                  aria-label={t(
                    "Reminder time in Baghdad",
                    "کاتی بیرخستنەوە بە کاتی بەغدا",
                  )}
                />
                {editing?.reminderAt && (
                  <label className="check-label">
                    <input type="checkbox" name="clearReminder" />
                    {t("Remove existing reminder", "لابردنی بیرخستنەوەی ئێستا")}
                  </label>
                )}
              </details>
              <div className="modal-actions">
                {editing && (
                  <button
                    type="button"
                    className="text-button danger-text"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await save(
                          {
                            ...data,
                            tasks: data.tasks.filter(
                              (v) => v.id !== editing.id,
                            ),
                          },
                          t("Responsibility removed.", "بەرپرسیارێتی لابرا."),
                        )
                      )
                        setModal(null);
                    }}
                  >
                    <Trash2 size={16} />
                    {t("Remove", "لابردن")}
                  </button>
                )}
                <button className="primary" disabled={busy}>
                  {busy
                    ? t("Saving…", "پاشەکەوتکردن…")
                    : t("Save responsibility", "پاشەکەوتکردنی بەرپرسیارێتی")}
                  <Check size={16} />
                </button>
              </div>
            </form>
          )}
          {modal === "outing" && (
            <>
              <span className="eyebrow">
                {t("Before you go", "پێش ئەوەی بڕۆیت")}
              </span>
              <h2>{t("Where are you heading?", "بۆ کوێ دەڕۆیت؟")}</h2>
              <p className="muted">
                {t(
                  "Choose a list, then adjust it for this outing.",
                  "لیستێک هەڵبژێرە، پاشان بۆ ئەم دەرچوونە ڕێکی بخە.",
                )}
              </p>
              <div className="outing-choices">
                {data.templates.map((v) => (
                  <button
                    key={v.id}
                    disabled={busy}
                    onClick={() => newOuting(v)}
                  >
                    <Backpack size={22} />
                    <span>
                      <strong>{v.name}</strong>
                      <small>
                        {v.items.length} {t("items", "شت")}
                      </small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>
              <button
                className="outline full-width"
                disabled={busy}
                onClick={() =>
                  newOuting({
                    id: "temporary",
                    name: t("Spontaneous outing", "دەرچوونی بێ پلان"),
                    items: ["Phone", "Keys"],
                  })
                }
              >
                <Plus size={16} />
                {t("Start a temporary checklist", "دەستپێکردنی لیستێکی کاتی")}
              </button>
            </>
          )}
          {modal === "template" && (
            <form
              key={editingTemplate?.id ?? "new"}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  v = {
                    id: editingTemplate?.id ?? crypto.randomUUID(),
                    name: String(f.get("name")).trim(),
                    items: String(f.get("items"))
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  };
                if (!v.items.length || v.items.length > 30) {
                  setToast(t("Use 1–30 items.", "١–٣٠ شت بەکاربهێنە."));
                  return;
                }
                if (
                  await save({
                    ...data,
                    templates: editingTemplate
                      ? data.templates.map((a) => (a.id === v.id ? v : a))
                      : [...data.templates, v],
                  })
                )
                  setModal(null);
              }}
            >
              <span className="eyebrow">
                {t("Make it yours", "بیکە بە هی خۆت")}
              </span>
              <h2>{t("Outing template", "قاڵبی دەرچوون")}</h2>
              <label>
                {t("Name", "ناو")}
                <input
                  autoFocus
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={editingTemplate?.name}
                />
              </label>
              <label>
                {t("Items · one per line", "شتەکان · هەر شتێک لە هێڵێک")}
                <textarea
                  name="items"
                  rows={6}
                  required
                  defaultValue={editingTemplate?.items.join("\n")}
                  maxLength={3000}
                />
              </label>
              <p className="small-muted">
                {t(
                  "Changes apply to new outings. Past and active outings keep their original list. Recurring schedules come in Phase 2.",
                  "گۆڕانکارییەکان بۆ دەرچوونی نوێن. دەرچوونەکانی پێشوو لیستی خۆیان دەپارێزن.",
                )}
              </p>
              <div className="modal-actions">
                {editingTemplate && (
                  <button
                    className="text-button danger-text"
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await save({
                          ...data,
                          templates: data.templates.filter(
                            (v) => v.id !== editingTemplate.id,
                          ),
                        })
                      )
                        setModal(null);
                    }}
                  >
                    {t("Remove template", "لابردنی قاڵب")}
                  </button>
                )}
                <button className="primary" disabled={busy}>
                  {t("Save template", "پاشەکەوتکردنی قاڵب")}
                </button>
              </div>
            </form>
          )}
          {modal === "memory" && (
            <form
              key={editingMemory?.id ?? "new"}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  m: Workspace["memories"][number] = {
                    id: editingMemory?.id ?? crypto.randomUUID(),
                    text: String(f.get("text")).trim(),
                    kind: f.get("kind") as "preference" | "context",
                    source: "user",
                    updatedAt: new Date().toISOString(),
                  };
                if (
                  await save({
                    ...data,
                    memories: editingMemory
                      ? data.memories.map((v) => (v.id === m.id ? m : v))
                      : [...data.memories, m],
                  })
                )
                  setModal(null);
              }}
            >
              <span className="eyebrow">
                {t("Only what matters", "تەنها ئەوەی گرنگە")}
              </span>
              <h2>{t("Remember this", "ئەمە لە بیر بگرە")}</h2>
              <label>
                {t("What should Muse remember?", "میوز چی لە بیر بگرێت؟")}
                <textarea
                  autoFocus
                  required
                  name="text"
                  maxLength={300}
                  rows={4}
                  defaultValue={editingMemory?.text}
                  placeholder={t(
                    "I prefer explanations with a practical example.",
                    "حەز دەکەم ڕوونکردنەوە لەگەڵ نموونەی کرداریدا بێت.",
                  )}
                />
              </label>
              <label>
                {t("How long is it relevant?", "بۆ چەند ماوەیەک پەیوەندیدارە؟")}
                <select
                  name="kind"
                  defaultValue={editingMemory?.kind ?? "preference"}
                >
                  <option value="preference">
                    {t("Long-term preference", "هەڵبژاردنی درێژخایەن")}
                  </option>
                  <option value="context">
                    {t(
                      "Current context · review manually",
                      "زانیاریی ئێستا · پێداچوونەوەی دەستی",
                    )}
                  </option>
                </select>
              </label>
              <div className="modal-actions">
                {editingMemory && (
                  <button
                    className="text-button danger-text"
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await save({
                          ...data,
                          memories: data.memories.filter(
                            (v) => v.id !== editingMemory.id,
                          ),
                        })
                      )
                        setModal(null);
                    }}
                  >
                    {t("Forget this", "ئەمە لە بیر بکە")}
                  </button>
                )}
                <button className="primary" disabled={busy}>
                  {t("Save memory", "پاشەکەوتکردنی بیرەوەری")}
                </button>
              </div>
            </form>
          )}
          {modal === "profile" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  priorities = String(f.get("priorities"))
                    .split("\n")
                    .map((v) => v.trim())
                    .filter(Boolean);
                if (priorities.length > 5) {
                  setToast(
                    t(
                      "Choose up to five priorities.",
                      "تا پێنج ئەولەویەت هەڵبژێرە.",
                    ),
                  );
                  return;
                }
                if (
                  await save({
                    ...data,
                    profile: {
                      ...data.profile,
                      name: String(f.get("name")).trim(),
                      priorities,
                      timezone: "Asia/Baghdad",
                    },
                  })
                )
                  setModal(null);
              }}
            >
              <span className="eyebrow">
                {t("Your bigger picture", "وێنە گەورەکەت")}
              </span>
              <h2>{t("A few things about you", "چەند شتێک دەربارەی تۆ")}</h2>
              <label>
                {t("Your name", "ناوت")}
                <input
                  autoFocus
                  required
                  name="name"
                  maxLength={50}
                  defaultValue={data.profile.name}
                />
              </label>
              <label>
                {t(
                  "Main priorities · one per line, up to five",
                  "ئەولەویەتەکان · هەر یەکە لە هێڵێک، تا پێنج",
                )}
                <textarea
                  name="priorities"
                  rows={5}
                  maxLength={1500}
                  defaultValue={data.profile.priorities.join("\n")}
                />
              </label>
              <p className="small-muted">
                {t(
                  "Time zone: Asia/Baghdad. Language and appearance are shared with FOCUS Settings.",
                  "ناوچەی کاتی: بەغدا. ناوەڕۆکی کەسی بە زمانی نووسینی خۆت دەمێنێتەوە.",
                )}
              </p>
              <button className="primary full-width" disabled={busy}>
                {t("Save profile", "پاشەکەوتکردنی پرۆفایل")}
              </button>
            </form>
          )}
          {modal === "settings" && (
            <>
              <span className="eyebrow">
                {t("You are in control", "کۆنترۆڵ لە دەستی تۆیە")}
              </span>
              <h2>{t("Settings & privacy", "ڕێکخستن و تایبەتمەندی")}</h2>
              <section className="settings-section">
                <h3>
                  <Bell size={17} />
                  {t("Notification readiness", "ئامادەیی ئاگادارکردنەوە")}
                </h3>
                <p>
                  {t(
                    "Muse reminders appear while this screen is open. FOCUS timer alerts keep their existing behavior; Muse background schedules are not enabled yet.",
                    "بیرخستنەوەی ناو ئەپ بەردەستە. ئاگادارکردنەوەی پاشبنەما هێشتا پەیوەست نەکراوە.",
                  )}
                </p>
                <button className="outline" onClick={testNotification}>
                  {t("Test this device", "تاقیکردنەوەی ئەم ئامێرە")}
                </button>
                {notification && (
                  <p className="notification-result" role="status">
                    {notification}
                  </p>
                )}
                <p className="small-muted">
                  {t(
                    "A test cannot prove exact delivery, sound, or reliability when the app is closed. Those need real-device testing after server setup.",
                    "تاقیکردنەوەکە گەیاندنی ورد یان دەنگ پشتڕاست ناکاتەوە. تاقیکردنەوەی ئامێری ڕاستەقینە پێویستە.",
                  )}
                </p>
              </section>
              {(status === "conflict" || status === "error") && (
                <section className="settings-section">
                  <h3>{t("Recover your workspace", "گەڕاندنەوەی شوێنەکەت")}</h3>
                  <p>
                    {t(
                      "Export this device copy first. Loading cloud data replaces local changes on this device.",
                      "سەرەتا کۆپی ئامێرەکە هەناردە بکە. بارکردنی هەور گۆڕانکارییە ناوخۆییەکان دەگۆڕێت.",
                    )}
                  </p>
                  <button className="outline" onClick={exportData}>
                    <Download size={16} />
                    {t("Export device copy", "هەناردەکردنی کۆپی ئامێر")}
                  </button>
                  <button
                    className="outline"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            "Replace this device copy with your cloud version? Export first to keep local changes.",
                            "کۆپی ئامێر بگۆڕدرێت بە کۆپی هەور؟ سەرەتا هەناردەی بکە.",
                          ),
                        )
                      )
                        void workspace.useCloud();
                    }}
                  >
                    {t("Load cloud version", "بارکردنی کۆپی هەور")}
                  </button>
                </section>
              )}
              <section className="settings-section">
                <h3>
                  <ShieldCheck size={17} />
                  {t("Your information", "زانیارییەکانت")}
                </h3>
                <p>
                  {t(
                    "Muse uses your FOCUS account. A device copy lets you work offline; cloud sync uses the same Supabase project after its additive migration is applied. Muse memories are not sent to AI.",
                    "میوز هەژماری فۆکەس بەکاردەهێنێت. کۆپییەکی ئامێر بۆ کاری بێ ئینتەرنێت هەیە. بیرەوەرییەکان بۆ AI نانێردرێن.",
                  )}
                </p>
                <button className="outline" onClick={exportData}>
                  <Download size={16} />
                  {t("Export my data", "هەناردەکردنی زانیارییەکانم")}
                </button>
                <p className="small-muted">
                  {t(
                    "Remove individual responsibilities, templates, or memories from their edit screens. Current context has manual retention in this phase.",
                    "زانیارییەکان لە پەڕەی دەستکاریکردنیان بسڕەوە. پاراستنی زانیاری لەم قۆناغەدا دەستییە.",
                  )}
                </p>
              </section>
              <button
                className="text-button"
                onClick={() => {
                  setModal(null);
                  onSettings();
                }}
              >
                <Globe2 size={16} />
                {t(
                  "Open shared FOCUS settings",
                  "کردنەوەی ڕێکخستنە هاوبەشەکانی فۆکەس",
                )}
              </button>
            </>
          )}
          {modal === "ask" && (
            <>
              <span className="round-icon">
                <Sparkles size={25} />
              </span>
              <h2>
                {t(
                  "Let’s start with what matters.",
                  "با بەوە دەست پێ بکەین کە گرنگە.",
                )}
              </h2>
              <p className="muted">
                {t(
                  "Your FOCUS study advisor is available here. Broader personal AI tools come later; responsibilities and belongings work now.",
                  "گفتوگۆی زیرەکی دەستکردی میوز هێشتا پەیوەست نییە. بنەمای ئێستا بۆ تۆمارکردنی بەرپرسیارێتی و شتەکانتە.",
                )}
              </p>
              <div className="outing-choices">
                <button
                  onClick={() => {
                    setModal(null);
                    setPage("assistant");
                  }}
                >
                  <Sparkles size={22} />
                  <span>
                    {t("Open my study advisor", "کردنەوەی ڕاوێژکاری خوێندن")}
                  </span>
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => openCapture()}>
                  <Plus size={22} />
                  <span>
                    {t("Put something on my list", "شتێک زیاد بکە بۆ لیستەکەم")}
                  </span>
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => setModal("outing")}>
                  <Backpack size={22} />
                  <span>
                    {t("Help me get ready to leave", "یارمەتیم بدە بۆ دەرچوون")}
                  </span>
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => setModal("profile")}>
                  <Leaf size={22} />
                  <span>
                    {t(
                      "Review what matters to me",
                      "پێداچوونەوە بەوەی بۆ من گرنگە",
                    )}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </dialog>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </section>
  );
}
