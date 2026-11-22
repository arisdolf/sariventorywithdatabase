<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('box_contains', 10)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $contains = DB::table('products')->whereNotNull('box_contains')->distinct()->pluck('box_contains');
        if ($contains->contains(fn ($value) => ! is_numeric($value))) {
            throw new RuntimeException('Cannot roll back box_contains while product rows use piece or pack values.');
        }

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('box_contains', 10, 2)->nullable()->change();
        });
    }
};
