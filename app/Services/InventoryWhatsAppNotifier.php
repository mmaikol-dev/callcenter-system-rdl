<?php

namespace App\Services;

use App\Jobs\SendInventoryWhatsAppNotification;
use App\Models\InventoryWhatsAppNotification;
use App\Models\InventoryWhatsAppRecipient;
use App\Models\Product;
use App\Models\User;

class InventoryWhatsAppNotifier
{
    public const EVENT_TYPES = [
        'stock_change',
        'near_depletion',
        'depleted',
        'recovery',
    ];

    public function notifyStockChange(
        Product $product,
        int $previousQuantity,
        int $newQuantity,
        User $actor,
        ?string $reason,
        string $eventKey,
    ): void {
        $events = [[
            'type' => 'stock_change',
            'title' => 'Stock updated',
        ]];

        if ($previousQuantity > 0 && $newQuantity <= 0) {
            $events[] = ['type' => 'depleted', 'title' => 'Product depleted'];
        } elseif (
            $newQuantity > 0
            && (
                $previousQuantity > (int) $product->quantity_alert
                || $previousQuantity <= 0
            )
            && $newQuantity <= (int) $product->quantity_alert
        ) {
            $events[] = ['type' => 'near_depletion', 'title' => 'Low stock alert'];
        } elseif (
            $previousQuantity <= (int) $product->quantity_alert
            && $newQuantity > (int) $product->quantity_alert
        ) {
            $events[] = ['type' => 'recovery', 'title' => 'Stock replenished'];
        }

        foreach ($events as $event) {
            $message = $this->message($event['title'], $product, $previousQuantity, $newQuantity, $actor, $reason);
            $recipients = InventoryWhatsAppRecipient::query()
                ->where('enabled', true)
                ->whereJsonContains('events', $event['type'])
                ->get();

            foreach ($recipients as $recipient) {
                $notification = InventoryWhatsAppNotification::firstOrCreate(
                    ['event_key' => "{$eventKey}:{$event['type']}:{$recipient->phone}"],
                    [
                        'event_type' => $event['type'],
                        'product_id' => $product->id,
                        'recipient' => $recipient->phone,
                        'message' => $message,
                        'status' => 'queued',
                        'details' => [
                            'product_name' => $product->name,
                            'product_code' => $product->code,
                            'previous_quantity' => $previousQuantity,
                            'new_quantity' => $newQuantity,
                            'actor' => $actor->name,
                            'reason' => $reason,
                        ],
                    ],
                );

                if ($notification->wasRecentlyCreated) {
                    SendInventoryWhatsAppNotification::dispatch($notification->id)->afterCommit();
                }
            }
        }
    }

    public function queueTest(InventoryWhatsAppRecipient $recipient, User $actor): InventoryWhatsAppNotification
    {
        $notification = InventoryWhatsAppNotification::create([
            'event_key' => 'test:'.$recipient->id.':'.now()->timestamp.':'.str()->random(10),
            'event_type' => 'test',
            'recipient' => $recipient->phone,
            'message' => 'AquaVita inventory alerts are connected. This is a test message requested by '.$actor->name.'.',
            'status' => 'queued',
            'details' => ['actor' => $actor->name],
        ]);

        SendInventoryWhatsAppNotification::dispatch($notification->id)->afterCommit();

        return $notification;
    }

    private function message(
        string $title,
        Product $product,
        int $previousQuantity,
        int $newQuantity,
        User $actor,
        ?string $reason,
    ): string {
        $change = $newQuantity - $previousQuantity;
        $message = [
            "AquaVita inventory: {$title}",
            "Product: {$product->name} ({$product->code})",
            'Stock: '.$previousQuantity.' → '.$newQuantity.' ('.($change > 0 ? '+' : '').$change.')',
            "Updated by: {$actor->name}",
        ];

        if ($reason) {
            $message[] = "Reason: {$reason}";
        }

        $message[] = 'At: '.now()->format('Y-m-d H:i');

        return implode("\n", $message);
    }
}
