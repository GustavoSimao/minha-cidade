<?php

declare(strict_types=1);

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
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('full_name');
            $table->text('bio')->nullable();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('supported_causes')->nullable();
            $table->string('events_created')->nullable();
            $table->string('events_participating')->nullable();
            $table->string('events_participated')->nullable();
            $table->string('profile_picture')->nullable();
            $table->string('social_links')->nullable();
            $table->string('role')->nullable();
            $table->string('cover_image')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });
    }
};
