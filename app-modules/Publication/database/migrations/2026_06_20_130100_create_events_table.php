<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publication_id')->constrained()->onDelete('cascade');
            $table->dateTime('data_inicio');
            $table->dateTime('data_fim')->nullable();
            $table->string('local')->nullable();
            $table->string('tipo');
            $table->string('link_externo')->nullable();
            $table->integer('limite_participantes')->nullable();
            $table->decimal('preco', 10, 2)->nullable();
            $table->timestamps();
        });
    }
};
