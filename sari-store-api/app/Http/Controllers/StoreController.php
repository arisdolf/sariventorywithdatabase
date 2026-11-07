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

    public function data(Request $r)
    {
        $u = $r->user();
        $sid = $this->sid($r);

        $products = DB::select("SELECT p.product_id id, p.name, p.description, p.low_stock, COALESCE(c.name,'') cat,
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

        return [
            'me' => $u->toClient(),
            'products' => $products,
            'categories' => DB::select("SELECT category_id id, name FROM categories WHERE store_id = ? ORDER BY name", [$sid]),
            'suppliers' => DB::select("SELECT supplier_id id, name, contact_person contact, phone, email, address
                FROM suppliers WHERE store_id = ? ORDER BY name", [$sid]),
            'orders' => DB::select("SELECT order_id id, order_no no, CAST(total_amount AS DOUBLE) total, DATE_FORMAT(order_date,'%Y-%m-%dT%H:%i:%s') date
                FROM orders WHERE store_id = ? AND status = 'completed' ORDER BY order_id DESC LIMIT 50", [$sid]),
            'moves' => DB::select("SELECT m.movement_id id, m.product_id pid, m.type, m.quantity qty, m.remarks,
                    DATE_FORMAT(m.created_at,'%b %e, %Y %l:%i %p') at, COALESCE(u.name,'') who
                FROM stock_movements m LEFT JOIN users u ON u.user_id = m.user_id
                WHERE m.store_id = ? ORDER BY m.movement_id DESC LIMIT 200", [$sid]),
            'archived' => DB::select("SELECT product_id id, name FROM products
                WHERE is_active = 0 AND store_id = ? ORDER BY name", [$sid]),
            'today' => $today,
        ];
    }

    /* ---------------- Products ---------------- */

    public function storeProduct(Request $r)
    {
        $sid = $this->need($r, 'products');
        $v = $r->validate([
            'low_stock' => 'nullable|integer|min:0',
            'name' => 'required|string|max:120', 'description' => 'nullable|string|max:500',
            'cat' => 'nullable|string|max:80',
            'cost_price' => 'nullable|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'qty' => 'required|integer|min:0',
        ]);
        $cost = $r->user()->hasPerm('costs') ? ($v['cost_price'] ?? 0) : 0;
        abort_if($v['price'] < $cost, 422, 'Selling price cannot be below the capital');

        DB::transaction(function () use ($v, $sid, $cost) {
            $id = DB::table('products')->insertGetId([
                'low_stock' => $v['low_stock'] ?? 10,
                'store_id' => $sid, 'name' => $v['name'], 'description' => $v['description'] ?? null,
                'category_id' => $this->catId($v['cat'] ?? '', $sid),
                'cost_price' => $cost, 'unit_price' => $v['price'], 'stock_quantity' => $v['qty'],
            ]);
            if ($v['qty'] > 0) $this->log($sid, $id, 'IN', $v['qty'], 'Opening stock');
        });
        Activity::log($sid, 'product', "Added product {$v['name']} ({$this->m($v['price'])}, {$v['qty']} in stock)");
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
            'qty' => 'required|integer|min:0',
        ]);
        $mine = DB::table('products')->where('product_id', $id)->where('store_id', $sid);
        $old = (clone $mine)->first();
        abort_unless($old, 404, 'Product not found');

        $canCost = $r->user()->hasPerm('costs');
        $cost = $canCost ? ($v['cost_price'] ?? 0) : $old->cost_price;
        abort_if($v['price'] < $cost, 422, 'Selling price cannot be below the capital');

        DB::transaction(function () use ($v, $mine, $old, $canCost, $cost, $sid, $id) {
            $row = [
                'low_stock' => $v['low_stock'] ?? 10,
                'name' => $v['name'], 'description' => $v['description'] ?? null,
                'category_id' => $this->catId($v['cat'] ?? '', $sid),
                'unit_price' => $v['price'], 'stock_quantity' => $v['qty'],
            ];
            if ($canCost) $row['cost_price'] = $cost;
            $mine->update($row);
            if ($v['qty'] != $old->stock_quantity) {
                $this->log($sid, $id, 'ADJUSTMENT', $v['qty'] - $old->stock_quantity, 'Edited stock');
            }
        });

        $ch = [];
        if ($old->name !== $v['name']) $ch[] = "name “{$old->name}” → “{$v['name']}”";
        if ((float) $old->unit_price !== (float) $v['price']) $ch[] = 'price ' . $this->m($old->unit_price) . ' → ' . $this->m($v['price']);
        if ($canCost && (float) $old->cost_price !== (float) $cost) $ch[] = 'capital ' . $this->m($old->cost_price) . ' → ' . $this->m($cost);
        if ((int) $old->stock_quantity !== (int) $v['qty']) $ch[] = "stock {$old->stock_quantity} → {$v['qty']}";
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

    public function addStock(Request $r)
    {
        $sid = $this->need($r, 'stock');
        $v = $r->validate(['product_id' => 'required|integer', 'qty' => 'required|integer|min:1', 'remarks' => 'nullable|string']);
        $mine = DB::table('products')->where('product_id', $v['product_id'])->where('store_id', $sid);
        abort_unless((clone $mine)->exists(), 404, 'Product not found');
        $name = (clone $mine)->value('name');

        DB::transaction(function () use ($v, $mine, $sid) {
            $mine->increment('stock_quantity', $v['qty']);
            $this->log($sid, $v['product_id'], 'IN', $v['qty'], ($v['remarks'] ?? '') ?: 'Restock');
        });
        Activity::log($sid, 'stock', "Added {$v['qty']} × $name to stock");
        return ['ok' => true];
    }

    public function removeStock(Request $r)
    {
        $sid = $this->need($r, 'stock');
        $v = $r->validate([
            'product_id' => 'required|integer',
            'qty' => 'required|integer|min:1',
            'reason' => 'required|in:damaged,expired,lost,other',
            'remarks' => 'nullable|string|max:200',
        ]);

        DB::transaction(function () use ($v, $sid) {
            $p = DB::table('products')->where('product_id', $v['product_id'])->where('store_id', $sid)->lockForUpdate()->first();
            abort_unless($p, 404, 'Product not found');
            abort_if($p->stock_quantity < $v['qty'], 422, 'Only ' . $p->stock_quantity . ' in stock');

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

        [$orderId, $no] = DB::transaction(function () use ($v, $r, $sid) {
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

            foreach ($v['items'] as $i) {
                $p = DB::table('products')->where('product_id', $i['id'])->where('store_id', $sid)->lockForUpdate()->first();
                if (!$p || $p->stock_quantity < $i['qty']) {
                    abort(422, 'Not enough stock for ' . ($p->name ?? 'a product'));
                }
                $sub = $p->unit_price * $i['qty'];
                $total += $sub;

                DB::table('order_items')->insert([
                    'order_id' => $orderId, 'product_id' => $p->product_id, 'quantity' => $i['qty'],
                    'unit_price' => $p->unit_price, 'unit_cost' => $p->cost_price, 'subtotal' => $sub,
                ]);
                DB::table('products')->where('product_id', $p->product_id)->decrement('stock_quantity', $i['qty']);
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
            return [$orderId, $no];
        });

        return ['ok' => true, 'order_id' => $orderId, 'order_no' => $no];
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