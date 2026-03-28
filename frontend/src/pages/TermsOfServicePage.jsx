import { MainLayout } from "../layouts/MainLayout.jsx";
import { BackLink } from "../components/BackLink.jsx";
import { appName } from "../config/siteMeta.js";

export function TermsOfServicePage() {
  return (
    <MainLayout title="Terms of Use" dataSource={null}>
      <div className="legal-page">
        <BackLink />
        <p className="legal-page__lead">
          These terms govern use of {appName}. Replace with your definitive legal text before production.
        </p>
        <section className="legal-page__section">
          <h2 className="legal-page__h">Use of tracking data</h2>
          <p>
            Tracking information is provided for operational convenience. Carrier and AIS data may be delayed or
            incomplete; {appName} does not guarantee accuracy or availability.
          </p>
        </section>
        <section className="legal-page__section">
          <h2 className="legal-page__h">Accounts</h2>
          <p>
            Workspace accounts are issued by your organisation. Keep credentials confidential and comply with your
            company&apos;s policies.
          </p>
        </section>
      </div>
    </MainLayout>
  );
}
