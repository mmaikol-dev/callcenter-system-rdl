import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Activity, MessageSquareText, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: '/users' },
  { title: 'WhatsApp Alerts', href: '/whatsapp-alerts' },
];

const eventLabels: Record<string, string> = {
  stock_change: 'Every stock update',
  near_depletion: 'Near depletion',
  depleted: 'Depleted stock',
  recovery: 'Stock recovery',
};

interface Recipient {
  id: number;
  name: string;
  phone: string;
  events: string[];
  enabled: boolean;
}

interface DeliveryRecord {
  id: number;
  event_type: string;
  recipient: string;
  message: string;
  status: string;
  provider: string | null;
  attempts: number;
  error: string | null;
  created_at: string;
}

interface PageProps {
  recipients: Recipient[];
  notifications: DeliveryRecord[];
  providerStatus: { meta: boolean; openwa: boolean };
  eventTypes: string[];
}

interface RecipientDraft {
  name: string;
  phone: string;
  events: string[];
  enabled: boolean;
}

const emptyForm = { name: '', phone: '', events: ['stock_change', 'near_depletion', 'depleted'], opted_in: false };

export default function WhatsAppAlertsPage() {
  const { recipients, notifications, providerStatus, eventTypes } = usePage<PageProps>().props;
  const [form, setForm] = React.useState(emptyForm);
  const [drafts, setDrafts] = React.useState<Record<number, RecipientDraft>>({});
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    setDrafts(Object.fromEntries(recipients.map((recipient) => [recipient.id, {
      name: recipient.name,
      phone: recipient.phone,
      events: recipient.events || [],
      enabled: recipient.enabled,
    }])));
  }, [recipients]);

  const toggleEvent = (events: string[], event: string, checked: boolean) =>
    checked ? [...new Set([...events, event])] : events.filter((item) => item !== event);

  const addRecipient = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.opted_in) {
      toast.error('Confirm that this recipient has agreed to receive WhatsApp notifications.');
      return;
    }

    setProcessing(true);
    router.post('/whatsapp-alerts/recipients', form, {
      preserveScroll: true,
      onSuccess: () => {
        setForm(emptyForm);
        toast.success('Recipient added.');
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not add recipient.'),
      onFinish: () => setProcessing(false),
    });
  };

  const saveRecipient = (id: number) => {
    const draft = drafts[id];
    if (!draft) return;

    setProcessing(true);
    router.put(`/whatsapp-alerts/recipients/${id}`, draft, {
      preserveScroll: true,
      onSuccess: () => toast.success('Recipient settings saved.'),
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not save recipient.'),
      onFinish: () => setProcessing(false),
    });
  };

  const testRecipient = (id: number) => {
    setProcessing(true);
    router.post(`/whatsapp-alerts/recipients/${id}/test`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Test notification queued.'),
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not queue test notification.'),
      onFinish: () => setProcessing(false),
    });
  };

  const removeRecipient = (recipient: Recipient) => {
    if (!window.confirm(`Remove ${recipient.name} from inventory WhatsApp alerts?`)) return;
    router.delete(`/whatsapp-alerts/recipients/${recipient.id}`, {
      preserveScroll: true,
      onSuccess: () => toast.success('Recipient removed.'),
      onError: () => toast.error('Could not remove recipient.'),
    });
  };

  const retryNotification = (id: number) => {
    setProcessing(true);
    router.post(`/whatsapp-alerts/notifications/${id}/retry`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Retry queued.'),
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not retry notification.'),
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="WhatsApp Inventory Alerts" />
      <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Inventory communications"
          title="WhatsApp alerts"
          description="Manage opted-in recipients and monitor stock alert delivery."
          icon={MessageSquareText}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ProviderCard name="Meta WhatsApp Cloud API" configured={providerStatus.meta} primary />
          <ProviderCard name="OpenWA local gateway" configured={providerStatus.openwa} />
        </div>
        {!providerStatus.meta && !providerStatus.openwa && (
          <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
            No provider is fully configured. Add credentials to the server environment and restart the application before sending alerts.
          </p>
        )}

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Add an alert recipient</CardTitle>
            <CardDescription>Use international format (for example, +2547…). Only add people who have agreed to receive these messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addRecipient} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="recipient-name">Name</Label>
                <Input id="recipient-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={120} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipient-phone">WhatsApp number</Label>
                <Input id="recipient-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+254700000000" required />
              </div>
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 xl:grid-cols-4">
                {eventTypes.map((type) => (
                  <EventCheckbox
                    key={type}
                    id={`new-${type}`}
                    label={eventLabels[type] || type}
                    checked={form.events.includes(type)}
                    onChange={(checked) => setForm({ ...form, events: toggleEvent(form.events, type, checked) })}
                  />
                ))}
              </div>
              <label className="flex items-start gap-2 text-sm sm:col-span-2">
                <Checkbox checked={form.opted_in} onCheckedChange={(checked) => setForm({ ...form, opted_in: checked === true })} />
                <span>I confirm this person has consented to receive inventory notifications on WhatsApp.</span>
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" loading={processing} className="w-full sm:w-auto">
                  <Plus className="size-4" />
                  Add recipient
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>{recipients.length} configured recipient{recipients.length === 1 ? '' : 's'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipients.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Add an opted-in recipient to start receiving inventory alerts.</p>
              ) : recipients.map((recipient) => {
                const draft = drafts[recipient.id] || recipient;
                return (
                  <div key={recipient.id} className="min-w-0 rounded-xl border p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor={`name-${recipient.id}`}>Name</Label>
                        <Input id={`name-${recipient.id}`} value={draft.name} onChange={(event) => setDrafts({ ...drafts, [recipient.id]: { ...draft, name: event.target.value } })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`phone-${recipient.id}`}>Phone</Label>
                        <Input id={`phone-${recipient.id}`} value={draft.phone} onChange={(event) => setDrafts({ ...drafts, [recipient.id]: { ...draft, phone: event.target.value } })} />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {eventTypes.map((type) => (
                        <EventCheckbox
                          key={type}
                          id={`${recipient.id}-${type}`}
                          label={eventLabels[type] || type}
                          checked={draft.events.includes(type)}
                          onChange={(checked) => setDrafts({
                            ...drafts,
                            [recipient.id]: { ...draft, events: toggleEvent(draft.events, type, checked) },
                          })}
                        />
                      ))}
                    </div>
                    <label className="mt-4 flex items-center gap-2 text-sm">
                      <Checkbox checked={draft.enabled} onCheckedChange={(checked) => setDrafts({
                        ...drafts,
                        [recipient.id]: { ...draft, enabled: checked === true },
                      })} />
                      Enabled
                    </label>
                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-3">
                      <Button variant="ghost" size="sm" onClick={() => removeRecipient(recipient)} aria-label={`Remove ${recipient.name}`}>
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => testRecipient(recipient.id)} loading={processing}>
                        <Send className="size-4" />
                        Test
                      </Button>
                      <Button size="sm" onClick={() => saveRecipient(recipient.id)} loading={processing}>Save</Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Recent deliveries</CardTitle>
              <CardDescription>Latest 50 queued and sent inventory messages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No inventory WhatsApp messages yet.</p>
              ) : notifications.map((notification) => (
                <div key={notification.id} className="min-w-0 rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant={notification.status === 'sent' ? 'success' : notification.status === 'failed' ? 'destructive' : notification.status === 'unknown' ? 'warning' : 'secondary'}>
                        {notification.status}
                      </Badge>
                      <span className="text-xs font-medium">{eventLabels[notification.event_type] || notification.event_type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 break-words text-xs text-muted-foreground">{notification.recipient} · {notification.provider || 'pending provider'}</p>
                  <p className="mt-2 whitespace-pre-line break-words text-sm">{notification.message}</p>
                  {notification.error && <p className="mt-2 break-words text-xs text-destructive">{notification.error}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
                    <span className="text-xs text-muted-foreground">{notification.attempts} attempt{notification.attempts === 1 ? '' : 's'}</span>
                    {notification.status === 'failed' && (
                      <Button variant="outline" size="sm" onClick={() => retryNotification(notification.id)} loading={processing}>
                        <RefreshCw className="size-3.5" />
                        Retry
                      </Button>
                    )}
                    {notification.status === 'unknown' && (
                      <span className="text-right text-xs text-warning-foreground">Check delivery before retrying to avoid a duplicate.</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

function EventCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

function ProviderCard({ name, configured, primary = false }: { name: string; configured: boolean; primary?: boolean }) {
  return (
    <Card className="min-w-0 gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="size-4 shrink-0 text-muted-foreground" />
          <p className="truncate text-sm font-medium">{name}</p>
        </div>
        <Badge variant={configured ? 'success' : 'secondary'}>{configured ? 'Configured' : 'Needs setup'}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{primary ? 'Primary delivery provider' : 'Fallback if Meta clearly rejects a message'}</p>
    </Card>
  );
}
