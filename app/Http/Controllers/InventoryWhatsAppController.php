<?php

namespace App\Http\Controllers;

use App\Models\InventoryWhatsAppNotification;
use App\Models\InventoryWhatsAppRecipient;
use App\Services\InventoryWhatsAppNotifier;
use App\Services\WhatsAppInventoryDelivery;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InventoryWhatsAppController extends Controller
{
    public function index(Request $request, WhatsAppInventoryDelivery $delivery)
    {
        $this->authorizeAdministrator($request);

        return Inertia::render('whatsapp-alerts/index', [
            'recipients' => InventoryWhatsAppRecipient::orderBy('name')->get(),
            'notifications' => InventoryWhatsAppNotification::latest()->limit(50)->get(),
            'providerStatus' => [
                'meta' => $delivery->metaConfigured(),
                'openwa' => $delivery->openWaConfigured(),
            ],
            'eventTypes' => InventoryWhatsAppNotifier::EVENT_TYPES,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdministrator($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'regex:/^\+[1-9]\d{7,14}$/', 'unique:inventory_whatsapp_recipients,phone'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['required', Rule::in(InventoryWhatsAppNotifier::EVENT_TYPES)],
            'opted_in' => ['accepted'],
        ]);

        InventoryWhatsAppRecipient::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'events' => array_values(array_unique($data['events'])),
            'enabled' => true,
            'opted_in_at' => now(),
        ]);

        return back()->with('success', 'WhatsApp recipient added.');
    }

    public function update(Request $request, InventoryWhatsAppRecipient $recipient)
    {
        $this->authorizeAdministrator($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => [
                'required',
                'string',
                'regex:/^\+[1-9]\d{7,14}$/',
                Rule::unique('inventory_whatsapp_recipients', 'phone')->ignore($recipient->id),
            ],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['required', Rule::in(InventoryWhatsAppNotifier::EVENT_TYPES)],
            'enabled' => ['required', 'boolean'],
        ]);

        $recipient->update([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'events' => array_values(array_unique($data['events'])),
            'enabled' => $data['enabled'],
        ]);

        return back()->with('success', 'WhatsApp recipient updated.');
    }

    public function destroy(Request $request, InventoryWhatsAppRecipient $recipient)
    {
        $this->authorizeAdministrator($request);
        $recipient->delete();

        return back()->with('success', 'WhatsApp recipient removed.');
    }

    public function test(Request $request, InventoryWhatsAppRecipient $recipient)
    {
        $this->authorizeAdministrator($request);

        if (! $recipient->enabled || ! $recipient->opted_in_at) {
            return back()->withErrors(['recipient' => 'Enable the recipient and confirm their opt-in before sending a test.']);
        }

        app(InventoryWhatsAppNotifier::class)->queueTest($recipient, $request->user());

        return back()->with('success', 'Test message queued for delivery.');
    }

    public function retry(Request $request, InventoryWhatsAppNotification $notification)
    {
        $this->authorizeAdministrator($request);

        if ($notification->status !== 'failed') {
            return back()->withErrors(['notification' => 'Only failed messages can be retried. Messages with an unknown outcome must be checked before retrying.']);
        }

        $notification->update([
            'status' => 'queued',
            'error' => null,
        ]);

        \App\Jobs\SendInventoryWhatsAppNotification::dispatch($notification->id)->afterCommit();

        return back()->with('success', 'Notification retry queued.');
    }

    private function authorizeAdministrator(Request $request): void
    {
        abort_unless(
            in_array($request->user()?->roles, ['admin', 'superadmin'], true),
            403,
        );
    }
}
