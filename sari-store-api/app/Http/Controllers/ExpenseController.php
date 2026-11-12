<?php

namespace App\Http\Controllers;

use App\Support\Activity;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    private function sid(Request $r): int
    {
        abort_unless($r->user()->hasPerm('costs'), 403, 'Only the owner and managers can manage expenses');
        $sid = $r->user()->store_id;
        abort_unless($sid, 403, 'This account is not part of a store');
        return $sid;
    }

    private function rules(): array
    {
        return [
            'kind' => 'required|in:supply,misc',
            'title' => 'required|string|max:120',
            'description' => 'nullable|string|max:500',
            'amount' => 'required|numeric|min:0.01|max:9999999',
            'spent_on' => 'required|date_format:Y-m-d',
        ];
    }

    private function m($n): string
    {
        return '₱' . number_format((float) $n, 2);
    }

    // Gross profit of completed sales minus expenses, for any date range
    public static function summary(int $sid, Carbon $from, Carbon $to): array
    {
        $gross = (float) DB::selectOne("SELECT COALESCE(SUM(oi.subtotal - oi.unit_cost * oi.quantity), 0) g
            FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
            WHERE o.store_id = ? AND o.status = 'completed' AND o.order_date BETWEEN ? AND ?",
            [$sid, $from, $to])->g;

        $rows = DB::table('expenses')->where('store_id', $sid)
            ->whereBetween('spent_on', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('kind, SUM(amount) t')->groupBy('kind')->pluck('t', 'kind');
        $supplies = (float) ($rows['supply'] ?? 0);
        $misc = (float) ($rows['misc'] ?? 0);

        return ['gross' => $gross, 'supplies' => $supplies, 'misc' => $misc,
                'expenses' => $supplies + $misc, 'net' => $gross - $supplies - $misc];
    }

    public function index(Request $r)
    {
        $sid = $this->sid($r);
        $month = preg_match('/^\d{4}-\d{2}$/', (string) $r->query('month')) ? $r->query('month') : now()->format('Y-m');
        $from = Carbon::parse($month . '-01')->startOfMonth();
        $to = $from->copy()->endOfMonth();

        $items = DB::select("SELECT e.expense_id id, e.kind, e.title, e.description, CAST(e.amount AS DOUBLE) amount,
                DATE_FORMAT(e.spent_on,'%Y-%m-%d') spent_on, COALESCE(u.name,'') who
            FROM expenses e LEFT JOIN users u ON u.user_id = e.user_id
            WHERE e.store_id = ? AND e.spent_on BETWEEN ? AND ?
            ORDER BY e.spent_on DESC, e.expense_id DESC", [$sid, $from->toDateString(), $to->toDateString()]);

        return ['items' => $items, 'totals' => self::summary($sid, $from, $to)];
    }

    public function store(Request $r)
    {
        $sid = $this->sid($r);
        $v = $r->validate($this->rules());
        DB::table('expenses')->insert([
            'store_id' => $sid, 'user_id' => $r->user()->getKey(), 'kind' => $v['kind'],
            'title' => trim($v['title']), 'description' => $v['description'] ?? null,
            'amount' => $v['amount'], 'spent_on' => $v['spent_on'],
        ]);
        Activity::log($sid, 'expense', ($v['kind'] === 'misc' ? 'Added misc fee ' : 'Added expense ') . trim($v['title']) . ' (' . $this->m($v['amount']) . ')');
        return ['ok' => true];
    }

    public function update(Request $r, $id)
    {
        $sid = $this->sid($r);
        $v = $r->validate($this->rules());
        $q = DB::table('expenses')->where('expense_id', $id)->where('store_id', $sid);
        abort_unless((clone $q)->exists(), 404, 'Expense not found');
        $q->update([
            'kind' => $v['kind'], 'title' => trim($v['title']), 'description' => $v['description'] ?? null,
            'amount' => $v['amount'], 'spent_on' => $v['spent_on'],
        ]);
        Activity::log($sid, 'expense', 'Edited expense ' . trim($v['title']) . ' (' . $this->m($v['amount']) . ')');
        return ['ok' => true];
    }

    public function destroy(Request $r, $id)
    {
        $sid = $this->sid($r);
        $q = DB::table('expenses')->where('expense_id', $id)->where('store_id', $sid);
        $title = (clone $q)->value('title');
        abort_unless($title, 404, 'Expense not found');
        $q->delete();
        Activity::log($sid, 'expense', "Deleted expense $title");
        return ['ok' => true];
    }
}