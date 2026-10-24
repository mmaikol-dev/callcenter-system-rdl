<?php

use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WaredashController;
use App\Http\Controllers\InventoryWhatsAppController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [WaredashController::class, 'index'])->name('dashboard');
    Route::get('/waredash', [WaredashController::class, 'index'])->name('waredash.index');

    Route::resource('products', ProductController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::get('/products/{product}/inventory-logs', [ProductController::class, 'inventoryLogs'])
        ->name('products.inventoryLogs');
    Route::post('/products/{product}/update-quantity', [ProductController::class, 'updateQuantity'])
        ->name('products.updateQuantity');
    Route::post('/products/scan-barcodes', [ProductController::class, 'scanBarcodes'])
        ->name('products.scanBarcodes');
    Route::get('/products/{product}/barcode-history', [ProductController::class, 'getBarcodeHistory'])
        ->name('products.barcodeHistory');

    Route::get('/transfer', [TransferController::class, 'index'])->name('transfers.index');
    Route::post('/transfers', [TransferController::class, 'store'])->name('transfers.store');
    Route::get('/transfers/{productId}/{agentId}', [TransferController::class, 'show'])
        ->name('transfers.show');
    Route::post('/transfers/{productId}/{agentId}/deductions', [TransferController::class, 'storeDeduction'])
        ->name('transfers.deductions.store');
    Route::delete('/deductions/{id}', [TransferController::class, 'destroyDeduction'])
        ->name('deductions.destroy');

    Route::resource('units', UnitController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::resource('categories', CategoryController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::resource('users', UserController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::prefix('whatsapp-alerts')->name('whatsapp-alerts.')->controller(InventoryWhatsAppController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/recipients', 'store')->name('recipients.store');
        Route::put('/recipients/{recipient}', 'update')->name('recipients.update');
        Route::delete('/recipients/{recipient}', 'destroy')->name('recipients.destroy');
        Route::post('/recipients/{recipient}/test', 'test')->name('recipients.test');
        Route::post('/notifications/{notification}/retry', 'retry')->name('notifications.retry');
    });

    Route::resource('barcode', BarcodeController::class)
        ->only(['index', 'destroy']);
    Route::get('/barcodes/print', [BarcodeController::class, 'print'])->name('barcode.print');
});

require __DIR__.'/auth.php';
