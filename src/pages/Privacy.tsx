import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TOC: { id: string; label: string }[] = [
  { id: "infocollect", label: "1. WHAT INFORMATION DO WE COLLECT?" },
  { id: "infouse", label: "2. HOW DO WE PROCESS YOUR INFORMATION?" },
  { id: "legalbases", label: "3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?" },
  { id: "whoshare", label: "4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?" },
  { id: "cookies", label: "5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?" },
  { id: "ai", label: "6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?" },
  { id: "intltransfers", label: "7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?" },
  { id: "inforetain", label: "8. HOW LONG DO WE KEEP YOUR INFORMATION?" },
  { id: "infosafe", label: "9. HOW DO WE KEEP YOUR INFORMATION SAFE?" },
  { id: "infominors", label: "10. DO WE COLLECT INFORMATION FROM MINORS?" },
  { id: "privacyrights", label: "11. WHAT ARE YOUR PRIVACY RIGHTS?" },
  { id: "DNT", label: "12. CONTROLS FOR DO-NOT-TRACK FEATURES" },
  { id: "uslaws", label: "13. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?" },
  { id: "otherlaws", label: "14. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?" },
  { id: "clausea", label: "15. BRAZIL (LGPD)" },
  { id: "policyupdates", label: "16. DO WE MAKE UPDATES TO THIS NOTICE?" },
  { id: "contact", label: "17. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" },
  { id: "request", label: "18. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?" },
];

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-primary hover:underline">
    {children}
  </a>
);

const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2
    id={id}
    className="scroll-mt-24 text-2xl font-semibold text-foreground pt-4"
  >
    {children}
  </h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-semibold text-foreground mt-4">{children}</h3>
);

const InShort = ({ children }: { children: React.ReactNode }) => (
  <p className="italic text-foreground/80">
    <strong className="text-foreground">In Short:</strong> {children}
  </p>
);

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

        <article className="space-y-6 text-muted-foreground leading-relaxed">
          <header className="space-y-3 pb-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-sm">Last updated July 04, 2026</p>
          </header>

          <p>
            This Privacy Notice for Americascom, Inc (doing business as{" "}
            <strong className="text-foreground">SONGSS Intelligence</strong>)
            ("we," "us," or "our"), describes how and why we might access,
            collect, store, use, and/or share ("process") your personal
            information when you use our services ("Services"), including when
            you:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Visit our website at{" "}
              <A href="https://app.songssintelligence.com">
                https://app.songssintelligence.com
              </A>{" "}
              or any website of ours that links to this Privacy Notice
            </li>
            <li>
              Use Songss Intelligence NIE. SONGSS Intelligence is an AI-powered
              music analytics platform developed by Americascom, Inc. It
              provides artist intelligence reports, global DSP performance
              data, revenue modeling, and market insights for artists, labels,
              publishers, and music industry investors. Reports are generated
              by the SONGSS Neural Intelligence Engine™ (NIE™), a proprietary
              AI system, and delivered digitally via email and web interface.
            </li>
            <li>Engage with us in other related ways, including any marketing or events</li>
          </ul>
          <p>
            Questions or concerns? Reading this Privacy Notice will help you
            understand your privacy rights and choices. We are responsible for
            making decisions about how your personal information is processed.
            If you do not agree with our policies and practices, please do not
            use our Services. If you still have any questions or concerns,
            please contact us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            .
          </p>

          <H2 id="summary">SUMMARY OF KEY POINTS</H2>
          <p>
            This summary provides key points from our Privacy Notice, but you
            can find out more details about any of these topics by clicking the
            link following each key point or by using our{" "}
            <A href="#toc">table of contents</A> below to find the section you
            are looking for.
          </p>
          <p>
            <strong className="text-foreground">
              What personal information do we process?
            </strong>{" "}
            When you visit, use, or navigate our Services, we may process
            personal information depending on how you interact with us and the
            Services, the choices you make, and the products and features you
            use. Learn more about{" "}
            <A href="#infocollect">personal information you disclose to us</A>.
          </p>
          <p>
            <strong className="text-foreground">
              Do we process any sensitive personal information?
            </strong>{" "}
            Some of the information may be considered "special" or "sensitive"
            in certain jurisdictions, for example your racial or ethnic
            origins, sexual orientation, and religious beliefs. We do not
            process sensitive personal information.
          </p>
          <p>
            <strong className="text-foreground">
              Do we collect any information from third parties?
            </strong>{" "}
            We may collect information from public databases, marketing
            partners, social media platforms, and other outside sources. Learn
            more about{" "}
            <A href="#infocollect">information collected from other sources</A>.
          </p>
          <p>
            <strong className="text-foreground">
              How do we process your information?
            </strong>{" "}
            We process your information to provide, improve, and administer our
            Services, communicate with you, for security and fraud prevention,
            and to comply with law. We may also process your information for
            other purposes with your consent. Learn more about{" "}
            <A href="#infouse">how we process your information</A>.
          </p>
          <p>
            <strong className="text-foreground">
              In what situations and with which parties do we share personal
              information?
            </strong>{" "}
            We may share information in specific situations and with specific
            third parties. Learn more about{" "}
            <A href="#whoshare">
              when and with whom we share your personal information
            </A>
            .
          </p>
          <p>
            <strong className="text-foreground">
              How do we keep your information safe?
            </strong>{" "}
            We have adequate organizational and technical processes and
            procedures in place to protect your personal information. However,
            no electronic transmission over the internet or information storage
            technology can be guaranteed to be 100% secure. Learn more about{" "}
            <A href="#infosafe">how we keep your information safe</A>.
          </p>
          <p>
            <strong className="text-foreground">What are your rights?</strong>{" "}
            Depending on where you are located geographically, the applicable
            privacy law may mean you have certain rights regarding your
            personal information. Learn more about{" "}
            <A href="#privacyrights">your privacy rights</A>.
          </p>
          <p>
            <strong className="text-foreground">
              How do you exercise your rights?
            </strong>{" "}
            The easiest way to exercise your rights is by contacting us. We
            will consider and act upon any request in accordance with
            applicable data protection laws.
          </p>

          <H2 id="toc">TABLE OF CONTENTS</H2>
          <ol className="list-none pl-0 space-y-2">
            {TOC.map((item) => (
              <li key={item.id}>
                <A href={`#${item.id}`}>{item.label}</A>
              </li>
            ))}
          </ol>

          <H2 id="infocollect">1. WHAT INFORMATION DO WE COLLECT?</H2>
          <H3>Personal information you disclose to us</H3>
          <InShort>We collect personal information that you provide to us.</InShort>
          <p>
            We collect personal information that you voluntarily provide to us
            when you register on the Services, express an interest in obtaining
            information about us or our products and Services, when you
            participate in activities on the Services, or otherwise when you
            contact us.
          </p>
          <p>
            <strong className="text-foreground">
              Personal Information Provided by You.
            </strong>{" "}
            The personal information that we collect depends on the context of
            your interactions with us and the Services, the choices you make,
            and the products and features you use. The personal information we
            collect may include the following:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>names</li>
            <li>email addresses</li>
            <li>usernames</li>
            <li>passwords</li>
            <li>contact preferences</li>
            <li>billing addresses</li>
          </ul>
          <p>
            <strong className="text-foreground">Sensitive Information.</strong>{" "}
            We do not process sensitive information.
          </p>
          <p>
            <strong className="text-foreground">Payment Data.</strong> We may
            collect data necessary to process your payment if you choose to
            make purchases, such as your payment instrument number, and the
            security code associated with your payment instrument. All payment
            data is handled and stored by Stripe. You may find their privacy
            notice link(s) here:{" "}
            <A href="https://stripe.com/privacy">https://stripe.com/privacy</A>.
          </p>
          <p>
            All personal information that you provide to us must be true,
            complete, and accurate, and you must notify us of any changes to
            such personal information.
          </p>

          <H3>Information automatically collected</H3>
          <InShort>
            Some information — such as your Internet Protocol (IP) address
            and/or browser and device characteristics — is collected
            automatically when you visit our Services.
          </InShort>
          <p>
            We automatically collect certain information when you visit, use,
            or navigate the Services. This information does not reveal your
            specific identity (like your name or contact information) but may
            include device and usage information, such as your IP address,
            browser and device characteristics, operating system, language
            preferences, referring URLs, device name, country, location,
            information about how and when you use our Services, and other
            technical information. This information is primarily needed to
            maintain the security and operation of our Services, and for our
            internal analytics and reporting purposes.
          </p>
          <p>
            Like many businesses, we also collect information through cookies
            and similar technologies. You can find out more about this in our
            Cookie Notice:{" "}
            <Link to="/cookies" className="text-primary hover:underline">
              /cookies
            </Link>
            .
          </p>
          <p>The information we collect includes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Log and Usage Data.</strong>{" "}
              Service-related, diagnostic, usage, and performance information
              our servers automatically collect when you access or use our
              Services and which we record in log files. Depending on how you
              interact with us, this log data may include your IP address,
              device information, browser type, settings, and information about
              your activity in the Services (such as date/time stamps, pages
              and files viewed, searches, and other actions you take), device
              event information (such as system activity, error reports, and
              hardware settings).
            </li>
            <li>
              <strong className="text-foreground">Device Data.</strong> We
              collect device data such as information about your computer,
              phone, tablet, or other device you use to access the Services.
            </li>
            <li>
              <strong className="text-foreground">Location Data.</strong> We
              collect location data such as information about your device's
              location, which can be either precise or imprecise.
            </li>
          </ul>

          <H3>Google API</H3>
          <p>
            Our use of information received from Google APIs will adhere to{" "}
            <A href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </A>
            , including the{" "}
            <A href="https://developers.google.com/terms/api-services-user-data-policy#limited-use">
              Limited Use requirements
            </A>
            .
          </p>

          <H3>Information collected from other sources</H3>
          <InShort>
            We may collect limited data from public databases, marketing
            partners, and other outside sources.
          </InShort>
          <p>
            In order to enhance our ability to provide relevant marketing,
            offers, and services to you and update our records, we may obtain
            information about you from other sources, such as public databases,
            joint marketing partners, affiliate programs, data providers, and
            from other third parties.
          </p>

          <H2 id="infouse">2. HOW DO WE PROCESS YOUR INFORMATION?</H2>
          <InShort>
            We process your information to provide, improve, and administer our
            Services, communicate with you, for security and fraud prevention,
            and to comply with law. We may also process your information for
            other purposes only with your prior explicit consent.
          </InShort>
          <p>
            We process your personal information for a variety of reasons,
            depending on how you interact with our Services, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To facilitate account creation and authentication and otherwise manage user accounts.</li>
            <li>To deliver and facilitate delivery of services to the user.</li>
            <li>To respond to user inquiries and offer support to users.</li>
            <li>To send administrative information to you.</li>
            <li>To fulfill and manage your orders, payments, returns, and exchanges.</li>
            <li>To request feedback.</li>
            <li>To protect our Services, including fraud monitoring and prevention.</li>
            <li>To identify usage trends.</li>
            <li>To save or protect an individual's vital interest.</li>
          </ul>

          <H2 id="legalbases">
            3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?
          </H2>
          <InShort>
            We only process your personal information when we believe it is
            necessary and we have a valid legal reason (i.e., legal basis) to
            do so under applicable law.
          </InShort>
          <p>
            <em>If you are located in the EU or UK, this section applies to you.</em>
          </p>
          <p>
            The General Data Protection Regulation (GDPR) and UK GDPR require
            us to explain the valid legal bases we rely on in order to process
            your personal information. As such, we may rely on the following
            legal bases:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Consent.</strong> You can
              withdraw your consent at any time by contacting us.
            </li>
            <li>
              <strong className="text-foreground">Performance of a Contract.</strong>
            </li>
            <li>
              <strong className="text-foreground">Legitimate Interests.</strong>{" "}
              For example, to analyze how our Services are used, diagnose
              problems and prevent fraud, and improve user experience.
            </li>
            <li>
              <strong className="text-foreground">Legal Obligations.</strong>
            </li>
            <li>
              <strong className="text-foreground">Vital Interests.</strong>
            </li>
          </ul>
          <p>
            <em>If you are located in Canada, this section applies to you.</em>
          </p>
          <p>
            We may process your information if you have given us specific
            permission (i.e., express consent) to use your personal information
            for a specific purpose, or in situations where your permission can
            be inferred (i.e., implied consent). You can withdraw your consent
            at any time. In some exceptional cases, we may be legally permitted
            under applicable law to process your information without your
            consent.
          </p>

          <H2 id="whoshare">
            4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
          </H2>
          <InShort>
            We may share information in specific situations described in this
            section and/or with the following third parties.
          </InShort>
          <p>
            <strong className="text-foreground">
              Vendors, Consultants, and Other Third-Party Service Providers.
            </strong>{" "}
            We may share your data with third-party vendors, service providers,
            contractors, or agents who perform services for us. The third
            parties we may share personal information with are as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">AI Service Providers:</strong>{" "}
              Google Cloud AI
            </li>
            <li>
              <strong className="text-foreground">Cloud Computing Services:</strong>{" "}
              Vercel
            </li>
            <li>
              <strong className="text-foreground">
                Functionality and Infrastructure Optimization:
              </strong>{" "}
              Termly.io
            </li>
            <li>
              <strong className="text-foreground">Invoice and Billing:</strong>{" "}
              Stripe
            </li>
            <li>
              <strong className="text-foreground">Website Hosting:</strong>{" "}
              Vercel
            </li>
            <li>
              <strong className="text-foreground">
                Website Performance Monitoring:
              </strong>{" "}
              Cloudflare
            </li>
          </ul>
          <p>
            We also may need to share your personal information in the
            following situations:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Business Transfers.</strong>{" "}
              We may share or transfer your information in connection with, or
              during negotiations of, any merger, sale of company assets,
              financing, or acquisition of all or a portion of our business to
              another company.
            </li>
          </ul>

          <H2 id="cookies">
            5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
          </H2>
          <InShort>
            We may use cookies and other tracking technologies to collect and
            store your information.
          </InShort>
          <p>
            We may use cookies and similar tracking technologies (like web
            beacons and pixels) to gather information when you interact with
            our Services. We also permit third parties and service providers to
            use online tracking technologies on our Services for analytics and
            advertising.
          </p>
          <p>
            To the extent these online tracking technologies are deemed to be a
            "sale"/"sharing" under applicable US state laws, you can opt out as
            described in section <A href="#uslaws">"DO UNITED STATES RESIDENTS
            HAVE SPECIFIC PRIVACY RIGHTS?"</A>
          </p>
          <p>
            Specific information about how we use such technologies and how you
            can refuse certain cookies is set out in our Cookie Notice:{" "}
            <Link to="/cookies" className="text-primary hover:underline">
              /cookies
            </Link>
            .
          </p>

          <H2 id="ai">6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</H2>
          <InShort>
            We offer products, features, or tools powered by artificial
            intelligence, machine learning, or similar technologies.
          </InShort>
          <p>
            As part of our Services, we offer products, features, or tools
            powered by artificial intelligence, machine learning, or similar
            technologies (collectively, "AI Products"). The terms in this
            Privacy Notice govern your use of the AI Products within our
            Services.
          </p>
          <p>
            <strong className="text-foreground">Use of AI Technologies.</strong>{" "}
            We provide the AI Products through third-party service providers
            ("AI Service Providers"), including Google Cloud AI, Anthropic,
            Perplexity and IBM Watson. As outlined in this Privacy Notice, your
            input, output, and personal information will be shared with and
            processed by these AI Service Providers to enable your use of our
            AI Products for purposes outlined in{" "}
            <A href="#legalbases">
              "WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL
              INFORMATION?"
            </A>{" "}
            You must not use the AI Products in any way that violates the terms
            or policies of any AI Service Provider.
          </p>
          <p>
            <strong className="text-foreground">Our AI Products.</strong> Our
            AI Products are designed for the following functions:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>AI document generation</li>
            <li>AI predictive analytics</li>
            <li>AI insights</li>
            <li>Text analysis</li>
            <li>AI bots</li>
            <li>Machine learning models</li>
            <li>AI automation</li>
            <li>Natural language processing</li>
          </ul>
          <p>
            <strong className="text-foreground">How to Opt Out.</strong> To opt
            out, you can log in to your account settings and update your user
            account, or contact us using the contact information provided.
          </p>

          <H2 id="intltransfers">
            7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?
          </H2>
          <InShort>
            We may transfer, store, and process your information in countries
            other than your own.
          </InShort>
          <p>
            Our servers are located in the United States. Regardless of your
            location, please be aware that your information may be transferred
            to, stored by, and processed by us in our facilities and in the
            facilities of the third parties with whom we may share your
            personal information (see{" "}
            <A href="#whoshare">
              "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
            </A>{" "}
            above), including facilities in the United States and other
            countries.
          </p>
          <p>
            <strong className="text-foreground">
              European Commission's Standard Contractual Clauses:
            </strong>{" "}
            We have implemented measures to protect your personal information,
            including by using the European Commission's Standard Contractual
            Clauses for transfers of personal information between our group
            companies and between us and our third-party providers.
          </p>

          <H2 id="inforetain">8. HOW LONG DO WE KEEP YOUR INFORMATION?</H2>
          <InShort>
            We keep your information for as long as necessary to fulfill the
            purposes outlined in this Privacy Notice unless otherwise required
            by law.
          </InShort>
          <p>
            We will only keep your personal information for as long as it is
            necessary for the purposes set out in this Privacy Notice, unless a
            longer retention period is required or permitted by law. No purpose
            in this notice will require us keeping your personal information
            for longer than the period of time in which users have an account
            with us.
          </p>
          <p>
            When we have no ongoing legitimate business need to process your
            personal information, we will either delete or anonymize such
            information, or, if this is not possible, securely store your
            personal information and isolate it from any further processing
            until deletion is possible.
          </p>

          <H2 id="infosafe">9. HOW DO WE KEEP YOUR INFORMATION SAFE?</H2>
          <InShort>
            We aim to protect your personal information through a system of
            organizational and technical security measures.
          </InShort>
          <p>
            We have implemented appropriate and reasonable technical and
            organizational security measures designed to protect the security
            of any personal information we process. However, despite our
            safeguards, no electronic transmission over the Internet or
            information storage technology can be guaranteed to be 100% secure.
            You should only access the Services within a secure environment.
          </p>

          <H2 id="infominors">10. DO WE COLLECT INFORMATION FROM MINORS?</H2>
          <InShort>
            We do not knowingly collect data from or market to children under
            18 years of age or the equivalent age as specified by law in your
            jurisdiction.
          </InShort>
          <p>
            We do not knowingly collect, solicit data from, or market to
            children under 18 years of age, nor do we knowingly sell such
            personal information. By using the Services, you represent that you
            are at least 18 or the parent or guardian of such a minor. If we
            learn that personal information from users less than 18 years of
            age has been collected, we will deactivate the account and take
            reasonable measures to promptly delete such data. If you become
            aware of any data we may have collected from children under age 18,
            please contact us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            .
          </p>

          <H2 id="privacyrights">11. WHAT ARE YOUR PRIVACY RIGHTS?</H2>
          <InShort>
            Depending on your state of residence in the US or in some regions,
            such as the European Economic Area (EEA), United Kingdom (UK),
            Switzerland, and Canada, you have rights that allow you greater
            access to and control over your personal information.
          </InShort>
          <p>
            In some regions (like the EEA, UK, Switzerland, and Canada), you
            have certain rights under applicable data protection laws. These
            may include the right (i) to request access and obtain a copy of
            your personal information, (ii) to request rectification or
            erasure; (iii) to restrict the processing of your personal
            information; (iv) if applicable, to data portability; and (v) not
            to be subject to automated decision-making. You can make such a
            request by contacting us using the details provided in{" "}
            <A href="#contact">
              "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"
            </A>{" "}
            below.
          </p>
          <p>
            If you are located in the EEA or UK and you believe we are
            unlawfully processing your personal information, you also have the
            right to complain to your{" "}
            <A href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm">
              Member State data protection authority
            </A>{" "}
            or{" "}
            <A href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/">
              UK data protection authority
            </A>
            .
          </p>
          <p>
            If you are located in Switzerland, you may contact the{" "}
            <A href="https://www.edoeb.admin.ch/edoeb/en/home.html">
              Federal Data Protection and Information Commissioner
            </A>
            .
          </p>
          <p>
            <strong className="text-foreground">Withdrawing your consent:</strong>{" "}
            If we are relying on your consent to process your personal
            information, you have the right to withdraw your consent at any
            time by contacting us using the details provided in{" "}
            <A href="#contact">"HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"</A>{" "}
            below.
          </p>
          <p>
            <strong className="text-foreground">
              Opting out of marketing and promotional communications:
            </strong>{" "}
            You can unsubscribe from our marketing and promotional
            communications at any time by clicking on the unsubscribe link in
            the emails that we send, or by contacting us.
          </p>

          <H3>Account Information</H3>
          <p>
            If you would at any time like to review or change the information
            in your account or terminate your account, you can log in to your
            account settings and update your user account, or contact us using
            the contact information provided.
          </p>
          <p>
            <strong className="text-foreground">
              Cookies and similar technologies:
            </strong>{" "}
            Most Web browsers are set to accept cookies by default. For further
            information, please see our Cookie Notice:{" "}
            <Link to="/cookies" className="text-primary hover:underline">
              /cookies
            </Link>
            .
          </p>
          <p>
            If you have questions or comments about your privacy rights, you
            may email us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            .
          </p>

          <H2 id="DNT">12. CONTROLS FOR DO-NOT-TRACK FEATURES</H2>
          <p>
            Most web browsers and some mobile operating systems and mobile
            applications include a Do-Not-Track ("DNT") feature or setting you
            can activate to signal your privacy preference not to have data
            about your online browsing activities monitored and collected. At
            this stage, no uniform technology standard for recognizing and
            implementing DNT signals has been finalized. As such, we do not
            currently respond to DNT browser signals.
          </p>
          <p>
            California law requires us to let you know how we respond to web
            browser DNT signals. Because there currently is not an industry or
            legal standard for recognizing or honoring DNT signals, we do not
            respond to them at this time.
          </p>

          <H2 id="uslaws">
            13. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
          </H2>
          <InShort>
            If you are a resident of California, Colorado, Connecticut,
            Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota,
            Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island,
            Tennessee, Texas, Utah, or Virginia, you may have rights regarding
            your personal information.
          </InShort>

          <H3>Categories of Personal Information We Collect</H3>
          <p>
            The list below shows the categories of personal information we
            have collected in the past twelve (12) months. For a comprehensive
            inventory of all personal information we process, please refer to{" "}
            <A href="#infocollect">"WHAT INFORMATION DO WE COLLECT?"</A>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-muted/30 text-foreground">
                <tr>
                  <th className="text-left p-3 border-b border-border">Category</th>
                  <th className="text-left p-3 border-b border-border">Examples</th>
                  <th className="text-left p-3 border-b border-border">Collected</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["A. Identifiers", "Real name, alias, postal address, phone, IP, email, account name", "YES"],
                  ["B. California Customer Records statute", "Name, contact info, employment, financial information", "YES"],
                  ["C. Protected classification characteristics", "Gender, age, race, national origin, marital status", "NO"],
                  ["D. Commercial information", "Transaction information, purchase history, payment information", "YES"],
                  ["E. Biometric information", "Fingerprints and voiceprints", "NO"],
                  ["F. Internet or other network activity", "Browsing history, search history, interactions", "YES"],
                  ["G. Geolocation data", "Device location", "YES"],
                  ["H. Audio, electronic, sensory information", "Images, audio, video recordings", "NO"],
                  ["I. Professional or employment-related information", "Business contact details, job title, work history", "NO"],
                  ["J. Education Information", "Student records and directory information", "NO"],
                  ["K. Inferences drawn from personal information", "Profiles about preferences and characteristics", "YES"],
                  ["L. Sensitive personal information", "—", "NO"],
                ].map(([c, e, v]) => (
                  <tr key={c} className="border-b border-border last:border-0">
                    <td className="p-3 align-top text-foreground">{c}</td>
                    <td className="p-3 align-top">{e}</td>
                    <td className="p-3 align-top font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            We will use and retain the collected personal information as needed
            to provide the Services or for: Categories A, B, D, F, G, and K —
            as long as the user has an account with us.
          </p>

          <H3>Sources of Personal Information</H3>
          <p>
            Learn more about the sources of personal information we collect in{" "}
            <A href="#infocollect">"WHAT INFORMATION DO WE COLLECT?"</A>
          </p>

          <H3>How We Use and Share Personal Information</H3>
          <p>
            Learn more about how we use your personal information in{" "}
            <A href="#infouse">"HOW DO WE PROCESS YOUR INFORMATION?"</A>
          </p>
          <p>
            We may disclose your personal information with our service
            providers pursuant to a written contract between us and each
            service provider. Learn more in{" "}
            <A href="#whoshare">
              "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"
            </A>
          </p>
          <p>
            We have not sold or shared any personal information to third
            parties for a business or commercial purpose in the preceding
            twelve (12) months.
          </p>

          <H3>Your Rights</H3>
          <p>
            You have rights under certain US state data protection laws. These
            rights include:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Right to know whether or not we are processing your personal data</li>
            <li>Right to access your personal data</li>
            <li>Right to correct inaccuracies in your personal data</li>
            <li>Right to request the deletion of your personal data</li>
            <li>Right to obtain a copy of the personal data you previously shared with us</li>
            <li>Right to non-discrimination for exercising your rights</li>
            <li>
              Right to opt out of the processing of your personal data for
              targeted advertising, sale, or profiling in furtherance of
              decisions that produce legal or similarly significant effects
            </li>
          </ul>

          <H3>How to Exercise Your Rights</H3>
          <p>
            To exercise these rights, you can contact us by emailing us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            , or by referring to the contact details at the bottom of this
            document.
          </p>

          <H3>Request Verification</H3>
          <p>
            Upon receiving your request, we will need to verify your identity
            to determine you are the same person about whom we have the
            information in our system.
          </p>

          <H3>Appeals</H3>
          <p>
            Under certain US state data protection laws, if we decline to take
            action regarding your request, you may appeal our decision by
            emailing us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            .
          </p>

          <H3>California "Shine The Light" Law</H3>
          <p>
            California Civil Code Section 1798.83, also known as the "Shine The
            Light" law, permits our users who are California residents to
            request and obtain from us, once a year and free of charge,
            information about categories of personal information (if any) we
            disclosed to third parties for direct marketing purposes. To make
            such a request, contact us as described in{" "}
            <A href="#contact">"HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"</A>
          </p>

          <H2 id="otherlaws">14. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?</H2>
          <InShort>
            You may have additional rights based on the country you reside in.
          </InShort>
          <H3>Republic of South Africa</H3>
          <p>
            At any time, you have the right to request access to or correction
            of your personal information. You can make such a request by
            contacting us using the details provided in{" "}
            <A href="#request">
              "HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM
              YOU?"
            </A>
          </p>
          <p>
            If you are unsatisfied with the manner in which we address any
            complaint, you can contact the office of the regulator:{" "}
            <A href="https://inforegulator.org.za/">
              The Information Regulator (South Africa)
            </A>
            . General enquiries: enquiries@inforegulator.org.za. Complaints
            (POPIA/PAIA form 5): PAIAComplaints@inforegulator.org.za &
            POPIAComplaints@inforegulator.org.za.
          </p>

          <H2 id="clausea">15. BRAZIL (LGPD)</H2>
          <p>
            If you are a resident of Brazil, your personal information is
            processed in accordance with the Lei Geral de Proteção de Dados
            (LGPD - Law No. 13,709/2018). You have the right to access,
            correct, delete, and port your personal data. To exercise these
            rights, contact us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            .
          </p>

          <H2 id="policyupdates">16. DO WE MAKE UPDATES TO THIS NOTICE?</H2>
          <InShort>
            Yes, we will update this notice as necessary to stay compliant with
            relevant laws.
          </InShort>
          <p>
            We may update this Privacy Notice from time to time. The updated
            version will be indicated by an updated "Revised" date at the top
            of this Privacy Notice. We encourage you to review this Privacy
            Notice frequently to be informed of how we are protecting your
            information.
          </p>

          <H2 id="contact">17. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</H2>
          <p>
            If you have questions or comments about this notice, you may email
            us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>{" "}
            or contact us by post at:
          </p>
          <address className="not-italic text-foreground">
            Americascom, Inc<br />
            651 N Broad St, Ste 206<br />
            Middletown, DE 19709<br />
            United States
          </address>

          <H2 id="request">
            18. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM
            YOU?
          </H2>
          <p>
            Based on the applicable laws of your country or state of residence
            in the US, you may have the right to request access to the personal
            information we collect from you, details about how we have
            processed it, correct inaccuracies, or delete your personal
            information. You may also have the right to withdraw your consent
            to our processing of your personal information. To request to
            review, update, or delete your personal information, please contact
            us at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            .
          </p>

          <p className="text-sm text-muted-foreground pt-4">
            This Privacy Policy was created using Termly's Privacy Policy Generator.
          </p>
        </article>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
