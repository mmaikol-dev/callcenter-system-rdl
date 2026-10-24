<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryWhatsAppNotification extends Model
{
    protected $table = 'inventory_whatsapp_notifications';

    protected $fillable = [
        'event_key',
        'event_type',
        'product_id',
        'recipient',
        'message',
        'status',
        'provider',
        'provider_message_id',
        'error',
        'attempts',
        'details',
        'sent_at',
    ];

    protected $casts = [
        'details' => 'array',
        'sent_at' => 'datetime',
    ];
}
