<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('club_id')->nullable();
            $table->string('type');           // e.g. registration.approved, session.reminder
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();  // extra payload (route, ids, etc.)
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('club_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
