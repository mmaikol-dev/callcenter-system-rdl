<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryWhatsAppRecipient extends Model
{
    protected $table = 'inventory_whatsapp_recipients';

    protected $fillable = [
        'name',
        'phone',
        'events',
        'enabled',
        'opted_in_at',
    ];

    protected $casts = [
        'events' => 'array',
        'enabled' => 'boolean',
        'opted_in_at' => 'datetime',
    ];
}
