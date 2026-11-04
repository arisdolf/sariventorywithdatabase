<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
{
    Schema::table('products', function (Blueprint $t) {
        if (!Schema::hasColumn('products', 'cost_price')) {
            $t->decimal('cost_price', 10, 2)->default(0); // capital per item
        }
        if (Schema::hasColumn('products', 'selling_price')) {
            $t->dropColumn('selling_price'); // unit_price already does this job
        }
    });

    Schema::table('order_items', function (Blueprint $t) {
        if (!Schema::hasColumn('order_items', 'unit_cost')) {
            $t->decimal('unit_cost', 10, 2)->default(0); // cost snapshot at time of sale
        }
    });
}

public function down(): void
{
    Schema::table('order_items', function (Blueprint $t) {
        $t->dropColumn('unit_cost');
    });
    Schema::table('products', function (Blueprint $t) {
        $t->dropColumn('cost_price');
    });
}

};
