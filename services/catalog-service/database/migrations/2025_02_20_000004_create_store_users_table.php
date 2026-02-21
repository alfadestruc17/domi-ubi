<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Asociación usuario (Auth) ↔ tienda. Un usuario con rol 'store' puede tener una tienda asignada.
     */
    public function up(): void
    {
        Schema::create('store_users', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('auth_user_id')->unique()->comment('ID del usuario en Auth Service');
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_users');
    }
};
