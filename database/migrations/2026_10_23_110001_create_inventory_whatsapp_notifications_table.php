<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_whatsapp_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('event_key')->unique();
            $table->string('event_type', 40);
            $table->unsignedBigInteger('product_id')->nullable()->index();
            $table->string('recipient', 16);
            $table->text('message');
            $table->string('status', 24)->default('queued')->index();
            $table->string('provider', 24)->nullable();
            $table->string('provider_message_id')->nullable();
            $table->text('error')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->json('details')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->unique(['event_key', 'recipient']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_whatsapp_notifications');
    }
};
