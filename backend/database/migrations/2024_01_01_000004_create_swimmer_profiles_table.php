<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('swimmer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('level')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_phone')->nullable();
            $table->string('guardian_email')->nullable();
            $table->text('medical_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('swimmer_profiles');
    }
};
