import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Cookies = () => (
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
              Cookie Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Effective Date: July 4, 2026
            </p>
            <p className="text-sm">
              This Cookie Policy is maintained by{" "}
              <strong className="text-foreground">Americascom, Inc.</strong>{" "}
              (doing business as{" "}
              <strong className="text-foreground">SONGSS Intelligence</strong>)
              to explain how and why we use cookies and similar technologies on
              our website and services.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files that are placed on your device when
              you visit a website. They are widely used to make websites work
              more efficiently, improve user experience, and provide information
              to website operators. Similar technologies, such as local
              storage, pixels, and web beacons, may also be used for these
              purposes.
            </p>
            <p>
              We use cookies and similar technologies to operate the SONGSS
              Intelligence platform, remember your preferences, analyze usage
              patterns, and help keep our service secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              2. Types of Cookies We Use
            </h2>

            <h3 className="text-lg font-semibold text-foreground">
              2.1 Essential Cookies
            </h3>
            <p>
              These cookies are necessary for the Service to function and cannot
              be switched off in our systems. They enable core features such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Authentication:</strong>{" "}
                keeping you logged in to your account and maintaining your
                session state;
              </li>
              <li>
                <strong className="text-foreground">Security:</strong>{" "}
                helping protect the Service from abuse, fraud, and unauthorized
                access, including through Cloudflare security features.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground">
              2.2 Functional Cookies
            </h3>
            <p>
              These cookies allow us to remember choices you make and provide
              enhanced, more personal features. They may be used to remember
              your preferences, such as language settings, display preferences,
              or other customizable elements of the Service.
            </p>

            <h3 className="text-lg font-semibold text-foreground">
              2.3 Analytics Cookies
            </h3>
            <p>
              These cookies help us understand how visitors interact with our
              Service by collecting and reporting usage data. We use this
              information to improve site performance, content, and user
              experience. Analytics data may be collected through Cloudflare and
              similar infrastructure partners.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              3. Third-Party Cookies and Services
            </h2>
            <p>
              We work with trusted third-party providers that may set cookies or
              process data on our behalf. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Cloudflare</strong>{" "}
                — used for security, performance, DDoS mitigation, and
                analytics; Cloudflare may set cookies to identify trusted
                traffic and gather performance data.
              </li>
              <li>
                <strong className="text-foreground">Stripe</strong>{" "}
                — used to process payments; Stripe may set cookies or use
                similar technologies to detect fraud and maintain the security
                of payment sessions.
              </li>
              <li>
                <strong className="text-foreground">Termly</strong>{" "}
                — used for consent management and legal compliance; Termly may
                set cookies to remember your cookie and consent preferences.
              </li>
            </ul>
            <p>
              These third parties are responsible for their own cookies and
              data practices. We encourage you to review their respective
              privacy and cookie policies for more information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              4. How to Control Cookies
            </h2>
            <p>
              Most web browsers allow you to manage cookies through their
              settings. You can usually choose to accept, decline, or delete
              cookies. Please note that if you disable certain cookies, some
              features of the Service may not function correctly.
            </p>
            <p>
              Below are links to cookie-management instructions for common
              browsers:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Apple Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-4617-2e0e7048cd05"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p>
              You may also use industry opt-out tools, such as the{" "}
              <a
                href="https://optout.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Digital Advertising Alliance opt-out page
              </a>
              , to manage interest-based advertising cookies where applicable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              5. Changes to This Cookie Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in technology, law, or our services. When we make material
              changes, we will update the effective date at the top of this page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about our use of cookies, please contact
              us:
            </p>
            <div className="flex items-start gap-3 pt-2">
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
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Cookies;
