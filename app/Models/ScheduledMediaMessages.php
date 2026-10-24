<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduledMediaMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'message',
        'images',
        'send_at',
    ];

    protected $casts = [
        'images' => 'array',
        'send_at' => 'datetime',
    ];
}
