import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as conversationsApi from "../../api/conversations";
import { useAuth } from "../../contexts/AuthContext";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useTranslation } from "../../i18n/LanguageContext.jsx";
import { useDashboardWorkspace } from "../../pages/dashboard/DashboardWorkspaceContext.jsx";
import { formatShortDate } from "../../pages/dashboard/dashboardUtils.js";

function formatMessageTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return formatShortDate(value);
  }
}

export function DashboardMessages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isClientPortal = !!user?.isClientPortal;
  const { clients } = useDashboardWorkspace();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pickClientId, setPickClientId] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externals, setExternals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadEndRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const loadConversations = useCallback(async () => {
    const items = await conversationsApi.fetchConversations();
    setConversations(items);
    return items;
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    const items = await conversationsApi.fetchMessages(conversationId);
    setMessages(items);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let items = await loadConversations();
      if (isClientPortal && user?.clientId) {
        if (items.length === 0) {
          const opened = await conversationsApi.openConversation(user.clientId);
          items = [opened];
          setConversations(items);
        }
        setActiveId(items[0]?.id ?? "");
      } else {
        setActiveId((current) => current || items[0]?.id || "");
      }
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "messagesPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isClientPortal, loadConversations, t, user?.clientId]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
    const timer = window.setInterval(() => {
      void loadMessages(activeId);
      void loadConversations();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [activeId, loadConversations, loadMessages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleOpenClient() {
    if (!pickClientId) return;
    setError("");
    try {
      const item = await conversationsApi.openConversation(pickClientId);
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== item.id);
        return [item, ...rest];
      });
      setActiveId(item.id);
      setPickClientId("");
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "messagesPage.openFailed"));
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const item = await conversationsApi.sendMessage(activeId, draft.trim());
      setMessages((prev) => [...prev, item]);
      setDraft("");
      await loadConversations();
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "messagesPage.sendFailed"));
    } finally {
      setSending(false);
    }
  }

  async function handleInviteExternal(e) {
    e.preventDefault();
    if (!activeId || !externalEmail.trim()) return;
    setError("");
    try {
      const item = await conversationsApi.inviteExternalContact(activeId, {
        email: externalEmail.trim(),
        name: externalName.trim(),
      });
      setExternals(item.externalParticipants ?? []);
      setExternalEmail("");
      setExternalName("");
      await loadConversations();
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "messagesPage.inviteFailed"));
    }
  }

  const clientsWithoutThread = useMemo(() => {
    const withThread = new Set(conversations.map((c) => c.clientId));
    return clients.filter((c) => !withThread.has(c.id));
  }, [clients, conversations]);

  return (
    <section className="panel panel--messages" aria-labelledby="messages-heading">
      <h1 id="messages-heading" className="sr-only">
        {t("messagesPage.title")}
      </h1>

      {error ? (
        <p className="panel__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="panel__muted">{t("messagesPage.loading")}</p>
      ) : (
        <div className={`messages-layout${isClientPortal ? " messages-layout--portal" : ""}`}>
          {!isClientPortal ? (
            <aside className="messages-layout__sidebar" aria-label={t("messagesPage.conversationsAria")}>
              <div className="messages-start">
                <label className="field__label" htmlFor="pick-client-chat">
                  {t("messagesPage.startWithClient")}
                </label>
                <div className="messages-start__row">
                  <select
                    id="pick-client-chat"
                    className="field__input"
                    value={pickClientId}
                    onChange={(e) => setPickClientId(e.target.value)}
                  >
                    <option value="">{t("messagesPage.pickClient")}</option>
                    {clientsWithoutThread.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code || "—"})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    disabled={!pickClientId}
                    onClick={() => void handleOpenClient()}
                  >
                    {t("messagesPage.openChat")}
                  </button>
                </div>
              </div>

              <ul className="messages-thread-list">
                {conversations.length === 0 ? (
                  <li className="messages-thread-list__empty">{t("messagesPage.noConversations")}</li>
                ) : (
                  conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`messages-thread-list__btn${activeId === c.id ? " messages-thread-list__btn--active" : ""}`}
                        onClick={() => setActiveId(c.id)}
                      >
                        <span className="messages-thread-list__name">{c.clientName}</span>
                        <span className="messages-thread-list__meta">
                          <code className="dash__code">{c.clientCode || "—"}</code>
                        </span>
                        {c.lastMessagePreview ? (
                          <span className="messages-thread-list__preview">{c.lastMessagePreview}</span>
                        ) : (
                          <span className="messages-thread-list__preview messages-thread-list__preview--muted">
                            {t("messagesPage.noMessagesYet")}
                          </span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </aside>
          ) : null}

          <div className="messages-layout__main">
            {!activeConversation ? (
              <div className="trade-setup-empty">
                <p className="trade-setup-empty__title">{t("messagesPage.selectConversation")}</p>
              </div>
            ) : (
              <>
                <header className="messages-thread__head">
                  <div>
                    <h2 className="messages-thread__title">{activeConversation.clientName}</h2>
                    <p className="messages-thread__subtitle">
                      {t("messagesPage.threadWithClient")}{" "}
                      <code className="dash__code">{activeConversation.clientCode || "—"}</code>
                      {!isClientPortal ? (
                        <>
                          {" · "}
                          <Link to={`/dashboard/clients/parties/${activeConversation.clientId}`}>
                            {t("messagesPage.viewClientProfile")}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {activeConversation.externalParticipantCount > 0 ? (
                    <span className="messages-thread__externals-badge">
                      {t("messagesPage.externalCount", {
                        count: activeConversation.externalParticipantCount,
                      })}
                    </span>
                  ) : null}
                </header>

                {!isClientPortal ? (
                  <details className="messages-external">
                    <summary>{t("messagesPage.inviteExternal")}</summary>
                    <form className="messages-external__form dash-form" onSubmit={handleInviteExternal}>
                      <div className="dash-form__grid">
                        <div className="field field--grow">
                          <label className="field__label" htmlFor="external-email">
                            {t("messagesPage.externalEmail")}
                          </label>
                          <input
                            id="external-email"
                            type="email"
                            className="field__input"
                            value={externalEmail}
                            onChange={(e) => setExternalEmail(e.target.value)}
                          />
                        </div>
                        <div className="field field--grow">
                          <label className="field__label" htmlFor="external-name">
                            {t("messagesPage.externalName")}
                          </label>
                          <input
                            id="external-name"
                            className="field__input"
                            value={externalName}
                            onChange={(e) => setExternalName(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn--ghost btn--sm"
                        disabled={!externalEmail.trim()}
                      >
                        {t("messagesPage.addExternal")}
                      </button>
                    </form>
                    {externals.length > 0 ? (
                      <ul className="messages-external__list">
                        {externals.map((p) => (
                          <li key={p.id}>
                            {p.name || p.email} <span className="messages-external__tag">{p.email}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </details>
                ) : null}

                <div className="messages-thread" role="log" aria-live="polite" aria-relevant="additions">
                  {messages.length === 0 ? (
                    <p className="messages-thread__empty">{t("messagesPage.emptyThread")}</p>
                  ) : (
                    messages.map((msg) => {
                      const mine = isClientPortal
                        ? msg.senderKind === "client_portal"
                        : msg.senderKind === "staff";
                      return (
                        <article
                          key={msg.id}
                          className={`messages-bubble${mine ? " messages-bubble--mine" : " messages-bubble--theirs"}`}
                        >
                          <header className="messages-bubble__head">
                            <span className="messages-bubble__author">{msg.senderDisplayName}</span>
                            <span
                              className={`messages-bubble__role messages-bubble__role--${msg.senderKind}`}
                            >
                              {t(`messagesPage.sender.${msg.senderKind}`)}
                            </span>
                            <time className="messages-bubble__time" dateTime={msg.createdAt}>
                              {formatMessageTime(msg.createdAt)}
                            </time>
                          </header>
                          <p className="messages-bubble__body">{msg.body}</p>
                        </article>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                <form className="messages-compose" onSubmit={handleSend}>
                  <label className="sr-only" htmlFor="message-body">
                    {t("messagesPage.composeLabel")}
                  </label>
                  <textarea
                    id="message-body"
                    className="field__input field__textarea messages-compose__input"
                    rows={3}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t("messagesPage.composePlaceholder")}
                  />
                  <button type="submit" className="btn btn--primary" disabled={sending || !draft.trim()}>
                    {sending ? t("messagesPage.sending") : t("messagesPage.send")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
