import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <Header />
    <main className="flex-1">
      <div className="container max-w-4xl py-16 md:py-24 px-6">
        <Button
          variant="ghost"
          asChild
          className="mb-8 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>

        <div className="space-y-12 text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Effective Date: July 4, 2026
            </p>
            <p className="text-sm">
              This Privacy Policy is maintained by{" "}
              <strong className="text-foreground">Americascom, Inc.</strong>{" "}
              (doing business as{" "}
              <strong className="text-foreground">SONGSS Intelligence</strong>)
              to describe how we collect, use, disclose, and safeguard personal
              information in connection with our website and services. This
              page reflects Americascom's own data-handling practices.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              1. Who We Are
            </h2>
            <p>
              Americascom, Inc. d/b/a SONGSS Intelligence ("SONGSS",
              "we", "us", or "our") provides AI-powered music analytics and
              reporting services. We are a Delaware corporation headquartered
              at:
            </p>
            <div className="flex items-start gap-3 not-italic">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-foreground font-medium">Americascom, Inc.</p>
                <p>651 N Broad St, Ste 206</p>
                <p>Middletown, DE 19709</p>
                <p>USA</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p>
                For privacy-related inquiries, please contact us at:{" "}
                <a
                  href="mailto:hello@songssintelligence.com"
                  className="text-primary hover:underline ml-1"
                >
                  hello@songssintelligence.com
                </a>
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              2. Information We Collect
            </h2>
            <p>
              We collect personal information that you provide directly to us,
              that is generated automatically when you use our services, and
              that we obtain from third-party sources with your consent or as
              permitted by law.
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Account Information:</strong>{" "}
                names, email addresses, usernames, passwords, and billing
                addresses collected during registration, checkout, or
                profile updates.
              </li>
              <li>
                <strong className="text-foreground">Artist and Project Data:</strong>{" "}
                artist names, project metadata, streaming URLs, and other
                information you submit to generate analytics reports.
              </li>
              <li>
                <strong className="text-foreground">Communications:</strong>{" "}
                messages, support requests, and feedback you send to us.
              </li>
            </ul>
            <h3 className="text-lg font-semibold text-foreground">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Usage Data:</strong>{" "}
                IP addresses, browser type and version, device information,
                operating system, referral URLs, pages viewed, and timestamps.
              </li>
              <li>
                <strong className="text-foreground">Cookies and Similar Technologies:</strong>{" "}
                we use cookies and related technologies to operate the service,
                remember preferences, and understand usage patterns.
              </li>
            </ul>
            <h3 className="text-lg font-semibold text-foreground">
              2.3 Third-Party Sources
            </h3>
            <p>
              We may collect publicly available streaming and social metrics
              (for example, from Spotify, Apple Music, YouTube Music, TikTok,
              Instagram, Deezer, SoundCloud, and Shazam) to generate reports.
              This data is generally public or licensed and is processed in
              accordance with each platform's terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <p>We use personal information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and maintain the SONGSS platform;</li>
              <li>
                Generate artist intelligence reports, analytics, and related
                insights;
              </li>
              <li>Process payments and manage subscriptions;</li>
              <li>Authenticate users and secure accounts;</li>
              <li>
                Communicate with you about your account, updates, and support
                requests;
              </li>
              <li>
                Improve our services, train and refine our neural models, and
                develop new features;
              </li>
              <li>
                Comply with legal obligations and enforce our Terms of Service.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              4. Legal Bases for Processing
            </h2>
            <p>
              We process personal information based on one or more of the
              following legal grounds:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Performance of a contract</strong>{" "}
                — to provide the services you requested;
              </li>
              <li>
                <strong className="text-foreground">Consent</strong>{" "}
                — where you have given clear permission, such as for marketing
                communications or optional cookies;
              </li>
              <li>
                <strong className="text-foreground">Legitimate interests</strong>{" "}
                — to operate, secure, and improve our business and services;
              </li>
              <li>
                <strong className="text-foreground">Legal obligation</strong>{" "}
                — to comply with applicable laws, regulations, and legal
                processes.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              5. Payment Processing
            </h2>
            <p>
              All payments are processed by{" "}
              <strong className="text-foreground">Stripe, Inc.</strong> through
              our AmericasPay billing flow. Stripe collects and stores payment
              card details, bank account information, and related billing data in
              accordance with its own privacy policy and security standards. We
              do not store complete payment card numbers or CVV codes on our
              servers. By making a payment, you agree to Stripe's terms and
              privacy practices.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              6. AI Services and Third-Party Processors
            </h2>
            <p>
              To deliver analytics, natural-language summaries, and automated
              insights, we use third-party AI and cloud services that may
              process data on our behalf under contractual data-protection
              obligations. These providers include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Google Cloud AI / Gemini</strong>{" "}
                — cloud AI and machine-learning infrastructure;
              </li>
              <li>
                <strong className="text-foreground">Anthropic Claude</strong>{" "}
                — large-language model services for report generation and
                insights;
              </li>
              <li>
                <strong className="text-foreground">Perplexity</strong>{" "}
                — search and reasoning assistance;
              </li>
              <li>
                <strong className="text-foreground">IBM Watson</strong>{" "}
                — AI and data-analysis capabilities.
              </li>
            </ul>
            <p>
              We only share with these providers the data necessary to perform
              the specific processing function, and we require them to use it
              solely for that purpose.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              7. Security
            </h2>
            <p>
              We use <strong className="text-foreground">Cloudflare</strong>{" "}
              for edge security, DDoS mitigation, bot management, and traffic
              encryption. We also implement access controls, encryption in
              transit, password hashing, and routine monitoring to protect your
              information. No system is completely secure; we continuously
              review our controls and respond to security issues in accordance
              with our incident-response procedures.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              8. Hosting
            </h2>
            <p>
              Our application is hosted on{" "}
              <strong className="text-foreground">Vercel, Inc.</strong>{" "}
              infrastructure. Vercel processes request logs and related
              metadata necessary to deliver our web application. Vercel's
              practices are governed by its privacy policy and data-processing
              terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              9. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as you maintain an
              active SONGSS account, or as long as necessary to fulfill the
              purposes described in this Privacy Policy, comply with legal
              obligations, resolve disputes, and enforce our agreements. When
              you delete your account or request deletion, we will remove or
              anonymize your personal information unless applicable law requires
              us to keep it longer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              10. Your Rights and Choices
            </h2>
            <p>
              Depending on where you are located, you may have the following
              rights regarding your personal information:
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              10.1 GDPR (European Economic Area, United Kingdom, and Switzerland)
            </h3>
            <p>
              If you are located in the European Economic Area, the United
              Kingdom, or Switzerland, you have rights under the General Data
              Protection Regulation (GDPR), including the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you;</li>
              <li>Request correction of inaccurate information;</li>
              <li>Request erasure (the "right to be forgotten");</li>
              <li>Object to or restrict certain processing activities;</li>
              <li>Request data portability;</li>
              <li>
                Withdraw consent where processing is based on consent, without
                affecting the lawfulness of processing before withdrawal;
              </li>
              <li>
                Lodge a complaint with your local data protection authority.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground">
              10.2 CCPA / US State Privacy Laws
            </h3>
            <p>
              Residents of California and other US states with comprehensive
              privacy laws have rights that may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The right to know what personal information we collect, use,
                disclose, and sell or share;
              </li>
              <li>
                The right to request deletion of personal information, subject
                to legal exceptions;
              </li>
              <li>
                The right to opt out of the sale or sharing of personal
                information for targeted advertising;
              </li>
              <li>
                The right to non-discrimination for exercising your privacy
                rights.
              </li>
            </ul>
            <p>
              We do not sell personal information for monetary consideration.
              To exercise your rights, contact us using the information below.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              10.3 LGPD (Brazil)
            </h3>
            <p>
              If you are in Brazil, you have rights under the Lei Geral de
              Proteção de Dados (LGPD), including the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Confirmation of the existence of processing;</li>
              <li>Access to your personal information;</li>
              <li>Correction of incomplete, inaccurate, or outdated data;</li>
              <li>
                Anonymization, blocking, or deletion of unnecessary or
                excessive data, or data processed in violation of LGPD;
              </li>
              <li>
                Portability of your personal information to another service
                provider;
              </li>
              <li>
                Information about the public and private entities with which we
                share your data;
              </li>
              <li>
                Information about the possibility of refusing consent and the
                consequences of such refusal;
              </li>
              <li>Revocation of consent.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground">
              10.4 POPIA (South Africa)
            </h3>
            <p>
              If you are in South Africa, you have rights under the Protection
              of Personal Information Act (POPIA), including the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be notified that we are collecting your personal information;</li>
              <li>Access your personal information;</li>
              <li>Request correction or deletion of your personal information;</li>
              <li>Object to the processing of your personal information;</li>
              <li>
                Lodge a complaint with the Information Regulator of South Africa.
              </li>
            </ul>

            <p>
              To exercise any of these rights, please email us at{" "}
              <a
                href="mailto:hello@songssintelligence.com"
                className="text-primary hover:underline"
              >
                hello@songssintelligence.com
              </a>
              . We will respond within the timeframe required by applicable law
              and may need to verify your identity before fulfilling your
              request.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              11. International Data Transfers
            </h2>
            <p>
              Americascom, Inc. is based in the United States. Your information
              may be transferred to, stored in, or processed in the United
              States and other countries where our service providers operate.
              When we transfer personal information from the European Economic
              Area, the United Kingdom, Switzerland, Brazil, South Africa, or
              other jurisdictions with data-transfer requirements, we rely on
              appropriate safeguards, such as standard contractual clauses and
              adequacy decisions, to protect your information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              12. Children's Privacy
            </h2>
            <p>
              SONGSS Intelligence is not directed to children under the age of
              13, and we do not knowingly collect personal information from
              children under 13. If we learn that we have collected personal
              information from a child under 13 without verified parental
              consent, we will delete that information promptly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              13. Cookies and Tracking Technologies
            </h2>
            <p>
              We and our partners use cookies and similar technologies to
              operate the site, analyze traffic, and improve your experience.
              You can manage cookie preferences through your browser settings.
              Some features of the service may not function properly if cookies
              are disabled.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              14. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, services, or legal requirements. We
              will post the revised policy with an updated effective date and,
              where required by law, notify you of material changes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              15. Contact Us
            </h2>
            <p>
              If you have questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Email</p>
                  <a
                    href="mailto:hello@songssintelligence.com"
                    className="text-primary hover:underline"
                  >
                    hello@songssintelligence.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Mailing Address</p>
                  <p>Americascom, Inc.</p>
                  <p>651 N Broad St, Ste 206</p>
                  <p>Middletown, DE 19709, USA</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
