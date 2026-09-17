<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Which users have dismissed which award's celebration card. The card is
        // club-wide (every swimmer congratulates the winner once), so the row is
        // per viewer, not per winner.
        Schema::create('swimmer_award_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('award_id')->constrained('swimmer_awards')->cascadeOnDelete();
            $table->foreignId('viewer_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('viewed_at')->useCurrent();

            $table->unique(['award_id', 'viewer_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('swimmer_award_views');
    }
};
