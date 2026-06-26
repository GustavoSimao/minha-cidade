<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use MinhaCidade\Identity\Http\Controllers\ProfileController;

Route::get('/perfil/{username}', [ProfileController::class, 'show'])->name('profile.show');

