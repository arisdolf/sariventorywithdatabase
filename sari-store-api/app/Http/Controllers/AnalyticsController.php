<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $r)
    {
        $u = $r->user();
        abort_unless($u->hasPerm('analytics'), 403, 'Only the owner and managers can see analytics');
        $sid = $u->store_id;
        abort_unless($sid, 403, 'This account is not part of a store');

        // Quick ranges send unit + n. Custom ranges send from + to (YYYY-MM-DD, both days included).
        $v = $r->validate([
            'group' => 'required|in:daily,weekly,monthly,yearly',
            'from'  => 'required_with:to|nullable|date_format:Y-m-d',
            'to'    => 'required_with:from|nullable|date_format:Y-m-d',
            'unit'  => 'required_without:from|nullable|in:months,years',
            'n'     => 'required_without:from|nullable|integer|in:1,2,3,4,5,6,7,8,9,10,12',
        ]);

        // "Account age" = when the store owner signed up (falls back to the first sale)
        $ownerId = DB::table('stores')->where('store_id', $sid)->value('owner_id');
        $since = DB::table('users')->where('user_id', $ownerId)->value('created_at')
            ?? DB::table('orders')->where('store_id', $sid)->min('order_date')
            ?? now();
        $start = Carbon::parse($since)->startOfDay();
        $now = now();

        $meta = [
            'age_days'   => (int) floor($start->diffInDays($now)),
            'age_months' => (int) floor($start->diffInMonths($now)),
            'age_years'  => (int) floor($start->diffInYears($now)),
        ];

        $g = $v['group'];

        if (!empty($v['from'])) {
            /* ---------- Custom range ---------- */
            $reqFrom = Carbon::parse($v['from'])->startOfDay();
            $reqTo = Carbon::parse($v['to'])->endOfDay();
            abort_if($reqFrom->gt($reqTo), 422, 'The start date must be before the end date');

            // Size of the range the person asked for, in months
            $span = (int) floor($reqFrom->diffInMonths($reqTo)) + 1;
            abort_if($span > 60, 422, 'Please pick a range of 5 years or less');
            abort_unless(match ($g) {
                'daily'   => $span <= 3,
                'weekly'  => $span <= 12,
                'monthly' => $span >= 2,
                'yearly'  => $span >= 24,
            }, 422, 'That grouping does not fit the date range');

            // Do not show time before the store existed or time that has not happened yet
            $from = $reqFrom->lt($start) ? $start->copy() : $reqFrom->copy();
            $end = $reqTo->gt($now) ? $now->copy() : $reqTo->copy();
        } else {
            /* ---------- Quick range (unchanged) ---------- */
            $n = (int) $v['n'];
            $limit = $v['unit'] === 'years' ? $meta['age_years'] : max(1, $meta['age_months']);
            abort_if($n > $limit, 422, 'Your store is not old enough for that range yet');

            $from = ($v['unit'] === 'years' ? $now->copy()->subYearsNoOverflow($n) : $now->copy()->subMonthsNoOverflow($n))->startOfDay();
            if ($from->lt($start)) $from = $start->copy();
            $end = $now->copy();
        }

        $canCost = $u->hasPerm('costs');

        $rows = DB::select("SELECT o.order_date d, o.total_amount total,
                (SELECT COALESCE(SUM(oi.unit_cost * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.order_id) cost
            FROM orders o
            WHERE o.store_id = ? AND o.status = 'completed' AND o.order_date >= ? AND o.order_date <= ?",
            [$sid, $from, $end]);

        $key = fn(Carbon $d) => match ($g) {
            'daily'   => $d->format('Y-m-d'),
            'weekly'  => $d->copy()->startOfWeek()->format('Y-m-d'),
            'monthly' => $d->format('Y-m'),
            'yearly'  => $d->format('Y'),
        };
        $label = fn(Carbon $d) => match ($g) {
            'daily'   => $d->format('M j'),
            'weekly'  => 'Wk ' . $d->copy()->startOfWeek()->format('M j'),
            'monthly' => $d->format('M Y'),
            'yearly'  => $d->format('Y'),
        };

        // Pre-fill every bucket so days/weeks with no sales still show as empty bars
        $buckets = [];
        $cur = match ($g) {
            'daily'   => $from->copy(),
            'weekly'  => $from->copy()->startOfWeek(),
            'monthly' => $from->copy()->startOfMonth(),
            'yearly'  => $from->copy()->startOfYear(),
        };
        while ($cur->lte($end)) {
            $buckets[$key($cur)] = ['key' => $key($cur), 'label' => $label($cur), 'sales' => 0.0, 'orders' => 0, 'profit' => 0.0];
            match ($g) {
                'daily'   => $cur->addDay(),
                'weekly'  => $cur->addWeek(),
                'monthly' => $cur->addMonthNoOverflow(),
                'yearly'  => $cur->addYear(),
            };
        }

        foreach ($rows as $o) {
            $k = $key(Carbon::parse($o->d));
            if (!isset($buckets[$k])) continue;
            $buckets[$k]['sales']  += (float) $o->total;
            $buckets[$k]['orders'] += 1;
            $buckets[$k]['profit'] += (float) $o->total - (float) $o->cost;
        }

        $series = array_values($buckets);
        $totals = [
            'sales'  => array_sum(array_column($series, 'sales')),
            'orders' => array_sum(array_column($series, 'orders')),
            'profit' => $canCost ? array_sum(array_column($series, 'profit')) : null,
        ];
        if (!$canCost) foreach ($series as &$s) unset($s['profit']);

        return compact('meta', 'series', 'totals');
    }
}