<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $t) {
            $t->string('code', 50)->nullable()->after('name');
            $t->decimal('size_value', 10, 2)->nullable();
            $t->string('size_unit', 5)->nullable();      // 'g' or 'ml'
            $t->unique(['store_id', 'code']);            // same code can't repeat inside one store
        });
        Schema::table('users', function (Blueprint $t) {
            $t->string('status', 12)->default('active'); // active | suspended
            $t->unsignedBigInteger('pending_store_id')->nullable(); // waiting for owner approval
        });
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn(['code', 'size_value', 'size_unit']));
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['status', 'pending_store_id']));
    }
};