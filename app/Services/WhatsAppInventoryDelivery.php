<?php

namespace App\Services;

use App\Exceptions\WhatsAppProviderException;
use App\Models\InventoryWhatsAppNotification;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppInventoryDelivery
{
    /**
     * @return array{provider: string, message_id: ?string}
     */
    public function send(InventoryWhatsAppNotification $notification): array
    {
        $metaConfigured = $this->metaConfigured();
        $primaryError = $metaConfigured ? null : 'Meta is not configured.';

        if ($metaConfigured) {
            try {
                return $this->sendViaMeta($notification);
            } catch (WhatsAppProviderException $exception) {
                if (! $exception->fallbackSafe) {
                    throw $exception;
                }

                $primaryError = $exception->getMessage();
                Log::warning('Meta WhatsApp delivery failed; trying OpenWA fallback.', [
                    'notification_id' => $notification->id,
                    'reason' => $primaryError,
                ]);
            }
        }

        try {
            $result = $this->sendViaOpenWa($notification);
        } catch (WhatsAppProviderException $exception) {
            if ($primaryError === null) {
                throw $exception;
            }

            throw new WhatsAppProviderException(
                "Meta failed ({$primaryError}); OpenWA failed ({$exception->getMessage()}).",
                $exception->fallbackSafe,
            );
        }

        $result['primary_error'] = $primaryError;

        return $result;
    }

    private function sendViaMeta(InventoryWhatsAppNotification $notification): array
    {
        $token = config('services.whatsapp.meta.access_token');
        $phoneNumberId = config('services.whatsapp.meta.phone_number_id');
        $version = config('services.whatsapp.meta.api_version');

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout(15)
                ->post("https://graph.facebook.com/{$version}/{$phoneNumberId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to' => preg_replace('/\D/', '', $notification->recipient),
                    'type' => 'template',
                    'template' => [
                        'name' => config('services.whatsapp.meta.template_name'),
                        'language' => ['code' => config('services.whatsapp.meta.template_language')],
                        'components' => [[
                            'type' => 'body',
                            'parameters' => [[
                                'type' => 'text',
                                'text' => $notification->message,
                            ]],
                        ]],
                    ],
                ]);
        } catch (ConnectionException $exception) {
            throw new WhatsAppProviderException(
                'Meta delivery outcome is unknown because its API could not be reached.',
                false,
            );
        }

        if (! $response->successful()) {
            $status = $response->status();
            throw new WhatsAppProviderException(
                "Meta rejected the message (HTTP {$status}).",
                $status < 500 && $status !== 429,
            );
        }

        return [
            'provider' => 'meta',
            'message_id' => $response->json('messages.0.id'),
        ];
    }

    private function sendViaOpenWa(InventoryWhatsAppNotification $notification): array
    {
        $baseUrl = rtrim((string) config('services.whatsapp.openwa.base_url'), '/');
        $session = config('services.whatsapp.openwa.session');
        $apiKey = config('services.whatsapp.openwa.api_key');

        if ($baseUrl === '' || ! $session || ! $apiKey) {
            throw new WhatsAppProviderException(
                'OpenWA fallback is not configured. Set OPENWA_BASE_URL, OPENWA_SESSION and OPENWA_API_KEY.',
            );
        }

        $chatId = preg_replace('/\D/', '', $notification->recipient).'@c.us';

        try {
            $response = Http::withHeaders(['X-API-Key' => $apiKey])
                ->acceptJson()
                ->timeout(15)
                ->post(
                    "{$baseUrl}/api/sessions/".rawurlencode((string) $session).'/messages/send-text',
                    [
                        'chatId' => $chatId,
                        'text' => $notification->message,
                    ],
                );
        } catch (ConnectionException $exception) {
            throw new WhatsAppProviderException(
                'OpenWA delivery outcome is unknown because its API could not be reached.',
                false,
            );
        }

        if (! $response->successful()) {
            $status = $response->status();
            throw new WhatsAppProviderException(
                "OpenWA rejected the message (HTTP {$status}).",
                $status < 500 && $status !== 429,
            );
        }

        return [
            'provider' => 'openwa',
            'message_id' => $response->json('messageId'),
        ];
    }

    public function metaConfigured(): bool
    {
        return (bool) (
            config('services.whatsapp.meta.access_token')
            && config('services.whatsapp.meta.phone_number_id')
            && config('services.whatsapp.meta.template_name')
        );
    }

    public function openWaConfigured(): bool
    {
        return (bool) (
            config('services.whatsapp.openwa.base_url')
            && config('services.whatsapp.openwa.session')
            && config('services.whatsapp.openwa.api_key')
        );
    }
}
