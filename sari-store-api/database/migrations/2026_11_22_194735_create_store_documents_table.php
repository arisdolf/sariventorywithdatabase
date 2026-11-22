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
        Schema::create('store_documents', function (Blueprint $table) {
            $table->id('document_id');
            $table->unsignedInteger('store_id');
            $table->string('document_type', 40);
            $table->string('file_path', 255);
            $table->string('original_name', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->timestamps();
            $table->unique(['store_id', 'document_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('store_documents')->exists()) {
            throw new RuntimeException('Export submitted store documents before rolling back this migration.');
        }

        Schema::dropIfExists('store_documents');
    }
};
