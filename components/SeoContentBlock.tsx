import Link from "next/link";

interface SeoContentBlockProps {
  intro: string;
  guideTitle: string;
  guide: string;
  applicationsTitle: string;
  applications: string[];
  faq: { question: string; answer: string }[];
  relatedLinks?: { href: string; label: string }[];
}

export default function SeoContentBlock({
  intro,
  guideTitle,
  guide,
  applicationsTitle,
  applications,
  faq,
  relatedLinks,
}: SeoContentBlockProps) {
  return (
    <section className="mt-16 border-t border-border pt-12 space-y-10 text-sm text-muted leading-relaxed">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Informazioni</h2>
        <p>{intro}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">{guideTitle}</h2>
        <p>{guide}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">{applicationsTitle}</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          {applications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {faq.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Domande frequenti</h2>
          <dl className="space-y-4">
            {faq.map((item) => (
              <div key={item.question}>
                <dt className="font-medium text-foreground">{item.question}</dt>
                <dd className="mt-1">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {relatedLinks && relatedLinks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Collegamenti utili</h2>
          <ul className="flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-accent hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
