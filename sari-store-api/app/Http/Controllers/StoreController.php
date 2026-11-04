<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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

    private function log($sid, $pid, $type, $qty, $remarks, $refId = null, $refType = null)
    {
        DB::table('stock_movements')->insert([
            'store_id' => $sid, 'product_id' => $pid, 'type' => $type, 'quantity' => $qty,
            'remarks' => $remarks, 'reference_id' => $refId, 'reference_type' => $refType,
        ]);
    }

    private function catId($name)
    {
        return DB::table('categories')->where('name', $name)->value('category_id');
    }

    public function data(Request $r)
    {
        $u = $r->user();
        $sid = $this->sid($r);

        $products = DB::select("SELECT p.product_id id, p.name, COALESCE(c.name,'') cat,
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

        // Roles without the "costs" permission never receive capital figures
        if (!$u->hasPerm('costs')) {
            foreach ($products as $p) unset($p->cost_price);
            $today->cost = null;
        }

        return [
            'me' => $u->toClient(),
            'products' => $products,
            'suppliers' => DB::select("SELECT supplier_id id, name, contact_person contact, phone
                FROM suppliers WHERE store_id = ? ORDER BY name", [$sid]),
            'orders' => DB::select("SELECT order_id id, CAST(total_amount AS DOUBLE) total, DATE_FORMAT(order_date,'%Y-%m-%dT%H:%i:%s') date
                                FROM orders WHERE store_id = ? AND status = 'completed' ORDER BY order_id DESC LIMIT 50", [$sid]),
            'moves' => DB::select("SELECT movement_id id, product_id pid, type, quantity qty, remarks, DATE_FORMAT(created_at,'%b %e, %Y %l:%i %p') at
                FROM stock_movements WHERE store_id = ? ORDER BY movement_id DESC LIMIT 200", [$sid]),
            'today' => $today,
        ];
    }

    public function storeProduct(Request $r)
    {
        $sid = $this->need($r, 'products');
        $v = $r->validate([
            'name' => 'required|string|max:120', 'cat' => 'nullable|string',
            'cost_price' => 'nullable|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'qty' => 'required|integer|min:0',
        ]);
        $cost = $r->user()->hasPerm('costs') ? ($v['cost_price'] ?? 0) : 0;
        abort_if($v['price'] < $cost, 422, 'Selling price cannot be below the capital');

        DB::transaction(function () use ($v, $sid, $cost) {
            $id = DB::table('products')->insertGetId([
                'store_id' => $sid, 'name' => $v['name'], 'category_id' => $this->catId($v['cat'] ?? ''),
                'cost_price' => $cost, 'unit_price' => $v['price'], 'stock_quantity' => $v['qty'],
            ]);
            if ($v['qty'] > 0) $this->log($sid, $id, 'IN', $v['qty'], 'Opening stock');
        });
        return ['ok' => true];
    }

    public function updateProduct(Request $r, $id)
    {
        $sid = $this->need($r, 'products');
        $v = $r->validate([
            'name' => 'required|string|max:120', 'cat' => 'nullable|string',
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
                'name' => $v['name'], 'category_id' => $this->catId($v['cat'] ?? ''),
                'unit_price' => $v['price'], 'stock_quantity' => $v['qty'],
            ];
            if ($canCost) $row['cost_price'] = $cost;
            $mine->update($row);
            if ($v['qty'] != $old->stock_quantity) {
                $this->log($sid, $id, 'ADJUSTMENT', $v['qty'] - $old->stock_quantity, 'Edited stock');
            }
        });
        return ['ok' => true];
    }

    // Soft delete: keeps old orders valid
    public function destroyProduct(Request $r, $id)
    {
        $sid = $this->need($r, 'products');
        DB::table('products')->where('product_id', $id)->where('store_id', $sid)->update(['is_active' => 0]);
        return ['ok' => true];
    }

    public function addStock(Request $r)
    {
        $sid = $this->need($r, 'stock');
        $v = $r->validate(['product_id' => 'required|integer', 'qty' => 'required|integer|min:1', 'remarks' => 'nullable|string']);
        $mine = DB::table('products')->where('product_id', $v['product_id'])->where('store_id', $sid);
        abort_unless((clone $mine)->exists(), 404, 'Product not found');

        DB::transaction(function () use ($v, $mine, $sid) {
            $mine->increment('stock_quantity', $v['qty']);
            $this->log($sid, $v['product_id'], 'IN', $v['qty'], $v['remarks'] ?: 'Restock');
        });
        return ['ok' => true];
    }

    public function sale(Request $r)
    {
        $sid = $this->need($r, 'sell');
        $v = $r->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.qty' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($v, $r, $sid) {
            $orderId = DB::table('orders')->insertGetId([
                'store_id' => $sid, 'user_id' => $r->user()->getKey(),
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
                $this->log($sid, $p->product_id, 'OUT', $i['qty'], 'Sale #' . $orderId, $orderId, 'order');
            }
            DB::table('orders')->where('order_id', $orderId)->update(['total_amount' => $total]);
        });

        return ['ok' => true];
    }

        public function sales(Request $r)
    {
        $u = $r->user();
        $sid = $this->need($r, 'history');

        $orders = DB::select("SELECT o.order_id id, o.status, CAST(o.total_amount AS DOUBLE) total,
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

            foreach (DB::table('order_items')->where('order_id', $id)->get() as $i) {
                DB::table('products')->where('product_id', $i->product_id)->where('store_id', $sid)
                    ->increment('stock_quantity', $i->quantity);
                $this->log($sid, $i->product_id, 'IN', $i->quantity, 'Voided sale #' . $id, $id, 'order');
            }
            DB::table('orders')->where('order_id', $id)->update(['status' => 'cancelled']);
        });
        return ['ok' => true];
    }

    public function storeSupplier(Request $r)
    {
        $sid = $this->need($r, 'suppliers');
        $v = $r->validate(['name' => 'required|string|max:120', 'contact' => 'nullable|string', 'phone' => 'nullable|string']);
        DB::table('suppliers')->insert([
            'store_id' => $sid, 'name' => $v['name'],
            'contact_person' => $v['contact'] ?? null, 'phone' => $v['phone'] ?? null,
        ]);
        return ['ok' => true];
    }

    public function destroySupplier(Request $r, $id)
    {
        $sid = $this->need($r, 'suppliers');
        DB::table('suppliers')->where('supplier_id', $id)->where('store_id', $sid)->delete();
        return ['ok' => true];
    }
}