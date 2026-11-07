<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StoreController as S;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TeamController as T;
use App\Http\Controllers\ProfileController as P;
use App\Http\Controllers\AnalyticsController as A;
use App\Http\Controllers\SettingsController as Se;
use App\Http\Controllers\ActivityController as Ac;
// Public: no token needed

Route::post('/forgot-password', [AuthController::class, 'forgot'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'reset'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/rejoin', [AuthController::class, 'rejoin'])->middleware('throttle:10,1');
Route::post('/verify-email', [AuthController::class, 'verify'])->middleware('throttle:10,1');
Route::post('/resend-code', [AuthController::class, 'resend'])->middleware('throttle:5,1');

// Private: needs a logged-in token
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/data', [S::class, 'data']);

    Route::post('/products', [S::class, 'storeProduct']);
    Route::put('/products/{id}', [S::class, 'updateProduct']);
    Route::delete('/products/{id}', [S::class, 'destroyProduct']);
    Route::post('/products/{id}/restore', [S::class, 'restoreProduct']);

    Route::get('/activity', [Ac::class, 'index']);
    Route::get('/notifications', [Se::class, 'feed']);
    Route::put('/settings/notifications', [Se::class, 'notify']);
    Route::put('/settings/orders', [Se::class, 'orders']);

    Route::post('/categories', [S::class, 'storeCategory']);
    Route::put('/categories/{id}', [S::class, 'updateCategory']);
    Route::delete('/categories/{id}', [S::class, 'destroyCategory']);

    Route::post('/stock', [S::class, 'addStock']);
    Route::post('/stock/remove', [S::class, 'removeStock']);

    Route::post('/sales', [S::class, 'sale']);
    Route::get('/sales', [S::class, 'sales']);
    Route::post('/sales/{id}/void', [S::class, 'voidSale']);

    Route::post('/suppliers', [S::class, 'storeSupplier']);
    Route::put('/suppliers/{id}', [S::class, 'updateSupplier']);
    Route::delete('/suppliers/{id}', [S::class, 'destroySupplier']);

    Route::get('/analytics', [A::class, 'index']);

    Route::get('/team', [T::class, 'index']);
    Route::post('/team/code', [T::class, 'newCode']);
    Route::put('/team/{id}', [T::class, 'update']);
    Route::delete('/team/{id}', [T::class, 'destroy']);

    Route::get('/profile', [P::class, 'show']);
    Route::put('/profile', [P::class, 'update']);
    Route::put('/profile/password', [P::class, 'password']);
    Route::put('/store', [P::class, 'renameStore']);
    Route::delete('/account', [P::class, 'destroy']);
});