import { useEffect, useState } from "react";
import * as clientsApi from "../api/clients.js";
import { Modal } from "./Modal";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "../i18n/LanguageContext.jsx";

type AccountModalProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

type ClientInviteRow = {
  id: string;
  name: string;
  code: string;
  inviteCode: string;
};

export function AccountModal({ open, onClose, onLogout }: AccountModalProps) {
  const { t, locale, setLocale } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clientInvites, setClientInvites] = useState<ClientInviteRow[]>([]);
  const [clientInvitesLoading, setClientInvitesLoading] = useState(false);

  useEffect(() => {
    if (!open || !user || user.isClientPortal) {
      setClientInvites([]);
      return undefined;
    }

    let cancelled = false;
    setClientInvitesLoading(true);
    clientsApi
      .fetchClients()
      .then((items) => {
        if (cancelled) return;
        setClientInvites(
          items
            .filter((item) => item.inviteCode)
            .map((item) => ({
              id: item.id,
              name: item.name,
              code: item.code,
              inviteCode: item.inviteCode!,
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => {
        if (!cancelled) setClientInvites([]);
      })
      .finally(() => {
        if (!cancelled) setClientInvitesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user?.id, user?.isClientPortal]);

  if (!user) return null;

  const displayName = user.isClientPortal
    ? user.clientName || t("sidebar.clientPortalFallback")
    : user.companyName || t("sidebar.companyFallback");

  const showStaffInvite = !user.isClientPortal && !!user.inviteCode;
  const showClientSelfInvite = user.isClientPortal && !!user.clientInviteCode;
  const showClientDirectory = !user.isClientPortal && (clientInvitesLoading || clientInvites.length > 0);
  const showInviteSection = showStaffInvite || showClientSelfInvite || showClientDirectory;

  async function copyInviteCode(code: string, key: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedKey(key);
      showToast({ message: t("sidebar.inviteCopiedToast"), variant: "success" });
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("accountModal.title")} closeLabel={t("accountModal.close")}>
      <div className="account-modal">
        <section className="account-modal__section" aria-labelledby="account-modal-profile">
          <h3 id="account-modal-profile" className="account-modal__heading">
            {t("accountModal.profileTitle")}
          </h3>
          <dl className="account-modal__meta">
            <div className="account-modal__row">
              <dt>{t("accountModal.nameLabel")}</dt>
              <dd>{displayName}</dd>
            </div>
            <div className="account-modal__row">
              <dt>{t("accountModal.emailLabel")}</dt>
              <dd>{user.email}</dd>
            </div>
            {!user.isClientPortal && user.companyName ? (
              <div className="account-modal__row">
                <dt>{t("accountModal.companyLabel")}</dt>
                <dd>{user.companyName}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {showInviteSection ? (
          <section className="account-modal__section" aria-labelledby="account-modal-invite">
            <h3 id="account-modal-invite" className="account-modal__heading">
              {t("accountModal.inviteTitle")}
            </h3>

            {showStaffInvite ? (
              <div className="account-modal__invite-block">
                <h4 className="account-modal__invite-subheading">{t("accountModal.inviteTeamTitle")}</h4>
                <div className="account-modal__invite-row">
                  <code className="account-modal__invite-code">{user.inviteCode}</code>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => copyInviteCode(user.inviteCode!, "staff")}
                  >
                    {copiedKey === "staff" ? t("sidebar.inviteCopiedBtn") : t("sidebar.inviteCopyBtn")}
                  </button>
                </div>
              </div>
            ) : null}

            {showClientSelfInvite ? (
              <div className="account-modal__invite-block">
                <h4 className="account-modal__invite-subheading">
                  {t("accountModal.inviteColleaguesTitle")}
                </h4>
                <div className="account-modal__invite-row">
                  <code className="account-modal__invite-code">{user.clientInviteCode}</code>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => copyInviteCode(user.clientInviteCode!, "client-self")}
                  >
                    {copiedKey === "client-self" ? t("sidebar.inviteCopiedBtn") : t("sidebar.inviteCopyBtn")}
                  </button>
                </div>
              </div>
            ) : null}

            {showClientDirectory ? (
              <div className="account-modal__invite-block">
                <h4 className="account-modal__invite-subheading">{t("accountModal.inviteClientTitle")}</h4>
                {clientInvitesLoading ? (
                  <p className="account-modal__hint account-modal__hint--muted">
                    {t("accountModal.inviteClientLoading")}
                  </p>
                ) : (
                  <ul className="account-modal__client-invites">
                    {clientInvites.map((client) => {
                      const copyKey = `client-${client.id}`;
                      return (
                        <li key={client.id} className="account-modal__client-invite">
                          <span className="account-modal__client-invite-name">
                            {client.name}
                            {client.code ? (
                              <span className="account-modal__client-invite-code-label">
                                {" "}
                                · {client.code}
                              </span>
                            ) : null}
                          </span>
                          <code className="account-modal__invite-code account-modal__invite-code--compact">
                            {client.inviteCode}
                          </code>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => copyInviteCode(client.inviteCode, copyKey)}
                          >
                            {copiedKey === copyKey
                              ? t("sidebar.inviteCopiedBtn")
                              : t("sidebar.inviteCopyBtn")}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="account-modal__section" aria-labelledby="account-modal-prefs">
          <h3 id="account-modal-prefs" className="account-modal__heading">
            {t("accountModal.prefsTitle")}
          </h3>
          <div className="account-modal__prefs">
            <div className="account-modal__pref">
              <span className="account-modal__pref-label">{t("language.label")}</span>
              <div className="account-modal__lang-seg" role="group" aria-label={t("language.label")}>
                <button
                  type="button"
                  className={`account-modal__lang-btn${locale === "en" ? " account-modal__lang-btn--active" : ""}`}
                  onClick={() => setLocale("en")}
                  aria-pressed={locale === "en"}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`account-modal__lang-btn${locale === "es" ? " account-modal__lang-btn--active" : ""}`}
                  onClick={() => setLocale("es")}
                  aria-pressed={locale === "es"}
                >
                  ES
                </button>
              </div>
            </div>
            <div className="account-modal__pref account-modal__pref--theme">
              <span className="account-modal__pref-label">{t("sidebar.theme")}</span>
              <ThemeToggle className="account-modal__theme-toggle" />
            </div>
          </div>
        </section>

        <div className="account-modal__actions">
          <button type="button" className="btn btn--ghost account-modal__logout" onClick={onLogout}>
            {t("sidebar.logout")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function AccountMenuTrigger({
  displayName,
  email,
  initials,
  open,
  onClick,
}: {
  displayName: string;
  email: string;
  initials: string;
  open: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`sidebar__user-trigger${open ? " sidebar__user-trigger--open" : ""}`}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={t("accountModal.openTrigger")}
    >
      <span className="sidebar__user-avatar" aria-hidden>
        {initials}
      </span>
      <span className="sidebar__user-text">
        <span className="sidebar__user-kicker">{t("sidebar.groupAccount")}</span>
        <span className="sidebar__user-title">{displayName}</span>
        <span className="sidebar__user-email">{email}</span>
      </span>
    </button>
  );
}
