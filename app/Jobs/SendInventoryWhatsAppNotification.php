<?php

namespace App\Jobs;

use App\Models\InventoryWhatsAppNotification;
use App\Services\WhatsAppInventoryDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class SendInventoryWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300];

    public function __construct(public int $notificationId)
    {
    }

    public function handle(WhatsAppInventoryDelivery $delivery): void
    {
        $notification = InventoryWhatsAppNotification::findOrFail($this->notificationId);

        if ($notification->status === 'sent') {
            return;
        }

        $notification->update([
            'status' => 'sending',
            'attempts' => $notification->attempts + 1,
            'error' => null,
        ]);

        try {
            $result = $delivery->send($notification);
        } catch (\App\Exceptions\WhatsAppProviderException $exception) {
            $notification->update([
                'status' => $exception->fallbackSafe ? 'retrying' : 'unknown',
                'error' => $exception->getMessage(),
            ]);

            if ($exception->fallbackSafe) {
                throw $exception;
            }

            return;
        }

        $details = $notification->details ?? [];
        if ($result['primary_error'] ?? null) {
            $details['primary_provider_error'] = $result['primary_error'];
        }

        $notification->update([
            'status' => 'sent',
            'provider' => $result['provider'],
            'provider_message_id' => $result['message_id'],
            'details' => $details,
            'sent_at' => now(),
            'error' => null,
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        InventoryWhatsAppNotification::whereKey($this->notificationId)
            ->where('status', '!=', 'sent')
            ->update([
                'status' => 'failed',
                'error' => $exception?->getMessage() ?? 'Delivery failed after all retries.',
            ]);
    }
}
