<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recurring_schedule_id')->constrained()->cascadeOnDelete();
            $table->date('holiday_date');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->unique(['recurring_schedule_id', 'holiday_date']);
            $table->index('holiday_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_holidays');
    }
};
