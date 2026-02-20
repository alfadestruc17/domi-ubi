<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('passenger_auth_user_id')->comment('ID pasajero en Auth Service');
            $table->unsignedBigInteger('driver_auth_user_id')->nullable()->comment('ID conductor en Auth Service');
            $table->string('status', 30)->default('requested');
            $table->decimal('origin_latitude', 10, 8);
            $table->decimal('origin_longitude', 11, 8);
            $table->decimal('destination_latitude', 10, 8);
            $table->decimal('destination_longitude', 11, 8);
            $table->string('origin_address')->nullable();
            $table->string('destination_address')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('passenger_auth_user_id');
            $table->index('driver_auth_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
