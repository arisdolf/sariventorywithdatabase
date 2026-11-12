<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $t) {
            $t->string('sold_by', 10)->default('piece');      // piece | pack | box
            $t->unsignedInteger('pack_qty')->nullable();      // pieces per pack, or items per box
            $t->string('box_contains', 10)->nullable();       // piece | pack (only for boxes)
            $t->boolean('is_homemade')->default(false);
        });

        Schema::create('expenses', function (Blueprint $t) {
            $t->id('expense_id');
            $t->unsignedBigInteger('store_id')->index();
            $t->unsignedBigInteger('user_id')->nullable();
            $t->string('kind', 10);                           // supply | misc
            $t->string('title', 120);
            $t->string('description', 500)->nullable();
            $t->decimal('amount', 12, 2);
            $t->date('spent_on');
            $t->timestamp('created_at')->useCurrent();
            $t->index(['store_id', 'spent_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn(['sold_by', 'pack_qty', 'box_contains', 'is_homemade']));
    }
};