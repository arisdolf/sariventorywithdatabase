<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_batches', function (Blueprint $t) {
            $t->id('batch_id');
            $t->unsignedBigInteger('store_id')->index();
            $t->unsignedBigInteger('product_id')->index();
            $t->unsignedBigInteger('user_id')->nullable();
            $t->string('batch_code', 60)->nullable();      // batch / barcode number
            $t->string('pack_type', 5)->default('piece');   // piece | box
            $t->unsignedInteger('pieces_per_box')->nullable();
            $t->unsignedInteger('boxes')->nullable();
            $t->unsignedInteger('qty_received');            // always in pieces
            $t->unsignedInteger('qty_remaining');           // always in pieces
            $t->date('expiry_date')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->unique(['product_id', 'batch_code']);       // NULL codes are allowed many times
        });

        // Existing stock becomes one batch per product, so totals still match
        DB::table('products')->where('stock_quantity', '>', 0)
            ->get(['product_id', 'store_id', 'stock_quantity'])
            ->chunk(500)
            ->each(fn($chunk) => DB::table('stock_batches')->insert($chunk->map(fn($p) => [
                'store_id' => $p->store_id, 'product_id' => $p->product_id, 'pack_type' => 'piece',
                'qty_received' => $p->stock_quantity, 'qty_remaining' => $p->stock_quantity, 'created_at' => now(),
            ])->all()));
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};