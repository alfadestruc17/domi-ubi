<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('auth_user_id')->unique()->comment('ID del usuario en Auth Service');
            $table->string('name');
            $table->string('email');
            $table->string('phone', 20)->nullable();
            $table->string('role', 20)->default('customer')->comment('customer | driver');
            $table->timestamps();

            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
