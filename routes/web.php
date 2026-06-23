<?php

use Illuminate\Support\Facades\Route;
use MinhaCidade\Identity\Http\Controllers\ProfileController;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/perfil/{username}', [ProfileController::class, 'show'])->name('profile.show');


