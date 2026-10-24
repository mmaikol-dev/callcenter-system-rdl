<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_whatsapp_recipients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('phone', 16)->unique();
            $table->json('events');
            $table->boolean('enabled')->default(true);
            $table->timestamp('opted_in_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_whatsapp_recipients');
    }
};
