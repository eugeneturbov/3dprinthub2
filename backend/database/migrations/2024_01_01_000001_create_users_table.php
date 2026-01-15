<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->text('bio')->nullable();
            $table->string('avatar')->nullable();
            $table->enum('role', ['buyer', 'seller', 'admin'])->default('buyer');
            $table->boolean('is_active')->default(true);
            $table->boolean('email_verified')->default(false);
            $table->string('vk_id')->nullable();
            $table->string('yandex_id')->nullable();
            $table->decimal('balance', 10, 2)->default(0);
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
