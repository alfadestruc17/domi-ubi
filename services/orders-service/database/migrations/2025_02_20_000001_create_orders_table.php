<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('auth_user_id')->comment('Cliente, ID en Auth Service');
            $table->unsignedBigInteger('store_id')->comment('ID de tienda en Catalog Service');
            $table->string('status', 30)->default('pending');
            $table->decimal('delivery_latitude', 10, 8);
            $table->decimal('delivery_longitude', 11, 8);
            $table->string('delivery_address')->nullable();
            $table->unsignedBigInteger('driver_auth_user_id')->nullable()->comment('Repartidor asignado en D4');
            $table->decimal('total', 12, 2)->default(0);
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('ready_for_pickup_at')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['auth_user_id', 'status']);
            $table->index('store_id');
            $table->index('driver_auth_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
