<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Each award is a discrete event. Several swimmers can hold the same title
        // in the same period, so this is a log, not a single "current holder" slot.
        Schema::create('swimmer_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->foreignId('swimmer_id')->constrained('swimmer_profiles')->cascadeOnDelete();
            $table->string('award_type', 10); // day | week | month
            // Snapshot of the setting at award time: editing point values later
            // must never rewrite historical awards.
            $table->unsignedInteger('xp_value');
            $table->foreignId('awarded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['club_id', 'swimmer_id']);
            $table->index(['club_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('swimmer_awards');
    }
};
