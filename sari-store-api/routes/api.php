<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StoreController as S;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TeamController as T;
use App\Http\Controllers\ProfileController as P;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/data', [S::class, 'data']);
    Route::post('/products', [S::class, 'storeProduct']);
    Route::put('/products/{id}', [S::class, 'updateProduct']);
    Route::delete('/products/{id}', [S::class, 'destroyProduct']);
    Route::post('/stock', [S::class, 'addStock']);
    Route::post('/sales', [S::class, 'sale']);
    Route::get('/sales', [S::class, 'sales']);
    Route::post('/sales/{id}/void', [S::class, 'voidSale']);
    Route::post('/suppliers', [S::class, 'storeSupplier']);
    Route::delete('/suppliers/{id}', [S::class, 'destroySupplier']);

    Route::get('/team', [T::class, 'index']);
    Route::post('/team/code', [T::class, 'newCode']);
    Route::put('/team/{id}', [T::class, 'update']);
    Route::delete('/team/{id}', [T::class, 'destroy']);

    Route::get('/profile', [P::class, 'show']);
    Route::put('/profile', [P::class, 'update']);
    Route::put('/profile/password', [P::class, 'password']);
    Route::put('/store', [P::class, 'renameStore']);
});