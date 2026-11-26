import Seo from '../../components/seo/Seo';
import { usePublicConfig } from '../../hooks/usePublicConfig';

const SECTIONS = [
  ['What we collect', 'When you apply we collect your full name, email address, mobile number, the role and position you are applying for, and your CV/resume. If you join the referral programme we collect your name, email and optionally your mobile number. For programme enquiries we collect the details you provide in the form.'],
  ['Why we collect it', 'We use your information solely to assess your application for hospitality roles, contact you about opportunities and programmes you have asked about, and operate the referral programme fairly.'],
  ['How we protect it', 'CVs are stored in private storage that is never publicly accessible. Only authorised members of our recruitment team, whose access is controlled by role-based permissions, can view or download candidate information. Every resume download and export is recorded in an audit log.'],
  ['How long we keep it', 'We keep application data for as long as necessary for recruitment purposes, typically up to 24 months, after which it is deleted or anonymised unless you have asked us to keep it longer.'],
  ['Your rights', 'You can ask to access, correct or delete your personal information at any time by contacting us. You can also withdraw your consent, after which we will stop processing your application.'],
];

export default function Privacy() {
  const config = usePublicConfig();
  return (
    <>
      <Seo />
      <article className="container-page max-w-3xl pb-24 pt-36">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-5xl font-medium">Privacy notice</h1>
        <p className="mt-4 text-navy-500">How Hospitality369 handles candidate and referral information.</p>
        <div className="mt-12 space-y-10">
          {SECTIONS.map(([h, p]) => (
            <section key={h}>
              <h2 className="font-sans text-xl font-semibold">{h}</h2>
              <p className="mt-3 leading-relaxed text-navy-600">{p}</p>
            </section>
          ))}
          <section>
            <h2 className="font-sans text-xl font-semibold">Contact</h2>
            <p className="mt-3 leading-relaxed text-navy-600">
              Questions about your data? Email us at{' '}
              <a className="font-semibold text-navy-900 underline decoration-brand-300 underline-offset-2" href={`mailto:${config?.contact?.contactEmail || 'ravi@theivar.in'}`}>
                {config?.contact?.contactEmail || 'ravi@theivar.in'}
              </a>.
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
