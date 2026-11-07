<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class Activity
{
    // Filter and notification groups
    const GROUPS = [
        'sales'   => ['sale', 'void'],
        'stock'   => ['stock', 'lowstock'],
        'catalog' => ['product', 'supplier', 'category'],
        'team'    => ['team', 'settings'],
    ];

    public static function log($sid, string $action, string $summary, $uid = null): void
    {
        DB::table('activity_log')->insert([
            'store_id' => $sid,
            'user_id' => $uid ?? request()->user()?->getKey(),
            'action' => $action,
            'summary' => mb_substr($summary, 0, 250),
            'created_at' => now(),
        ]);
    }
}