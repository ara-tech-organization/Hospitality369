import { useEffect, useState } from 'react';
import { Save, FileText, Gift, Building2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { PageHeader, Card } from '../../components/ui/Data';
import { Input, Toggle } from '../../components/ui/Form';
import { Alert, PageLoader } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { REFERRALS_ENABLED } from '../../lib/features';

export default function Settings() {
  const toast = useToast();
  const { data, error, reload } = useApi('/settings');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      const { applications, referral, site } = data.settings;
      setForm({ applications: { ...applications }, referral: { ...referral }, site: { ...site } });
    }
  }, [data]);

  if (error) return <Alert>{error}</Alert>;
  if (!form) return <PageLoader />;

  const set = (group, key) => (value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
  const num = (group, key) => (e) => set(group, key)(e.target.value === '' ? '' : Number(e.target.value));
  const err = (path) => errors[path];

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.put('/settings', REFERRALS_ENABLED ? form : { applications: form.applications, site: form.site });
      toast.success('Settings saved');
      reload();
    } catch (ex) {
      setErrors(fieldErrors(ex));
      toast.error(errorMessage(ex));
    } finally {
      setSaving(false);
    }
  };

  const r = form.referral || {};
  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description={data.settings.updatedAt ? `Last updated ${formatDateTime(data.settings.updatedAt)}` : 'Application-wide configuration'}
        actions={<Button type="submit" icon={Save} loading={saving}>Save settings</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-600" aria-hidden />Applications</span>} description="Control how candidates apply">
          <div className="space-y-6">
            <Toggle checked={form.applications.accepting} onChange={set('applications', 'accepting')} label="Accepting applications" description="When off, the public form shows a 'paused' message." />
            <Input label="Duplicate application window (days)" type="number" min={0} max={365} value={form.applications.duplicateWindowDays} onChange={num('applications', 'duplicateWindowDays')} error={err('applications.duplicateWindowDays')} hint="The same email or mobile can't apply to the same role again within this window. 0 disables the check." />
          </div>
        </Card>

        {REFERRALS_ENABLED && (
        <Card title={<span className="flex items-center gap-2"><Gift className="h-4 w-4 text-brand-600" aria-hidden />Referral point rules</span>} description="Points are awarded once per milestone">
          <div className="space-y-5">
            <Toggle checked={r.enabled} onChange={set('referral', 'enabled')} label="Referral programme enabled" description="Pauses new sign-ups and new points when off." />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="On application" type="number" min={0} value={r.pointsOnApplication} onChange={num('referral', 'pointsOnApplication')} error={err('referral.pointsOnApplication')} />
              <Input label="On shortlist" type="number" min={0} value={r.pointsOnShortlist} onChange={num('referral', 'pointsOnShortlist')} error={err('referral.pointsOnShortlist')} />
              <Input label="On hire" type="number" min={0} value={r.pointsOnHire} onChange={num('referral', 'pointsOnHire')} error={err('referral.pointsOnHire')} />
            </div>
            <Input label="Max valid referrals per referrer per day" type="number" min={1} value={r.maxReferralsPerDay} onChange={num('referral', 'maxReferralsPerDay')} error={err('referral.maxReferralsPerDay')} hint="Limits abuse; extra referrals are recorded but earn no points." />
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-navy-600">A hired referral currently earns up to <b className="text-navy-900">{(Number(r.pointsOnApplication) || 0) + (Number(r.pointsOnShortlist) || 0) + (Number(r.pointsOnHire) || 0)}</b> points.</p>
          </div>
        </Card>
        )}

        <Card className="xl:col-span-2" title={<span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand-600" aria-hidden />Public contact details</span>} description="Shown in the website footer and privacy notice">
          <div className="grid gap-5 md:grid-cols-3">
            <Input label="Contact email" type="email" value={form.site.contactEmail} onChange={(e) => set('site', 'contactEmail')(e.target.value)} error={err('site.contactEmail')} />
            <Input label="Contact phone" value={form.site.contactPhone} onChange={(e) => set('site', 'contactPhone')(e.target.value)} error={err('site.contactPhone')} />
            <Input label="Address" value={form.site.address} onChange={(e) => set('site', 'address')(e.target.value)} error={err('site.address')} />
          </div>
        </Card>
      </div>
    </form>
  );
}
