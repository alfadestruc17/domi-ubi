<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('auth_user_id')->unique()->comment('ID en Auth Service');
            $table->boolean('is_available')->default(false);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamp('last_location_at')->nullable();
            $table->timestamps();

            $table->index(['is_available', 'last_location_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
