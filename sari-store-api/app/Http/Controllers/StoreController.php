<?php

namespace App\Http\Controllers;

use App\Support\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StoreController extends Controller
{
    private function need(Request $r, string $perm): int
    {
        abort_unless($r->user()->hasPerm($perm), 403, 'You do not have permission to do that');
        return $this->sid($r);
    }

    private function sid(Request $r): int
    {
        $sid = $r->user()->store_id;
        abort_unless($sid, 403, 'This account is not part of a store');
        return $sid;
    }

    private function m($n): string
    {
        return '₱' . number_format((float) $n, 2);
    }

    private function log($sid, $pid, $type, $qty, $remarks, $refId = null, $refType = null)
    {
        DB::table('stock_movements')->insert([
            'store_id' => $sid, 'user_id' => request()->user()?->getKey(),
            'product_id' => $pid, 'type' => $type, 'quantity' => $qty,
            'remarks' => $remarks, 'reference_id' => $refId, 'reference_type' => $refType,
        ]);
    }

    private function catId($name, $sid)
    {
        $name = trim((string) $name);
        if ($name === '') return null;
        $id = DB::table('categories')->where('store_id', $sid)->where('name', $name)->value('category_id');
        return $id ?: DB::table('categories')->insertGetId(['store_id' => $sid, 'name' => $name]);
    }

    private function extras(array $v, int $sid, $ignoreId = null): array
{
    $code = trim((string) ($v['code'] ?? '')) ?: null;
    if ($code) {
        $q = DB::table('products')->where('store_id', $sid)->where('code', $code);
        if ($ignoreId) $q->where('product_id', '!=', $ignoreId);
        abort_if($q->exists(), 422, 'Another product already uses that code');
    }
    $size = $v['size_value'] ?? null;
    $unit = $size ? ($v['size_unit'] ?? null) : null;
    return [$code, $unit ? $size : null, $unit];
}

    // The mode is part of the key, so switching modes starts a fresh count
    private function periodKey(string $mode, Carbon $d): string
    {
        return match ($mode) {
            'weekly'  => 'w:' . $d->format('o-\WW'),
            'monthly' => 'm:' . $d->format('Y-m'),
            'never'   => 'n:all',
            default   => 'd:' . $d->format('Y-m-d'),
        };
    }

    // Takes pieces out of the batches that expire first (no expiry goes last)
private function deduct(int $sid, int $pid, int $qty): void
{
    $left = $qty;
    $rows = DB::table('stock_batches')->where('store_id', $sid)->where('product_id', $pid)
        ->where('qty_remaining', '>', 0)
        ->orderByRaw('expiry_date IS NULL')->orderBy('expiry_date')->orderBy('batch_id')
        ->lockForUpdate()->get();
    foreach ($rows as $b) {
        if ($left <= 0) break;
        $take = min($left, $b->qty_remaining);
        DB::table('stock_batches')->where('batch_id', $b->batch_id)->decrement('qty_remaining', $take);
        $left -= $take;
    }
}

// Used when a sale is voided: puts pieces back into the newest batch
private function restore(int $sid, int $pid, int $qty): void
{
    $b = DB::table('stock_batches')->where('store_id', $sid)->where('product_id', $pid)->orderByDesc('batch_id')->first();
    if ($b) {
        DB::table('stock_batches')->where('batch_id', $b->batch_id)->increment('qty_remaining', $qty);
    } else {
        DB::table('stock_batches')->insert([
            'store_id' => $sid, 'product_id' => $pid, 'pack_type' => 'piece',
            'qty_received' => $qty, 'qty_remaining' => $qty, 'created_at' => now(),
        ]);
    }
}

    public function data(Request $r)
    {
        $u = $r->user();
        $sid = $this->sid($r);

        $products = DB::select("SELECT p.product_id id, p.name, p.description, p.low_stock, p.code,
    p.sold_by, p.pack_qty, p.box_contains, p.is_homemade, p.is_repacked,
    CAST(p.size_value AS DOUBLE) size_value, p.size_unit, COALESCE(c.name,'') cat,
    CAST(p.cost_price AS DOUBLE) cost_price, CAST(p.unit_price AS DOUBLE) price, p.stock_quantity qty
FROM products p LEFT JOIN categories c ON c.category_id = p.category_id
WHERE p.is_active = 1 AND p.store_id = ? ORDER BY p.name", [$sid]);

        
        $today = DB::selectOne("SELECT
                CAST(COALESCE(SUM(oi.subtotal), 0) AS DOUBLE) sales,
                CAST(COALESCE(SUM(oi.unit_cost * oi.quantity), 0) AS DOUBLE) cost,
                CAST(COALESCE(SUM(oi.quantity), 0) AS SIGNED) items,
                COUNT(DISTINCT o.order_id) orders
            FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
            WHERE o.store_id = ? AND o.status = 'completed' AND DATE(o.order_date) = CURDATE()", [$sid]);

        if (!$u->hasPerm('costs')) {
            foreach ($products as $p) unset($p->cost_price);
            $today->cost = null;
        }
         if (!$u->hasPerm('revenue')) {
            $today->sales = null; $today->items = null; $today->orders = null; $today->cost = null;
        }

        return [
            'me' => $u->toClient(),
            'products' => $products,
            'categories' => DB::select("SELECT category_id id, name FROM categories WHERE store_id = ? ORDER BY name", [$sid]),
            'suppliers' => DB::select("SELECT supplier_id id, name, contact_person contact, phone, email, address
                FROM suppliers WHERE store_id = ? ORDER BY name", [$sid]),
            'orders' => $u->hasPerm('revenue') ? DB::select("SELECT order_id id, order_no no, CAST(total_amount AS DOUBLE) total, DATE_FORMAT(order_date,'%Y-%m-%dT%H:%i:%s') date
                FROM orders WHERE store_id = ? AND status = 'completed' ORDER BY order_id DESC LIMIT 50", [$sid]) : [],
            'moves' => DB::select("SELECT m.movement_id id, m.product_id pid, m.type, m.quantity qty, m.remarks,
                    DATE_FORMAT(m.created_at,'%b %e, %Y %l:%i %p') at, COALESCE(u.name,'') who
                FROM stock_movements m LEFT JOIN users u ON u.user_id = m.user_id
                WHERE m.store_id = ? ORDER BY m.movement_id DESC LIMIT 200", [$sid]),
            'archived' => DB::select("SELECT product_id id, name FROM products
                WHERE is_active = 0 AND store_id = ? ORDER BY name", [$sid]),
                        'today' => $today,
            'batches' => DB::select("SELECT batch_id id, product_id pid, batch_code code, pack_type pack,
                    pieces_per_box per_box, boxes, qty_received received, qty_remaining qty,
                    DATE_FORMAT(expiry_date,'%Y-%m-%d') expiry, DATE_FORMAT(created_at,'%b %e, %Y') at
                FROM stock_batches WHERE store_id = ? AND qty_remaining > 0
                ORDER BY expiry_date IS NULL, expiry_date, batch_id", [$sid]),
            'month' => $u->hasPerm('costs')
                ? ExpenseController::summary($sid, now()->startOfMonth(), now()->endOfMonth())
                : null,
        ];
    }
    
        
    

    /* ---------------- Products ---------------- */

    public function storeProduct(Request $r)
{
    $sid = $this->need($r, 'products');
    $v = $r->validate([
        'is_repacked' => 'nullable|boolean',
        'low_stock' => 'nullable|integer|min:0',
        'name' => 'required|string|max:120', 'description' => 'nullable|string|max:500',
        'cat' => 'nullable|string|max:80',
        'cost_price' => 'nullable|numeric|min:0',
        'price' => 'required|numeric|min:0',
        'code' => 'nullable|string|max:50',
        'size_value' => 'nullable|numeric|min:0',
        'size_unit' => 'required_with:size_value|nullable|in:mg,g,kg,ml,l',
'sold_by' => 'required|in:piece,pack,box',
'pack_qty' => 'required_unless:sold_by,piece|nullable|integer|min:1',
'box_contains' => 'required_if:sold_by,box|nullable|in:piece,pack',
'is_homemade' => 'nullable|boolean',
    ]);
    $cost = $r->user()->hasPerm('costs') ? ($v['cost_price'] ?? 0) : 0;
    abort_if($v['price'] < $cost, 422, 'Selling price cannot be below the capital');
    [$code, $size, $unit] = $this->extras($v, $sid);
    $pack = $v['sold_by'] === 'piece' ? null : (int) $v['pack_qty'];
$in = $v['sold_by'] === 'box' ? $v['box_contains'] : null;
    DB::table('products')->insert([
        'is_repacked' => !empty($v['is_repacked']) ? 1 : 0,
        'sold_by' => $v['sold_by'], 'pack_qty' => $pack, 'box_contains' => $in,
'is_homemade' => !empty($v['is_homemade']) ? 1 : 0,
        'low_stock' => $v['low_stock'] ?? 10,
        'store_id' => $sid, 'name' => $v['name'], 'description' => $v['description'] ?? null,
        'code' => $code, 'size_value' => $size, 'size_unit' => $unit,
        'category_id' => $this->catId($v['cat'] ?? '', $sid),
        'cost_price' => $cost, 'unit_price' => $v['price'], 'stock_quantity' => 0,
    ]);
    Activity::log($sid, 'product', "Added product {$v['name']} ({$this->m($v['price'])})");
    return ['ok' => true];
}

public function updateProduct(Request $r, $id)
{
    $sid = $this->need($r, 'products');
    $v = $r->validate([
        'low_stock' => 'nullable|integer|min:0',
        'name' => 'required|string|max:120', 'description' => 'nullable|string|max:500',
        'cat' => 'nullable|string|max:80',
        'cost_price' => 'nullable|numeric|min:0',
        'price' => 'required|numeric|min:0',
        'code' => 'nullable|string|max:50',
        'size_value' => 'nullable|numeric|min:0',
        'size_unit' => 'required_with:size_value|nullable|in:mg,g,kg,ml,l',
'sold_by' => 'required|in:piece,pack,box',
'pack_qty' => 'required_unless:sold_by,piece|nullable|integer|min:1',
'box_contains' => 'required_if:sold_by,box|nullable|in:piece,pack',
'is_homemade' => 'nullable|boolean',
    ]);
    $mine = DB::table('products')->where('product_id', $id)->where('store_id', $sid);
    $old = (clone $mine)->first();
    abort_unless($old, 404, 'Product not found');
    [$code, $size, $unit] = $this->extras($v, $sid, $id);
    $pack = $v['sold_by'] === 'piece' ? null : (int) $v['pack_qty'];
$in = $v['sold_by'] === 'box' ? $v['box_contains'] : null;
    
    $canCost = $r->user()->hasPerm('costs');
    $cost = $canCost ? ($v['cost_price'] ?? 0) : $old->cost_price;
    abort_if($v['price'] < $cost, 422, 'Selling price cannot be below the capital');

    $row = [
        'low_stock' => $v['low_stock'] ?? 10,
        'name' => $v['name'], 'description' => $v['description'] ?? null,
        'code' => $code, 'size_value' => $size, 'size_unit' => $unit,
        'category_id' => $this->catId($v['cat'] ?? '', $sid),
        'unit_price' => $v['price'],
        'sold_by' => $v['sold_by'], 
        'pack_qty' => $pack, 'box_contains' => $in,
    ];
    
    if ($canCost) $row['cost_price'] = $cost;
    $mine->update($row);

    $ch = [];
    if ($old->name !== $v['name']) $ch[] = "name “{$old->name}” → “{$v['name']}”";
    if ((float) $old->unit_price !== (float) $v['price']) $ch[] = 'price ' . $this->m($old->unit_price) . ' → ' . $this->m($v['price']);
    if ($canCost && (float) $old->cost_price !== (float) $cost) $ch[] = 'capital ' . $this->m($old->cost_price) . ' → ' . $this->m($cost);
    Activity::log($sid, 'product', "Edited {$old->name}" . ($ch ? ': ' . implode(', ', $ch) : ''));
    return ['ok' => true];
}

    // Soft delete: keeps old orders valid
    public function destroyProduct(Request $r, $id)
    {
        $sid = $this->need($r, 'products');
        $q = DB::table('products')->where('product_id', $id)->where('store_id', $sid);
        $name = (clone $q)->value('name');
        $q->update(['is_active' => 0]);
        if ($name) Activity::log($sid, 'product', "Deleted product $name");
        return ['ok' => true];
    }

    public function restoreProduct(Request $r, $id)
    {
        $sid = $this->need($r, 'products');
        $p = DB::table('products')->where('product_id', $id)->where('store_id', $sid)->where('is_active', 0);
        abort_unless($p->exists(), 404, 'Product not found');
        $name = (clone $p)->value('name');
        $p->update(['is_active' => 1]);
        Activity::log($sid, 'product', "Restored product $name");
        return ['ok' => true];
    }

    /* ---------------- Stock ---------------- */

    public function receiveStock(Request $r)
{
    $sid = $this->need($r, 'stock');
    $v = $r->validate([
        'product_id' => 'required|integer',
        'pack' => 'required|in:piece,box',
        'qty' => 'required|integer|min:1',                       // pieces, or number of boxes
        'per_box' => 'required_if:pack,box|nullable|integer|min:1',
        'batch_code' => 'nullable|string|max:60',
        'expiry' => 'nullable|date_format:Y-m-d|after:2000-01-01',
        'remarks' => 'nullable|string|max:200',
    ]);
    $p = DB::table('products')->where('product_id', $v['product_id'])->where('store_id', $sid)->where('is_active', 1)->first();
    abort_unless($p, 404, 'Product not found');

    $box = $v['pack'] === 'box';
    $per = $box ? (int) $v['per_box'] : null;
    $boxes = $box ? (int) $v['qty'] : null;
    $pieces = $box ? $boxes * $per : (int) $v['qty'];
    $code = trim((string) ($v['batch_code'] ?? '')) ?: null;
    if ($code) {
        abort_if(DB::table('stock_batches')->where('product_id', $p->product_id)->where('batch_code', $code)->exists(),
            422, 'This product already has a batch with that number');
    }

    DB::transaction(function () use ($v, $sid, $p, $box, $per, $boxes, $pieces, $code, $r) {
        DB::table('stock_batches')->insert([
            'store_id' => $sid, 'product_id' => $p->product_id, 'user_id' => $r->user()->getKey(),
            'batch_code' => $code, 'pack_type' => $v['pack'], 'pieces_per_box' => $per, 'boxes' => $boxes,
            'qty_received' => $pieces, 'qty_remaining' => $pieces,
            'expiry_date' => $v['expiry'] ?? null, 'created_at' => now(),
        ]);
        DB::table('products')->where('product_id', $p->product_id)->increment('stock_quantity', $pieces);
        $note = ($v['remarks'] ?? '') ?: ('Batch' . ($code ? " $code" : '') . ($box ? " · $boxes box × $per" : ''));
        $this->log($sid, $p->product_id, 'IN', $pieces, $note);
    });
    Activity::log($sid, 'stock', "Received $pieces × {$p->name}" . (!empty($v['expiry']) ? " (expires {$v['expiry']})" : ''));
    return ['ok' => true];
}

public function updateBatch(Request $r, $id)
{
    $sid = $this->need($r, 'stock');
    $v = $r->validate(['batch_code' => 'nullable|string|max:60', 'expiry' => 'nullable|date_format:Y-m-d|after:2000-01-01']);
    $b = DB::table('stock_batches')->where('batch_id', $id)->where('store_id', $sid)->first();
    abort_unless($b, 404, 'Batch not found');
    $code = trim((string) ($v['batch_code'] ?? '')) ?: null;
    if ($code) {
        abort_if(DB::table('stock_batches')->where('product_id', $b->product_id)->where('batch_code', $code)
            ->where('batch_id', '!=', $id)->exists(), 422, 'This product already has a batch with that number');
    }
    DB::table('stock_batches')->where('batch_id', $id)->update(['batch_code' => $code, 'expiry_date' => $v['expiry'] ?? null]);
    $name = DB::table('products')->where('product_id', $b->product_id)->value('name');
    Activity::log($sid, 'stock', "Edited a batch of $name");
    return ['ok' => true];
}

    public function removeStock(Request $r)
{
    $sid = $this->need($r, 'stock');
    $v = $r->validate([
        'product_id' => 'required|integer',
        'batch_id' => 'nullable|integer',
        'qty' => 'required|integer|min:1',
        'reason' => 'required|in:damaged,expired,lost,other',
        'remarks' => 'nullable|string|max:200',
    ]);

    DB::transaction(function () use ($v, $sid) {
        $p = DB::table('products')->where('product_id', $v['product_id'])->where('store_id', $sid)->lockForUpdate()->first();
        abort_unless($p, 404, 'Product not found');
        abort_if($p->stock_quantity < $v['qty'], 422, 'Only ' . $p->stock_quantity . ' in stock');

        if (!empty($v['batch_id'])) {
            $b = DB::table('stock_batches')->where('batch_id', $v['batch_id'])->where('store_id', $sid)
                ->where('product_id', $p->product_id)->lockForUpdate()->first();
            abort_unless($b, 404, 'Batch not found');
            abort_if($b->qty_remaining < $v['qty'], 422, 'Only ' . $b->qty_remaining . ' left in that batch');
            DB::table('stock_batches')->where('batch_id', $b->batch_id)->decrement('qty_remaining', $v['qty']);
        } else {
            $this->deduct($sid, $p->product_id, $v['qty']);
        }

        DB::table('products')->where('product_id', $p->product_id)->decrement('stock_quantity', $v['qty']);
        $note = ucfirst($v['reason']) . (!empty($v['remarks']) ? ': ' . $v['remarks'] : '');
        $this->log($sid, $p->product_id, 'OUT', $v['qty'], $note, null, 'removal');

        Activity::log($sid, 'stock', "Removed {$v['qty']} × {$p->name} ({$v['reason']})");
        $left = $p->stock_quantity - $v['qty'];
        if ($p->stock_quantity > $p->low_stock && $left <= $p->low_stock) {
            Activity::log($sid, 'lowstock', "{$p->name} is running low ($left left)");
        }
    });
    return ['ok' => true];
}

    /* ---------------- Sales ---------------- */

    public function sale(Request $r)
    {
        $sid = $this->need($r, 'sell');
        $v = $r->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.qty' => 'required|integer|min:1',
            'method' => 'required|in:cash,gcash,maya,other',
            'amount_paid' => 'nullable|numeric|min:0',
        ]);

                [$orderId, $no, $total, $lines, $paid] = DB::transaction(function () use ($v, $r, $sid) {
            // Lock the store row so two sales at once cannot get the same number
            $store = DB::table('stores')->where('store_id', $sid)->lockForUpdate()->first(['order_reset']);
            $now = now();
            $key = $this->periodKey($store->order_reset ?? 'daily', $now);
            $no = ((int) DB::table('orders')->where('store_id', $sid)->where('period_key', $key)->max('order_no')) + 1;

            $orderId = DB::table('orders')->insertGetId([
                'store_id' => $sid, 'user_id' => $r->user()->getKey(),
                'order_date' => $now, 'order_no' => $no, 'period_key' => $key,
                'status' => 'completed', 'total_amount' => 0,
            ]);
            $total = 0;
            $lines = [];

            foreach ($v['items'] as $i) {
                $p = DB::table('products')->where('product_id', $i['id'])->where('store_id', $sid)->lockForUpdate()->first();
                if (!$p || $p->stock_quantity < $i['qty']) {
                   
                    abort(422, 'Not enough stock for ' . ($p->name ?? 'a product'));
                }
                $sub = $p->unit_price * $i['qty'];
                $total += $sub;
                 $lines[] = ['name' => $p->name, 'qty' => $i['qty'], 'price' => (float) $p->unit_price];

                DB::table('order_items')->insert([
                    'order_id' => $orderId, 'product_id' => $p->product_id, 'quantity' => $i['qty'],
                    'unit_price' => $p->unit_price, 'unit_cost' => $p->cost_price, 'subtotal' => $sub,
                ]);
                DB::table('products')->where('product_id', $p->product_id)->decrement('stock_quantity', $i['qty']);
                 $this->deduct($sid, $p->product_id, $i['qty']);
                $this->log($sid, $p->product_id, 'OUT', $i['qty'], 'Sale #' . $no . ' · ' . $now->format('M j'), $orderId, 'order');

                $left = $p->stock_quantity - $i['qty'];
                if ($p->stock_quantity > $p->low_stock && $left <= $p->low_stock) {
                    Activity::log($sid, 'lowstock', "{$p->name} is running low ($left left)");
                }
            }

            $paid = $v['method'] === 'cash' ? ($v['amount_paid'] ?? null) : $total;
            abort_if($v['method'] === 'cash' && ($paid === null || round($paid, 2) < round($total, 2)),
                422, 'Cash received is less than the total');

            DB::table('orders')->where('order_id', $orderId)->update([
                'total_amount' => $total, 'payment_method' => $v['method'], 'amount_paid' => $paid,
            ]);
            Activity::log($sid, 'sale', "Sale #$no · {$this->m($total)} · " . count($v['items']) . ' item(s)');
            return [$orderId, $no, $total, $lines, $paid];
        });

                return ['ok' => true, 'order_id' => $orderId, 'order_no' => $no,
                'total' => (float) $total, 'items' => $lines, 'paid' => (float) $paid];
    }

    public function sales(Request $r)
    {
        $u = $r->user();
        $sid = $this->need($r, 'history');

        $orders = DB::select("SELECT o.order_id id, o.order_no no, o.status, CAST(o.total_amount AS DOUBLE) total,
                o.payment_method method, CAST(o.amount_paid AS DOUBLE) paid,
                DATE_FORMAT(o.order_date,'%b %e, %Y %l:%i %p') at, COALESCE(u.name,'') cashier
            FROM orders o LEFT JOIN users u ON u.user_id = o.user_id
            WHERE o.store_id = ? ORDER BY o.order_id DESC LIMIT 100", [$sid]);
        if (!$orders) return [];

        $ids = array_column($orders, 'id');
        $in = implode(',', array_fill(0, count($ids), '?'));
        $items = DB::select("SELECT oi.order_id, p.name, oi.quantity qty,
                CAST(oi.unit_price AS DOUBLE) price, CAST(oi.unit_cost AS DOUBLE) cost
            FROM order_items oi JOIN products p ON p.product_id = oi.product_id
            WHERE oi.order_id IN ($in)", $ids);

        $by = [];
        foreach ($items as $i) {
            if (!$u->hasPerm('costs')) unset($i->cost);
            $by[$i->order_id][] = $i;
        }
        foreach ($orders as $o) $o->items = $by[$o->id] ?? [];
        return $orders;
    }

    public function voidSale(Request $r, $id)
    {
        $sid = $this->need($r, 'void');

        DB::transaction(function () use ($sid, $id) {
            $o = DB::table('orders')->where('order_id', $id)->where('store_id', $sid)->lockForUpdate()->first();
            abort_unless($o, 404, 'Sale not found');
            abort_if($o->status === 'cancelled', 422, 'This sale is already voided');
            $no = $o->order_no ?? $id;

            foreach (DB::table('order_items')->where('order_id', $id)->get() as $i) {
                DB::table('products')->where('product_id', $i->product_id)->where('store_id', $sid)
                    ->increment('stock_quantity', $i->quantity);
                     $this->restore($sid, $i->product_id, $i->quantity);
                $this->log($sid, $i->product_id, 'IN', $i->quantity, 'Voided sale #' . $no, $id, 'order');
            }
            DB::table('orders')->where('order_id', $id)->update(['status' => 'cancelled']);
            Activity::log($sid, 'void', "Voided sale #$no ({$this->m($o->total_amount)})");
        });
        return ['ok' => true];
    }

    /* ---------------- Suppliers ---------------- */

    public function storeSupplier(Request $r)
    {
        $sid = $this->need($r, 'suppliers');
        $v = $r->validate([
            'name' => 'required|string|max:120', 'contact' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30', 'email' => 'nullable|email|max:120', 'address' => 'nullable|string|max:255',
        ]);
        DB::table('suppliers')->insert([
            'store_id' => $sid, 'name' => $v['name'], 'contact_person' => $v['contact'] ?? null,
            'phone' => $v['phone'] ?? null, 'email' => $v['email'] ?? null, 'address' => $v['address'] ?? null,
        ]);
        Activity::log($sid, 'supplier', "Added supplier {$v['name']}");
        return ['ok' => true];
    }

    public function updateSupplier(Request $r, $id)
    {
        $sid = $this->need($r, 'suppliers');
        $v = $r->validate([
            'name' => 'required|string|max:120', 'contact' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30', 'email' => 'nullable|email|max:120', 'address' => 'nullable|string|max:255',
        ]);
        $mine = DB::table('suppliers')->where('supplier_id', $id)->where('store_id', $sid);
        abort_unless((clone $mine)->exists(), 404, 'Supplier not found');
        $mine->update([
            'name' => $v['name'], 'contact_person' => $v['contact'] ?? null,
            'phone' => $v['phone'] ?? null, 'email' => $v['email'] ?? null, 'address' => $v['address'] ?? null,
        ]);
        Activity::log($sid, 'supplier', "Edited supplier {$v['name']}");
        return ['ok' => true];
    }

    public function destroySupplier(Request $r, $id)
    {
        $sid = $this->need($r, 'suppliers');
        $q = DB::table('suppliers')->where('supplier_id', $id)->where('store_id', $sid);
        $name = (clone $q)->value('name');
        $q->delete();
        if ($name) Activity::log($sid, 'supplier', "Deleted supplier $name");
        return ['ok' => true];
    }

    /* ---------------- Categories ---------------- */

    public function storeCategory(Request $r)
    {
        $sid = $this->need($r, 'products');
        $v = $r->validate(['name' => 'required|string|max:80']);
        $name = trim($v['name']);
        abort_if(DB::table('categories')->where('store_id', $sid)->where('name', $name)->exists(), 422, 'That category already exists');
        DB::table('categories')->insert(['store_id' => $sid, 'name' => $name]);
        Activity::log($sid, 'category', "Added category $name");
        return ['ok' => true];
    }

    public function updateCategory(Request $r, $id)
    {
        $sid = $this->need($r, 'products');
        $v = $r->validate(['name' => 'required|string|max:80']);
        $name = trim($v['name']);
        $old = DB::table('categories')->where('category_id', $id)->where('store_id', $sid)->value('name');
        abort_unless($old, 404, 'Category not found');
        abort_if(DB::table('categories')->where('store_id', $sid)->where('name', $name)->where('category_id', '!=', $id)->exists(), 422, 'That category already exists');
        DB::table('categories')->where('category_id', $id)->update(['name' => $name]);
        Activity::log($sid, 'category', "Renamed category $old → $name");
        return ['ok' => true];
    }

    public function destroyCategory(Request $r, $id)
    {
        $sid = $this->need($r, 'products');
        $name = DB::table('categories')->where('category_id', $id)->where('store_id', $sid)->value('name');
        abort_unless($name, 404, 'Category not found');
        $used = DB::table('products')->where('category_id', $id)->where('is_active', 1)->count();
        abort_if($used > 0, 422, "$used product(s) still use this category. Move them first.");
        DB::table('categories')->where('category_id', $id)->delete();
        Activity::log($sid, 'category', "Deleted category $name");
        return ['ok' => true];
    }
}