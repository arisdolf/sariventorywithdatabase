<?php

namespace Database\Seeders;

use App\Http\Controllers\AuthController;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoStoreSeeder extends Seeder
{
    const STORE = "Kuya Jun's 24/7 Convenience Store";
    const PASSWORD = 'Demo12345!';

    public function run(): void
    {
        mt_srand(2026); // same data every time
        DB::disableQueryLog();

        if (DB::table('stores')->where('name', self::STORE)->exists()) {
            $this->command->error('The demo store already exists. Run the cleanup SQL first.');
            return;
        }

        $today = Carbon::today();
        $start = $today->copy()->subYears(5)->subMonths(2);
        $days = (int) (($today->timestamp - $start->timestamp) / 86400);

        /* ---------- Store ---------- */
        $sid = DB::table('stores')->insertGetId([
            'name' => self::STORE, 'join_code' => AuthController::makeCode(),
            'store_type' => 'mini_grocery', 'created_at' => $start,
        ]);
        $code = DB::table('stores')->where('store_id', $sid)->value('join_code');

        /* ---------- Team ---------- */
        // first, middle, last, role, months after opening, birthdate, email key
        $defs = [
            ['Junnel', 'Dela', 'Cruz', 'owner', 0, '1978-04-12', 'owner'],
            ['Maria Cristina', 'Lopez', 'Reyes', 'manager', 3, '1985-09-23', 'manager'],
            ['Angelica', null, 'Ramos', 'cashier', 1, '1999-02-14', 'angelica'],
            ['Mark Anthony', 'Cruz', 'Villanueva', 'cashier', 14, '2000-11-05', 'mark'],
            ['Joy', null, 'Lim', 'cashier', 30, '2001-07-19', 'joy'],
            ['Paolo', 'Santos', 'Fernandez', 'cashier', 44, '2002-01-30', 'paolo'],
            ['Ricardo', null, 'Bautista', 'inventory', 8, '1990-06-08', 'rico'],
            ['Teresa', 'Mae', 'Gomez', 'viewer', 36, '1988-12-02', 'teresa'],
        ];
        $hash = Hash::make(self::PASSWORD);
        $staff = [];
        foreach ($defs as [$first, $mid, $last, $role, $m, $bd, $key]) {
            $joined = $start->copy()->addMonths($m)->setTime(9, 0);
            $id = DB::table('users')->insertGetId([
                'first_name' => $first, 'middle_name' => $mid, 'last_name' => $last,
                'name' => trim(implode(' ', array_filter([$first, $mid, $last]))),
                'email' => "demo.$key@sariventory.test", 'email_verified_at' => $joined,
                'birthdate' => $bd, 'password_hash' => $hash, 'role' => $role,
                'created_at' => $joined, 'terms_accepted_at' => $joined, 'store_id' => $sid,
            ]);
            $staff[] = ['id' => $id, 'role' => $role, 'joined' => $joined, 'email' => "demo.$key@sariventory.test"];
            if ($role === 'owner') {
                DB::table('stores')->where('store_id', $sid)->update(['owner_id' => $id]);
                $ownerId = $id;
            }
            if ($role === 'manager') $managerId = $id;
            if ($role === 'inventory') $invId = $id;
        }

        /* ---------- Suppliers ---------- */
        $suppliers = [
            ['Metro Beverage Distributors', 'Ramon Aquino', '0917 555 0101', 'orders@metrobev.example.com', 'Buhangin, Davao City'],
            ['Golden Harvest Foods', 'Liza Tan', '0918 555 0102', 'sales@goldenharvest.example.com', 'Toril, Davao City'],
            ['Sunrise Bakery Supply', 'Ben Ocampo', '0919 555 0103', null, 'Matina, Davao City'],
            ['CleanHome Wholesale', 'Grace Uy', '0920 555 0104', 'hello@cleanhome.example.com', 'Agdao, Davao City'],
            ['FreshPoint Dairy & Frozen', 'Nina Salazar', '0921 555 0105', 'nina@freshpoint.example.com', 'Lanang, Davao City'],
            ['Davao Snack Traders', 'Mike Chua', '0922 555 0106', null, 'Bangkal, Davao City'],
        ];
        $supNames = [];
        foreach ($suppliers as [$n, $c, $p, $e, $a]) {
            DB::table('suppliers')->insert([
                'store_id' => $sid, 'name' => $n, 'contact_person' => $c, 'phone' => $p,
                'email' => $e, 'address' => $a, 'created_at' => $start,
            ]);
            $supNames[] = $n;
        }

        /* ---------- Categories and products ---------- */
        $cats = [];
        foreach (['Beverages', 'Snacks', 'Noodles & Instant Food', 'Canned Goods', 'Bread & Dairy',
                  'Household', 'Personal Care', 'Candy & Sweets', 'Frozen & Ice'] as $c) {
            $cats[$c] = DB::table('categories')->insertGetId(['store_id' => $sid, 'name' => $c]);
        }

        // name, category, cost now, price now, popularity 1-10, perishable
        $list = [
            ['Coke Mismo 295ml', 'Beverages', 12, 18, 10, 0], ['Royal Tru-Orange 295ml', 'Beverages', 12, 18, 8, 0],
            ['Sprite 1.5L', 'Beverages', 56, 72, 5, 0], ['Bottled Water 500ml', 'Beverages', 8, 15, 10, 0],
            ['Bottled Water 1L', 'Beverages', 12, 22, 7, 0], ['C2 Green Tea 355ml', 'Beverages', 19, 28, 8, 0],
            ['Gatorade 500ml', 'Beverages', 34, 48, 4, 0], ['Zesto Orange 200ml', 'Beverages', 9, 14, 6, 0],
            ['Nescafe 3-in-1 Sachet', 'Beverages', 6, 9, 9, 0], ['Milo 3-in-1 Sachet', 'Beverages', 9, 13, 7, 0],
            ['Piattos 40g', 'Snacks', 17, 26, 8, 0], ['Nova Cheddar 40g', 'Snacks', 17, 26, 7, 0],
            ['Chippy BBQ 27g', 'Snacks', 8, 12, 8, 0], ['Oishi Prawn Crackers 24g', 'Snacks', 7, 11, 6, 0],
            ['Skyflakes Single Pack', 'Snacks', 5, 8, 7, 0], ['Fita Crackers Pack', 'Snacks', 6, 9, 5, 0],
            ['Ding Dong Mix Nuts', 'Snacks', 10, 15, 5, 0], ['Rebisco Cream Sandwich', 'Snacks', 6, 9, 5, 0],
            ['Lucky Me Pancit Canton 60g', 'Noodles & Instant Food', 11, 16, 10, 0],
            ['Lucky Me Instant Mami 55g', 'Noodles & Instant Food', 8, 12, 6, 0],
            ['Nissin Cup Noodles', 'Noodles & Instant Food', 28, 40, 6, 0],
            ['Lucky Me Beef Cup', 'Noodles & Instant Food', 22, 32, 5, 0],
            ['Quaker Oats Sachet', 'Noodles & Instant Food', 9, 14, 3, 0],
            ['Century Tuna Flakes 155g', 'Canned Goods', 29, 40, 7, 0], ['555 Sardines 155g', 'Canned Goods', 19, 27, 7, 0],
            ['Ligo Sardines 155g', 'Canned Goods', 20, 28, 6, 0], ['Argentina Corned Beef 150g', 'Canned Goods', 34, 48, 5, 0],
            ['Alaska Evap Milk 410ml', 'Canned Goods', 38, 52, 4, 0], ['Del Monte Tomato Sauce 200g', 'Canned Goods', 18, 26, 3, 0],
            ['Gardenia Classic White Loaf', 'Bread & Dairy', 66, 84, 6, 1], ['Pandesal Pack (10pcs)', 'Bread & Dairy', 24, 38, 8, 1],
            ['Eggs (per piece)', 'Bread & Dairy', 8, 11, 9, 1], ['Nestle Fresh Milk 1L', 'Bread & Dairy', 98, 125, 3, 1],
            ['Bear Brand Sachet', 'Bread & Dairy', 12, 17, 6, 0], ['Eden Cheese 165g', 'Bread & Dairy', 52, 70, 3, 1],
            ['Joy Dishwashing Liquid 250ml', 'Household', 42, 58, 4, 0], ['Surf Powder Sachet', 'Household', 8, 12, 7, 0],
            ['Downy Sachet', 'Household', 8, 12, 6, 0], ['Zonrox Bleach 250ml', 'Household', 19, 28, 3, 0],
            ['Tissue Roll (single)', 'Household', 12, 20, 5, 0], ['Eveready AA Battery (2pcs)', 'Household', 42, 62, 3, 0],
            ['Safeguard Soap 85g', 'Personal Care', 29, 40, 5, 0], ['Colgate Toothpaste 25g', 'Personal Care', 16, 24, 4, 0],
            ['Head & Shoulders Sachet', 'Personal Care', 7, 11, 6, 0], ['Rexona Sachet', 'Personal Care', 6, 10, 4, 0],
            ['Modess Napkin Pack', 'Personal Care', 40, 56, 4, 0], ['Alcohol 70% 60ml', 'Personal Care', 26, 40, 3, 0],
            ['Cloud 9 Chocolate Bar', 'Candy & Sweets', 8, 13, 7, 0], ['Maxx Menthol Candy', 'Candy & Sweets', 1, 2, 9, 0],
            ['Haw Flakes Roll', 'Candy & Sweets', 6, 10, 4, 0], ['Choco Mucho Bar', 'Candy & Sweets', 9, 14, 5, 0],
            ['Cornetto Cone', 'Frozen & Ice', 22, 32, 6, 1], ['Magnum Classic', 'Frozen & Ice', 42, 58, 3, 1],
            ['Ice Bag (small)', 'Frozen & Ice', 8, 15, 6, 0], ['Tender Juicy Hotdog 250g', 'Frozen & Ice', 58, 78, 4, 1],
        ];

        $prod = [];
        foreach ($list as [$name, $cat, $cost, $price, $pop, $fresh]) {
            $target = 40 + $pop * 15;
            $low = max(5, (int) round($target * 0.25));
            $id = DB::table('products')->insertGetId([
                'store_id' => $sid, 'name' => $name, 'category_id' => $cats[$cat],
                'cost_price' => $cost, 'unit_price' => $price, 'stock_quantity' => $target,
                'low_stock' => $low, 'is_active' => 1, 'created_at' => $start,
            ]);
            $prod[$id] = ['price' => $price, 'ratio' => $cost / $price, 'pop' => $pop, 'fresh' => $fresh,
                          'target' => $target, 'low' => $low, 'stock' => $target];
        }
        $ids = array_keys($prod);
        $cum = []; $total = 0;
        foreach ($ids as $i) { $total += (int) round(pow($prod[$i]['pop'], 1.5) * 10); $cum[] = $total; }
        $pick = function () use ($ids, $cum, $total) {
            $r = mt_rand(1, $total);
            foreach ($cum as $k => $c) if ($r <= $c) return $ids[$k];
            return end($ids);
        };
        $priceAt = function (array $p, Carbon $d) use ($today) {
            $f = pow(1.04, -(($today->timestamp - $d->timestamp) / 86400 / 365));
            return max(1, round($p['price'] * $f * 2) / 2);
        };

        /* ---------- Buffers ---------- */
        $orders = []; $items = []; $mv = [];
        $flush = function () use (&$orders, &$items, &$mv) {
            foreach (array_chunk($orders, 800) as $c) DB::table('orders')->insert($c);
            foreach (array_chunk($items, 2000) as $c) DB::table('order_items')->insert($c);
            foreach (array_chunk($mv, 1500) as $c) DB::table('stock_movements')->insert($c);
            $orders = $items = $mv = [];
        };
        $movement = function ($pid, $type, $qty, $remarks, $when, $uid, $refId = null, $refType = null) use (&$mv, $sid) {
            $mv[] = ['store_id' => $sid, 'user_id' => $uid, 'product_id' => $pid, 'type' => $type, 'quantity' => $qty,
                     'remarks' => $remarks, 'reference_id' => $refId, 'reference_type' => $refType, 'created_at' => $when];
        };

        foreach ($prod as $pid => $p) $movement($pid, 'IN', $p['target'], 'Opening stock', $start->copy()->setTime(8, 0), $ownerId);

        $hours = [6, 7, 7, 8, 8, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 17, 18, 18, 19, 19, 20, 21, 22];
        $now = Carbon::now();
        $oid = (int) DB::table('orders')->max('order_id') + 1;
        $orderCount = 0;

        /* ---------- Day by day ---------- */
        for ($i = 0; $i <= $days; $i++) {
            $day = $start->copy()->addDays($i);
            $progress = $i / max(1, $days);

            // Who can work today (staff who have joined by now)
            $pool = [];
            foreach ($staff as $s) {
                if ($s['joined']->gt($day->copy()->endOfDay())) continue;
                $w = match ($s['role']) { 'cashier' => 6, 'manager' => 2, 'owner' => 1, default => 0 };
                for ($k = 0; $k < $w; $k++) $pool[] = $s['id'];
            }

            $dow = (int) $day->dayOfWeekIso;
            $n = 22 + $progress * 26;
            $n *= $dow >= 5 ? 1.2 : ($dow == 7 ? 1.1 : ($dow == 1 ? 0.9 : 1));
            if (in_array($day->day, [15, 30]) || $day->isLastOfMonth()) $n *= 1.25;
            if ($day->month === 12) $n *= 1.2;
            if (mt_rand(1, 100) <= 5) $n *= 0.8; // rainy day
            $n = (int) round($n * (0.88 + mt_rand(0, 24) / 100));

            for ($o = 0; $o < $n; $o++) {
                $when = $day->copy()->setTime($hours[array_rand($hours)], mt_rand(0, 59), mt_rand(0, 59));
                if ($when->gt($now)) continue;

                $cancelled = mt_rand(1, 100) === 1;
                $k = [1, 1, 1, 2, 2, 2, 3, 3, 4, 5][mt_rand(0, 9)];
                $chosen = [];
                for ($t = 0; $t < $k * 4 && count($chosen) < $k; $t++) $chosen[$pick()] = true;

                $lines = []; $sum = 0;
                foreach (array_keys($chosen) as $pid) {
                    $price = $priceAt($prod[$pid], $day);
                    $qty = $price < 15 ? [1, 1, 2, 2, 3, 4, 5, 6][mt_rand(0, 7)] : [1, 1, 1, 2, 2, 3][mt_rand(0, 5)];
                    if (!$cancelled) {
                        $qty = min($qty, $prod[$pid]['stock']);
                        if ($qty <= 0) continue;
                    }
                    $cost = round($price * $prod[$pid]['ratio'], 2);
                    $lines[] = [$pid, $qty, $price, $cost];
                    $sum += $price * $qty;
                }
                if (!$lines) continue;

                // Payment mix shifts toward e-wallets over the years
                $r = mt_rand(1, 100);
                $gcash = 5 + 30 * $progress; $maya = 2 + 8 * $progress;
                $method = $r <= $gcash ? 'gcash' : ($r <= $gcash + $maya ? 'maya' : ($r <= $gcash + $maya + 1 ? 'other' : 'cash'));
                if ($method === 'cash') {
                    $opts = [$sum, ceil($sum / 5) * 5, ceil($sum / 10) * 10, ceil($sum / 50) * 50, ceil($sum / 100) * 100];
                    $paid = max($sum, $opts[array_rand($opts)]);
                } else {
                    $paid = $sum;
                }

                $uid = $pool[array_rand($pool)];
                $orders[] = [
                    'order_id' => $oid, 'user_id' => $uid, 'order_date' => $when, 'status' => $cancelled ? 'cancelled' : 'completed',
                    'total_amount' => $sum, 'created_at' => $when, 'store_id' => $sid,
                    'payment_method' => $method, 'amount_paid' => $paid,
                ];
                foreach ($lines as [$pid, $qty, $price, $cost]) {
                    $items[] = ['order_id' => $oid, 'product_id' => $pid, 'quantity' => $qty,
                                'unit_price' => $price, 'subtotal' => $price * $qty, 'unit_cost' => $cost];
                    if (!$cancelled) {
                        $prod[$pid]['stock'] -= $qty;
                        if ($days - $i <= 60) $movement($pid, 'OUT', $qty, "Sale #$oid", $when, $uid, $oid, 'order');
                    }
                }
                $oid++; $orderCount++;
            }

            // End of day: expired / damaged removals, then restocks
            $invActive = $staff[6]['joined']->lte($day) ? $invId : $managerId;
            foreach ($prod as $pid => &$p) {
                if ($p['fresh'] && $p['stock'] > 10 && mt_rand(1, 100) <= 3) {
                    $q = min($p['stock'], mt_rand(1, 4));
                    $p['stock'] -= $q;
                    $movement($pid, 'OUT', $q, 'Expired', $day->copy()->setTime(20, 30), $invActive, null, 'removal');
                } elseif (mt_rand(1, 1000) <= 3 && $p['stock'] > 10) {
                    $p['stock'] -= 1;
                    $movement($pid, 'OUT', 1, 'Damaged: dropped on the floor', $day->copy()->setTime(14, 0), $invActive, null, 'removal');
                }
                if ($p['stock'] <= $p['low'] && $day->lt($today)) {
                    $q = $p['target'] - $p['stock'];
                    $p['stock'] += $q;
                    $movement($pid, 'IN', $q, 'Restock from ' . $supNames[array_rand($supNames)],
                              $day->copy()->setTime(mt_rand(7, 9), mt_rand(0, 59)), $invActive);
                }
            }
            unset($p);

            if (count($orders) >= 1500) $flush();
            if ($day->month === 12 && $day->day === 31) $this->command->info('Finished ' . $day->year . " ($orderCount sales so far)");
        }
        $flush();

        foreach ($prod as $pid => $p) {
            DB::table('products')->where('product_id', $pid)->update(['stock_quantity' => max(0, $p['stock'])]);
        }

        $this->command->info("Done: $orderCount sales over 5 years.");
        $this->command->info("Store code: $code");
        $this->command->info('Password for every account: ' . self::PASSWORD);
        foreach ($staff as $s) $this->command->line("  {$s['role']}: {$s['email']}");
    }
}