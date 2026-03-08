<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['club_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sports');
    }
};
