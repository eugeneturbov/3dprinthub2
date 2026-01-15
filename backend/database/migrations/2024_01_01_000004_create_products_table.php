<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('short_description')->nullable();
            $table->enum('type', ['physical', 'digital'])->default('physical');
            $table->decimal('price', 10, 2);
            $table->decimal('compare_price', 10, 2)->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->boolean('track_quantity')->default(true);
            $table->boolean('is_digital_download')->default(false);
            $table->string('digital_file_path')->nullable();
            $table->json('images')->nullable();
            $table->string('3d_model_file')->nullable();
            $table->string('3d_model_format')->nullable(); // glb, gltf, stl, obj
            $table->json('specifications')->nullable(); // material, size, weight, etc.
            $table->json('tags')->nullable();
            $table->enum('status', ['draft', 'active', 'inactive', 'pending'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('rating_count')->default(0);
            $table->integer('sales_count')->default(0);
            $table->integer('views_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
