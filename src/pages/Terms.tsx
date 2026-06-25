import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TOC: { id: string; label: string }[] = [
  { id: "services", label: "1. OUR SERVICES" },
  { id: "ip", label: "2. INTELLECTUAL PROPERTY RIGHTS" },
  { id: "user-representations", label: "3. USER REPRESENTATIONS" },
  { id: "prohibited-activities", label: "4. PROHIBITED ACTIVITIES" },
  { id: "user-generated-contributions", label: "5. USER GENERATED CONTRIBUTIONS" },
  { id: "contribution-license", label: "6. CONTRIBUTION LICENSE" },
  { id: "services-management", label: "7. SERVICES MANAGEMENT" },
  { id: "term-termination", label: "8. TERM AND TERMINATION" },
  { id: "modifications-interruptions", label: "9. MODIFICATIONS AND INTERRUPTIONS" },
  { id: "governing-law", label: "10. GOVERNING LAW" },
  { id: "dispute-resolution", label: "11. DISPUTE RESOLUTION" },
  { id: "corrections", label: "12. CORRECTIONS" },
  { id: "disclaimer", label: "13. DISCLAIMER" },
  { id: "limitations-liability", label: "14. LIMITATIONS OF LIABILITY" },
  { id: "indemnification", label: "15. INDEMNIFICATION" },
  { id: "user-data", label: "16. USER DATA" },
  { id: "electronic-communications", label: "17. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES" },
  { id: "miscellaneous", label: "18. MISCELLANEOUS" },
  { id: "ai-disclaimer", label: "19. AI-GENERATED REPORTS DISCLAIMER" },
  { id: "contact-us", label: "20. CONTACT US" },
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

const Ul = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc pl-6 space-y-2">{children}</ul>
);

const Terms = () => (
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
              Terms of Service
            </h1>
            <p className="text-sm">Last updated July 04, 2026</p>
          </header>

          <H2 id="agreement">AGREEMENT TO OUR LEGAL TERMS</H2>
          <p>
            We are <strong className="text-foreground">Americascom, Inc.</strong>{" "}
            (doing business as{" "}
            <strong className="text-foreground">SONGSS Intelligence</strong>)
            ("Company," "we," "us," "our").
          </p>
          <p>
            We operate{" "}
            <A href="https://app.songssintelligence.com">
              https://app.songssintelligence.com
            </A>
            , as well as any other related products and services that refer or
            link to these legal terms (the "Legal Terms") (collectively, the
            "Services").
          </p>
          <p>
            You can contact us by email at{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>{" "}
            or by mail to 651 N Broad St, Ste 206, Middletown, DE 19709, United
            States.
          </p>
          <p>
            These Legal Terms constitute a legally binding agreement made between
            you, whether personally or on behalf of an entity ("you"), and
            Americascom, Inc., concerning your access to and use of the Services.
            You agree that by accessing the Services, you have read, understood,
            and agreed to be bound by all of these Legal Terms.{" "}
            <strong className="text-foreground">
              IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE
              EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE
              USE IMMEDIATELY.
            </strong>
          </p>
          <p>
            Supplemental terms and conditions or documents that may be posted on
            the Services from time to time are hereby expressly incorporated
            herein by reference. We reserve the right, in our sole discretion, to
            make changes or modifications to these Legal Terms at any time and
            for any reason. We will alert you about any changes by updating the
            "Last updated" date of these Legal Terms, and you waive any right to
            receive specific notice of each such change. It is your responsibility
            to periodically review these Legal Terms to stay informed of updates.
            You will be subject to, and will be deemed to have been made aware of
            and to have accepted, the changes in any revised Legal Terms by your
            continued use of the Services after the date such revised Legal Terms
            are posted.
          </p>
          <p>
            We recommend that you print a copy of these Legal Terms for your records.
          </p>

          <H2 id="toc">TABLE OF CONTENTS</H2>
          <ol className="list-none pl-0 space-y-2">
            {TOC.map((item) => (
              <li key={item.id}>
                <A href={`#${item.id}`}>{item.label}</A>
              </li>
            ))}
          </ol>

          <H2 id="services">1. OUR SERVICES</H2>
          <p>
            The information provided when using the Services is not intended for
            distribution to or use by any person or entity in any jurisdiction or
            country where such distribution or use would be contrary to law or
            regulation or which would subject us to any registration requirement
            within such jurisdiction or country. Accordingly, those persons who
            choose to access the Services from other locations do so on their own
            initiative and are solely responsible for compliance with local laws,
            if and to the extent local laws are applicable.
          </p>

          <H2 id="ip">2. INTELLECTUAL PROPERTY RIGHTS</H2>
          <H3>Our intellectual property</H3>
          <p>
            We are the owner or the licensee of all intellectual property rights
            in our Services, including all source code, databases, functionality,
            software, website designs, audio, video, text, photographs, and
            graphics in the Services (collectively, the "Content"), as well as the
            trademarks, service marks, and logos contained therein (the "Marks").
          </p>
          <p>
            Our Content and Marks are protected by copyright and trademark laws
            (and various other intellectual property rights and unfair competition
            laws) and treaties around the world.
          </p>
          <p>
            The Content and Marks are provided in or through the Services "AS IS"
            for your personal, non-commercial use or internal business purpose only.
          </p>

          <H3>Your use of our Services</H3>
          <p>
            Subject to your compliance with these Legal Terms, including the
            "PROHIBITED ACTIVITIES" section below, we grant you a non-exclusive,
            non-transferable, revocable license to:
          </p>
          <Ul>
            <li>access the Services; and</li>
            <li>
              download or print a copy of any portion of the Content to which you
              have properly gained access,
            </li>
          </Ul>
          <p>
            solely for your personal, non-commercial use or internal business
            purpose.
          </p>
          <p>
            Except as set out in this section or elsewhere in our Legal Terms, no
            part of the Services and no Content or Marks may be copied, reproduced,
            aggregated, republished, uploaded, posted, publicly displayed, encoded,
            translated, transmitted, distributed, sold, licensed, or otherwise
            exploited for any commercial purpose whatsoever, without our express
            prior written permission.
          </p>
          <p>
            If you wish to make any use of the Services, Content, or Marks other
            than as set out in this section or elsewhere in our Legal Terms, please
            address your request to:{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
            . If we ever grant you the permission to post, reproduce, or publicly
            display any part of our Services or Content, you must identify us as
            the owners or licensors of the Services, Content, or Marks and ensure
            that any copyright or proprietary notice appears or is visible on
            posting, reproducing, or displaying our Content.
          </p>
          <p>
            We reserve all rights not expressly granted to you in and to the
            Services, Content, and Marks.
          </p>
          <p>
            Any breach of these Intellectual Property Rights will constitute a
            material breach of our Legal Terms and your right to use our Services
            will terminate immediately.
          </p>

          <H3>Your submissions</H3>
          <p>
            By directly sending us any question, comment, suggestion, idea,
            feedback, or other information about the Services ("Submissions"), you
            agree to assign to us all intellectual property rights in such
            Submission. You agree that we shall own this Submission and be entitled
            to its unrestricted use and dissemination for any lawful purpose,
            commercial or otherwise, without acknowledgment or compensation to you.
          </p>
          <p>
            You are responsible for what you post or upload: By sending us
            Submissions through any part of the Services you confirm that you have
            read and agree with our "PROHIBITED ACTIVITIES" and will not post, send,
            publish, upload, or transmit through the Services any Submission that is
            illegal, harassing, hateful, harmful, defamatory, obscene, bullying,
            abusive, discriminatory, threatening to any person or group, sexually
            explicit, false, inaccurate, deceitful, or misleading.
          </p>

          <H2 id="user-representations">3. USER REPRESENTATIONS</H2>
          <p>
            By using the Services, you represent and warrant that: (1) you have the
            legal capacity and you agree to comply with these Legal Terms; (2) you
            are not a minor in the jurisdiction in which you reside; (3) you will
            not access the Services through automated or non-human means, whether
            through a bot, script or otherwise; (4) you will not use the Services
            for any illegal or unauthorized purpose; and (5) your use of the Services
            will not violate any applicable law or regulation.
          </p>
          <p>
            If you provide any information that is untrue, inaccurate, not current,
            or incomplete, we have the right to suspend or terminate your account
            and refuse any and all current or future use of the Services (or any
            portion thereof).
          </p>

          <H2 id="prohibited-activities">4. PROHIBITED ACTIVITIES</H2>
          <p>
            You may not access or use the Services for any purpose other than that
            for which we make the Services available. The Services may not be used in
            connection with any commercial endeavors except those that are
            specifically endorsed or approved by us.
          </p>
          <p>As a user of the Services, you agree not to:</p>
          <Ul>
            <li>
              Systematically retrieve data or other content from the Services to
              create or compile, directly or indirectly, a collection, compilation,
              database, or directory without written permission from us.
            </li>
            <li>
              Trick, defraud, or mislead us and other users, especially in any
              attempt to learn sensitive account information such as user passwords.
            </li>
            <li>
              Circumvent, disable, or otherwise interfere with security-related
              features of the Services.
            </li>
            <li>
              Disparage, tarnish, or otherwise harm, in our opinion, us and/or the
              Services.
            </li>
            <li>
              Use any information obtained from the Services in order to harass,
              abuse, or harm another person.
            </li>
            <li>
              Make improper use of our support services or submit false reports of
              abuse or misconduct.
            </li>
            <li>
              Use the Services in a manner inconsistent with any applicable laws or
              regulations.
            </li>
            <li>
              Engage in unauthorized framing of or linking to the Services.
            </li>
            <li>
              Upload or transmit viruses, Trojan horses, or other malicious material.
            </li>
            <li>
              Engage in any automated use of the system, such as using scripts, data
              mining, robots, or similar data gathering and extraction tools.
            </li>
            <li>
              Delete the copyright or other proprietary rights notice from any Content.
            </li>
            <li>Attempt to impersonate another user or person.</li>
            <li>
              Interfere with, disrupt, or create an undue burden on the Services or
              the networks or services connected to the Services.
            </li>
            <li>
              Attempt to bypass any measures of the Services designed to prevent or
              restrict access.
            </li>
            <li>
              Copy or adapt the Services' software, including but not limited to
              Flash, PHP, HTML, JavaScript, or other code.
            </li>
            <li>
              Except as permitted by applicable law, decipher, decompile,
              disassemble, or reverse engineer any of the software comprising or in
              any way making up a part of the Services.
            </li>
            <li>
              Use the Services as part of any effort to compete with us or otherwise
              use the Services and/or the Content for any revenue-generating endeavor
              or commercial enterprise.
            </li>
            <li>Sell or otherwise transfer your profile.</li>
          </Ul>

          <H2 id="user-generated-contributions">5. USER GENERATED CONTRIBUTIONS</H2>
          <p>
            The Services do not offer users the ability to submit or post content.
            We may provide you with the opportunity to create, submit, post, display,
            transmit, perform, publish, distribute, or broadcast content and materials
            to us or on the Services in the future. Any such contributions will be
            subject to these Legal Terms.
          </p>

          <H2 id="contribution-license">6. CONTRIBUTION LICENSE</H2>
          <p>
            You and the Services agree that we may access, store, process, and use
            any information and personal data that you provide and your choices
            (including settings).
          </p>
          <p>
            By submitting suggestions or other feedback regarding the Services, you
            agree that we can use and share such feedback for any purpose without
            compensation to you.
          </p>
          <p>
            We do not assert any ownership over your Contributions. You retain full
            ownership of all of your Contributions and any intellectual property
            rights or other proprietary rights associated with your Contributions.
          </p>

          <H2 id="services-management">7. SERVICES MANAGEMENT</H2>
          <p>
            We reserve the right, but not the obligation, to: (1) monitor the
            Services for violations of these Legal Terms; (2) take appropriate legal
            action against anyone who, in our sole discretion, violates the law or
            these Legal Terms; (3) in our sole discretion and without limitation,
            refuse, restrict access to, limit the availability of, or disable any of
            your Contributions or any portion thereof; (4) remove from the Services
            or otherwise disable all files and content that are excessive in size or
            are in any way burdensome to our systems; and (5) otherwise manage the
            Services in a manner designed to protect our rights and property and to
            facilitate the proper functioning of the Services.
          </p>

          <H2 id="term-termination">8. TERM AND TERMINATION</H2>
          <p>
            These Legal Terms shall remain in full force and effect while you use the
            Services.{" "}
            <strong className="text-foreground">
              WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE
              THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY,
              DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP
              ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING
              WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR
              COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR
              REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES
              OR DELETE ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME,
              WITHOUT WARNING, IN OUR SOLE DISCRETION.
            </strong>
          </p>
          <p>
            If we terminate or suspend your account for any reason, you are
            prohibited from registering and creating a new account under your name,
            a fake or borrowed name, or the name of any third party, even if you may
            be acting on behalf of the third party.
          </p>

          <H2 id="modifications-interruptions">9. MODIFICATIONS AND INTERRUPTIONS</H2>
          <p>
            We reserve the right to change, modify, or remove the contents of the
            Services at any time or for any reason at our sole discretion without
            notice. We cannot guarantee the Services will be available at all times.
            We may experience hardware, software, or other problems or need to
            perform maintenance related to the Services, resulting in interruptions,
            delays, or errors. You agree that we have no liability whatsoever for any
            loss, damage, or inconvenience caused by your inability to access or use
            the Services during any downtime or discontinuance of the Services.
          </p>

          <H2 id="governing-law">10. GOVERNING LAW</H2>
          <p>
            These Legal Terms shall be governed by and defined following the laws of{" "}
            <strong className="text-foreground">Delaware</strong>. Americascom, Inc.
            and yourself irrevocably consent that the courts of Delaware shall have
            exclusive jurisdiction to resolve any dispute which may arise in
            connection with these Legal Terms.
          </p>

          <H2 id="dispute-resolution">11. DISPUTE RESOLUTION</H2>
          <H3>Informal Negotiations</H3>
          <p>
            To expedite resolution and control the cost of any dispute, controversy,
            or claim related to these Legal Terms (each a "Dispute" and collectively,
            the "Disputes") brought by either you or us (individually, a "Party"
            and collectively, the "Parties"), the Parties agree to first attempt to
            negotiate any Dispute informally for at least 30 days before initiating
            arbitration. Such informal negotiations commence upon written notice
            from one Party to the other Party.
          </p>

          <H3>Binding Arbitration</H3>
          <p>
            If the parties are unable to resolve the dispute through informal
            negotiation, the dispute shall be finally resolved by arbitration in
            accordance with the United Nations Commission on International Trade Law
            Arbitration Rules in force at the time of commencement of the
            arbitration. The number of arbitrators shall be one (1). The seat, or
            legal place, of arbitration shall be New Castle County, Delaware, United
            States. The language of the proceedings shall be English. The governing
            law of these Legal Terms shall be the substantive law of Delaware.
          </p>

          <H3>Restrictions</H3>
          <p>
            The Parties agree that any arbitration shall be limited to the Dispute
            between the Parties individually. To the full extent permitted by law,
            (a) no arbitration shall be joined with any other proceeding; (b) there
            is no right or authority for any Dispute to be arbitrated on a
            class-action basis or to utilize class action procedures; and (c) there
            is no right or authority for any Dispute to be brought in a purported
            representative capacity on behalf of the general public or any other
            persons.
          </p>

          <H3>Exceptions to Informal Negotiations and Arbitration</H3>
          <p>
            The Parties agree that the following Disputes are not subject to the
            above provisions concerning informal negotiations and binding
            arbitration: (a) any Disputes seeking to enforce or protect, or
            concerning the validity of, any of the intellectual property rights of a
            Party; (b) any Dispute related to, or arising from, allegations of theft,
            piracy, invasion of privacy, or unauthorized use; and (c) any claim for
            injunctive relief.
          </p>

          <H2 id="corrections">12. CORRECTIONS</H2>
          <p>
            There may be information on the Services that contains typographical
            errors, inaccuracies, or omissions, including descriptions, pricing,
            availability, and various other information. We reserve the right to
            correct any errors, inaccuracies, or omissions and to change or update
            the information on the Services at any time, without prior notice.
          </p>

          <H2 id="disclaimer">13. DISCLAIMER</H2>
          <p>
            <strong className="text-foreground">
              THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU
              AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE
              FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS
              OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF,
              INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE
              ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT AND WE WILL ASSUME
              NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR
              INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY
              DAMAGE RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY
              UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL
              PERSONAL AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY
              INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5)
              ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED
              TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS
              OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE
              OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED,
              TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.
            </strong>
          </p>

          <H2 id="limitations-liability">14. LIMITATIONS OF LIABILITY</H2>
          <p>
            <strong className="text-foreground">
              IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO
              YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL,
              EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST
              PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR
              USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY
              OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED
              HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS
              OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT
              PAID BY YOU TO US IN THE SIX (6) MONTHS PRIOR TO THE CLAIM. CERTAIN
              US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON
              IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES.
              IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR
              LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
            </strong>
          </p>

          <H2 id="indemnification">15. INDEMNIFICATION</H2>
          <p>
            You agree to defend, indemnify, and hold us harmless, including our
            subsidiaries, affiliates, and all of our respective officers, agents,
            partners, and employees, from and against any loss, damage, liability,
            claim, or demand, including reasonable attorneys' fees and expenses,
            made by any third party due to or arising out of: (1) use of the
            Services; (2) breach of these Legal Terms; (3) any breach of your
            representations and warranties set forth in these Legal Terms; (4) your
            violation of the rights of a third party, including but not limited to
            intellectual property rights; or (5) any overt harmful act toward any
            other user of the Services with whom you connected via the Services.
          </p>

          <H2 id="user-data">16. USER DATA</H2>
          <p>
            We will maintain certain data that you transmit to the Services for the
            purpose of managing the performance of the Services, as well as data
            relating to your use of the Services. Although we perform regular routine
            backups of data, you are solely responsible for all data that you
            transmit or that relates to any activity you have undertaken using the
            Services. You agree that we shall have no liability to you for any loss
            or corruption of any such data, and you hereby waive any right of action
            against us arising from any such loss or corruption of such data.
          </p>

          <H2 id="electronic-communications">
            17. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
          </H2>
          <p>
            Visiting the Services, sending us emails, and completing online forms
            constitute electronic communications. You consent to receive
            electronic communications, and you agree that all agreements, notices,
            disclosures, and other communications we provide to you electronically,
            via email and on the Services, satisfy any legal requirement that such
            communication be in writing.{" "}
            <strong className="text-foreground">
              YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS,
              ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES,
              POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR
              VIA THE SERVICES.
            </strong>
          </p>

          <H2 id="miscellaneous">18. MISCELLANEOUS</H2>
          <p>
            These Legal Terms and any policies or operating rules posted by us on the
            Services or in respect to the Services constitute the entire agreement
            and understanding between you and us. Our failure to exercise or enforce
            any right or provision of these Legal Terms shall not operate as a
            waiver of such right or provision. These Legal Terms operate to the
            fullest extent permissible by law. We may assign any or all of our
            rights and obligations to others at any time. If any provision or part of
            a provision of these Legal Terms is determined to be unlawful, void, or
            unenforceable, that provision or part of the provision is deemed
            severable from these Legal Terms and does not affect the validity and
            enforceability of any remaining provisions. There is no joint venture,
            partnership, employment or agency relationship created between you and us
            as a result of these Legal Terms or use of the Services.
          </p>

          <H2 id="ai-disclaimer">19. AI-GENERATED REPORTS DISCLAIMER</H2>
          <p>
            Reports generated by the{" "}
            <strong className="text-foreground">
              SONGSS Neural Intelligence Engine™ (SNIE™)
            </strong>{" "}
            are produced by artificial intelligence systems and are provided for
            informational purposes only. Americascom, Inc. does not guarantee the
            accuracy, completeness, or fitness for any particular purpose of
            AI-generated content. Users should exercise independent judgment before
            making business, financial, or career decisions based on report outputs.
          </p>

          <H2 id="contact-us">20. CONTACT US</H2>
          <p>
            In order to resolve a complaint regarding the Services or to receive
            further information regarding use of the Services, please contact us at:
          </p>
          <p className="text-foreground">
            <strong>Americascom, Inc.</strong> (doing business as{" "}
            <strong>SONGSS Intelligence</strong>)
            <br />
            651 N Broad St, Ste 206
            <br />
            Middletown, DE 19709
            <br />
            United States
            <br />
            Email:{" "}
            <A href="mailto:hello@songssintelligence.com">
              hello@songssintelligence.com
            </A>
          </p>

          <p className="pt-4 text-sm text-muted-foreground">
            This Terms of Service was created using Termly's{" "}
            <A href="https://termly.io/products/terms-and-conditions-generator/">
              Terms and Conditions Generator
            </A>
            .
          </p>
        </article>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
