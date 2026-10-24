<?php

namespace Tests\Unit;

use App\Exceptions\WhatsAppProviderException;
use App\Models\InventoryWhatsAppNotification;
use App\Models\InventoryWhatsAppRecipient;
use App\Services\WhatsAppInventoryDelivery;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsAppInventoryDeliveryTest extends TestCase
{
    public function test_inventory_models_use_the_migrated_table_names(): void
    {
        $this->assertSame('inventory_whatsapp_recipients', (new InventoryWhatsAppRecipient)->getTable());
        $this->assertSame('inventory_whatsapp_notifications', (new InventoryWhatsAppNotification)->getTable());
    }

    public function test_meta_is_used_as_the_primary_provider(): void
    {
        config([
            'services.whatsapp.meta.access_token' => 'test-meta-token',
            'services.whatsapp.meta.phone_number_id' => 'test-phone-id',
            'services.whatsapp.meta.api_version' => 'v22.0',
            'services.whatsapp.meta.template_name' => 'inventory_stock_alert',
            'services.whatsapp.meta.template_language' => 'en',
            'services.whatsapp.openwa.base_url' => 'http://localhost:2785',
            'services.whatsapp.openwa.session' => 'test-session',
            'services.whatsapp.openwa.api_key' => 'test-openwa-key',
        ]);

        Http::fake([
            'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'meta-message-id']]], 200),
        ]);

        $result = app(WhatsAppInventoryDelivery::class)->send($this->notification());

        $this->assertSame('meta', $result['provider']);
        $this->assertSame('meta-message-id', $result['message_id']);
        Http::assertSent(fn (Request $request) => str_contains($request->url(), 'graph.facebook.com')
            && $request->hasHeader('Authorization', 'Bearer test-meta-token')
            && $request['template']['name'] === 'inventory_stock_alert');
        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'localhost:2785'));
    }

    public function test_openwa_is_used_when_meta_definitively_rejects_the_message(): void
    {
        config([
            'services.whatsapp.meta.access_token' => 'test-meta-token',
            'services.whatsapp.meta.phone_number_id' => 'test-phone-id',
            'services.whatsapp.meta.api_version' => 'v22.0',
            'services.whatsapp.meta.template_name' => 'inventory_stock_alert',
            'services.whatsapp.meta.template_language' => 'en',
            'services.whatsapp.openwa.base_url' => 'http://localhost:2785',
            'services.whatsapp.openwa.session' => 'test-session',
            'services.whatsapp.openwa.api_key' => 'test-openwa-key',
        ]);

        Http::fake(function (Request $request) {
            if (str_contains($request->url(), 'graph.facebook.com')) {
                return Http::response(['error' => ['message' => 'Template rejected']], 400);
            }

            return Http::response([
                'messageId' => 'openwa-message-id',
                'timestamp' => 1706868000,
            ], 201);
        });

        $result = app(WhatsAppInventoryDelivery::class)->send($this->notification());

        $this->assertSame('openwa', $result['provider']);
        $this->assertSame('openwa-message-id', $result['message_id']);
        $this->assertStringContainsString('HTTP 400', $result['primary_error']);
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/sessions/test-session/messages/send-text')
            && $request->hasHeader('X-API-Key', 'test-openwa-key')
            && $request['chatId'] === '254700000000@c.us'
            && $request['text'] === 'Stock test message');
    }

    public function test_unknown_meta_delivery_outcome_does_not_fall_back_to_openwa(): void
    {
        config([
            'services.whatsapp.meta.access_token' => 'test-meta-token',
            'services.whatsapp.meta.phone_number_id' => 'test-phone-id',
            'services.whatsapp.meta.template_name' => 'inventory_stock_alert',
            'services.whatsapp.openwa.base_url' => 'http://localhost:2785',
            'services.whatsapp.openwa.session' => 'test-session',
            'services.whatsapp.openwa.api_key' => 'test-openwa-key',
        ]);

        Http::fake(function (Request $request) {
            if (str_contains($request->url(), 'graph.facebook.com')) {
                throw new \Illuminate\Http\Client\ConnectionException('Network timeout');
            }

            return Http::response(['messageId' => 'should-not-be-sent'], 201);
        });

        try {
            app(WhatsAppInventoryDelivery::class)->send($this->notification());
            $this->fail('Expected an unknown-delivery exception.');
        } catch (WhatsAppProviderException $exception) {
            $this->assertFalse($exception->fallbackSafe);
        }

        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'localhost:2785'));
    }

    private function notification(): InventoryWhatsAppNotification
    {
        return new InventoryWhatsAppNotification([
            'recipient' => '+254700000000',
            'message' => 'Stock test message',
        ]);
    }
}
