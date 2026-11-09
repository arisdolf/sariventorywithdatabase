<?php

namespace Database\Seeders;

use App\Http\Controllers\AuthController;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SariSariSeeder extends Seeder
{
    const STORE = "Rudolf's Sari-Sari Store";
    const PASSWORD = '123123123'; // <- change this before running

    public function run(): void
    {
        mt_srand(2027); // same data every time
        DB::disableQueryLog();

        $emails = ['rudolfdee13@gmail.com', 'dolfdeearis@gmail.com', 'ty202500742@gmail.com', 'alugwapu12@gmail.com'];
        if (DB::table('users')->whereIn('email', $emails)->exists()) {
            $this->command->error('One of these emails already has an account. Run the cleanup SQL first.');
            return;
        }
        if (DB::table('stores')->where('name', self::STORE)->exists()) {
            $this->command->error('This store already exists. Run the cleanup SQL first.');
            return;
        }

        $today = Carbon::today();
        $now = Carbon::now();
        $start = $today->copy()->subYears(6)->subMonth();
        $days = (int) (($today->timestamp - $start->timestamp) / 86400);

        /* ---------- Store ---------- */
        $sid = DB::table('stores')->insertGetId([
            'name' => self::STORE, 'join_code' => AuthController::makeCode(),
            'store_type' => 'sari_sari', 'created_at' => $start,
        ]);
        $code = DB::table('stores')->where('store_id', $sid)->value('join_code');

        /* ---------- Team (edit names later on the Profile page) ---------- */
        // first, middle, last, role, months after opening, birthdate, email
        $defs = [
            ['Rudolf', null, 'Ariston', 'owner', 0, '2003-12-12', 'rudolfdee13@gmail.com'],
            ['Dolf', null, 'Aris', 'manager', 4, '2000-05-20', 'dolfdeearis@gmail.com'],
            ['Alex', null, 'Mendoza', 'inventory', 14, '1999-08-09', 'alugwapu12@gmail.com'],
            ['Tyrone', null, 'Santos', 'cashier', 26, '2002-02-27', 'ty202500742@wmsu.edu.ph'],
        ];
        $hash = Hash::make(self::PASSWORD);
        $staff = []; $acts = [];
        foreach ($defs as [$first, $mid, $last, $role, $m, $bd, $email]) {
            $joined = $start->copy()->addMonths($m)->setTime(9, 0);
            $name = trim(implode(' ', array_filter([$first, $mid, $last])));
            $id = DB::table('users')->insertGetId([
                'first_name' => $first, 'middle_name' => $mid, 'last_name' => $last, 'name' => $name,
                'email' => $email, 'email_verified_at' => $joined, 'birthdate' => $bd,
                'password_hash' => $hash, 'role' => $role, 'created_at' => $joined,
                'terms_accepted_at' => $joined, 'store_id' => $sid,
            ]);
            $staff[] = ['id' => $id, 'role' => $role, 'joined' => $joined, 'email' => $email];
            if ($role === 'owner') { DB::table('stores')->where('store_id', $sid)->update(['owner_id' => $id]); $ownerId = $id; }
            if ($role === 'manager') $managerId = $id;
            if ($role === 'inventory') { $invId = $id; $invJoined = $joined; }
            if ($role !== 'owner') {
                $acts[] = ['store_id' => $sid, 'user_id' => $id, 'action' => 'team', 'summary' => "$name joined the team", 'created_at' => $joined];
            }
        }

        /* ---------- Suppliers ---------- */
        $suppliers = [
            ['Davao Public Market Wholesale', 'Aling Rosa', '0917 555 0201', null, 'Bankerohan, Davao City'],
            ['Metro Beverage Distributors', 'Ramon Aquino', '0918 555 0202', 'orders@metrobev.example.com', 'Buhangin, Davao City'],
            ['Golden Harvest Foods', 'Liza Tan', '0919 555 0203', 'sales@goldenharvest.example.com', 'Toril, Davao City'],
            ['CleanHome Wholesale', 'Grace Uy', '0920 555 0204', null, 'Agdao, Davao City'],
            ['Mercury Health Supply', 'Nina Salazar', '0921 555 0205', 'nina@healthsupply.example.com', 'Matina, Davao City'],
            ['Bookmark School & Office Supply', 'Ben Ocampo', '0922 555 0206', null, 'Poblacion, Davao City'],
        ];
        $supNames = [];
        foreach ($suppliers as [$n, $c, $p, $e, $a]) {
            DB::table('suppliers')->insert(['store_id' => $sid, 'name' => $n, 'contact_person' => $c, 'phone' => $p,
                'email' => $e, 'address' => $a, 'created_at' => $start]);
            $supNames[] = $n;
        }

        /* ---------- Categories ---------- */
        $cats = [];
        foreach (['Drinks', 'Snacks', 'Noodles & Instant Food', 'Canned Goods', 'Rice & Cooking Essentials',
                  'Bread, Eggs & Dairy', 'Candy & Sweets', 'Frozen & Ice', 'Laundry & Cleaning',
                  'Personal Care', 'Medicines & First Aid', 'School Supplies', 'Household Items'] as $c) {
            $cats[$c] = DB::table('categories')->insertGetId(['store_id' => $sid, 'name' => $c]);
        }

        /* ---------- Products ---------- */
        // name, category, cost now, price now, popularity 1-10, expiry (0 none, 1 perishable, 2 slow)
        $list = [
            // Drinks
            ['Coke Mismo 295ml', 'Drinks', 12, 18, 10, 0], ['Sprite Mismo 295ml', 'Drinks', 12, 18, 8, 0],
            ['Royal Tru-Orange 295ml', 'Drinks', 12, 18, 7, 0], ['Coke 1.5L', 'Drinks', 62, 78, 5, 0],
            ['Bottled Water 350ml', 'Drinks', 7, 12, 9, 0], ['Bottled Water 500ml', 'Drinks', 9, 15, 9, 0],
            ['Bottled Water 1L', 'Drinks', 14, 22, 6, 0], ['C2 Green Tea Apple 230ml', 'Drinks', 14, 20, 7, 0],
            ['Zesto Orange 200ml', 'Drinks', 9, 14, 6, 0], ['Cobra Energy Drink 240ml', 'Drinks', 17, 25, 5, 0],
            ['Gatorade Blue 500ml', 'Drinks', 34, 48, 3, 0], ['Yakult (single)', 'Drinks', 9, 13, 4, 1],
            ['Nescafe 3-in-1 Original Sachet', 'Drinks', 6, 9, 9, 0], ['Great Taste White Sachet', 'Drinks', 6, 9, 8, 0],
            ['Kopiko Brown Sachet', 'Drinks', 6, 9, 7, 0], ['Milo 3-in-1 Sachet', 'Drinks', 9, 13, 7, 0],
            ['Tang Orange Sachet', 'Drinks', 9, 13, 5, 0],
            // Snacks
            ['Piattos Cheese 40g', 'Snacks', 17, 26, 8, 0], ['Nova Cheddar 40g', 'Snacks', 17, 26, 7, 0],
            ['Chippy BBQ 27g', 'Snacks', 8, 12, 8, 0], ['Oishi Prawn Crackers 24g', 'Snacks', 7, 11, 7, 0],
            ['Boy Bawang Cornick 100g', 'Snacks', 18, 26, 6, 0], ['Clover Chips 20g', 'Snacks', 7, 11, 6, 0],
            ['Chiz Curls 27g', 'Snacks', 8, 12, 5, 0], ['Skyflakes (single pack)', 'Snacks', 5, 8, 7, 0],
            ['Fita Crackers', 'Snacks', 6, 9, 5, 0], ['Rebisco Cream Sandwich', 'Snacks', 6, 9, 5, 0],
            ['Hansel Chocolate Sandwich', 'Snacks', 6, 9, 5, 0], ['Ding Dong Mixed Nuts', 'Snacks', 10, 15, 5, 0],
            ['Pillows Chocolate 28g', 'Snacks', 7, 10, 4, 0], ['Marty\'s Cracklin 90g', 'Snacks', 18, 26, 3, 0],
            // Noodles
            ['Lucky Me Pancit Canton Original', 'Noodles & Instant Food', 11, 16, 10, 0],
            ['Lucky Me Pancit Canton Chilimansi', 'Noodles & Instant Food', 11, 16, 8, 0],
            ['Lucky Me Instant Mami Beef', 'Noodles & Instant Food', 8, 12, 6, 0],
            ['Lucky Me Beef Na Beef Cup', 'Noodles & Instant Food', 22, 32, 5, 0],
            ['Nissin Cup Noodles Seafood', 'Noodles & Instant Food', 24, 35, 5, 0],
            ['Payless Pancit Canton', 'Noodles & Instant Food', 9, 13, 5, 0],
            ['Quaker Oats Sachet', 'Noodles & Instant Food', 9, 14, 3, 0],
            // Canned goods
            ['Century Tuna Flakes in Oil 155g', 'Canned Goods', 29, 40, 7, 2], ['555 Sardines Tomato 155g', 'Canned Goods', 19, 27, 7, 2],
            ['Ligo Sardines 155g', 'Canned Goods', 20, 28, 6, 2], ['Mega Sardines 155g', 'Canned Goods', 18, 26, 5, 2],
            ['Argentina Corned Beef 150g', 'Canned Goods', 34, 48, 5, 2], ['Purefoods Corned Beef 150g', 'Canned Goods', 40, 55, 3, 2],
            ['Alaska Evaporated Milk 410ml', 'Canned Goods', 38, 52, 4, 2], ['Hunt\'s Pork & Beans 230g', 'Canned Goods', 24, 34, 3, 2],
            ['Del Monte Tomato Sauce 200g', 'Canned Goods', 18, 26, 3, 2],
            // Rice & cooking
            ['Regular Rice (per kilo)', 'Rice & Cooking Essentials', 46, 55, 8, 0], ['Premium Rice (per kilo)', 'Rice & Cooking Essentials', 56, 68, 7, 0],
            ['Cooking Oil 250ml', 'Rice & Cooking Essentials', 28, 36, 7, 2], ['Cooking Oil 1L', 'Rice & Cooking Essentials', 110, 132, 4, 2],
            ['Datu Puti Vinegar 350ml', 'Rice & Cooking Essentials', 15, 22, 6, 0], ['Datu Puti Soy Sauce 350ml', 'Rice & Cooking Essentials', 15, 22, 6, 0],
            ['Rufina Patis 350ml', 'Rice & Cooking Essentials', 19, 28, 3, 0], ['Magic Sarap 8g', 'Rice & Cooking Essentials', 3.5, 5, 9, 0],
            ['Salt Iodized 500g', 'Rice & Cooking Essentials', 11, 17, 5, 0], ['White Sugar (per kilo)', 'Rice & Cooking Essentials', 72, 90, 5, 0],
            ['White Sugar (1/4 kilo)', 'Rice & Cooking Essentials', 17, 24, 7, 0], ['Brown Sugar (per kilo)', 'Rice & Cooking Essentials', 66, 82, 6, 0],
            ['Banana Ketchup 320g', 'Rice & Cooking Essentials', 24, 34, 4, 0], ['Mayonnaise 80ml', 'Rice & Cooking Essentials', 12, 18, 3, 0],
            ['Onion (per piece)', 'Rice & Cooking Essentials', 7, 10, 4, 1], ['Garlic (per head)', 'Rice & Cooking Essentials', 5, 8, 4, 1],
            // Bread, eggs, dairy
            ['Gardenia Classic White Loaf', 'Bread, Eggs & Dairy', 66, 84, 6, 1], ['Pandesal Pack (10pcs)', 'Bread, Eggs & Dairy', 24, 38, 8, 1],
            ['Eggs (per piece)', 'Bread, Eggs & Dairy', 8, 11, 9, 1], ['Bear Brand Sachet', 'Bread, Eggs & Dairy', 12, 17, 6, 0],
            ['Nestle Fresh Milk 1L', 'Bread, Eggs & Dairy', 98, 125, 3, 1], ['Eden Cheese 165g', 'Bread, Eggs & Dairy', 52, 70, 3, 1],
            ['Cheezee Spread Sachet', 'Bread, Eggs & Dairy', 8, 12, 3, 0],
            // Candy
            ['Maxx Menthol Candy', 'Candy & Sweets', 1, 2, 9, 0], ['Choc Nut', 'Candy & Sweets', 1.5, 2.5, 8, 0],
            ['Cloud 9 Chocolate Bar', 'Candy & Sweets', 8, 13, 7, 0], ['Haw Flakes Roll', 'Candy & Sweets', 6, 10, 4, 0],
            ['Choco Mucho Bar', 'Candy & Sweets', 9, 14, 5, 0], ['Mentos Roll', 'Candy & Sweets', 10, 15, 3, 0],
            ['Chupa Chups Lollipop', 'Candy & Sweets', 5, 8, 4, 0], ['Fudgee Barr', 'Candy & Sweets', 8, 12, 5, 0],
            // Frozen & ice
            ['Cornetto Cone', 'Frozen & Ice', 22, 32, 6, 1], ['Magnum Classic', 'Frozen & Ice', 42, 58, 3, 1],
            ['Ice Candy', 'Frozen & Ice', 3, 5, 8, 1], ['Ice Bag (small)', 'Frozen & Ice', 8, 15, 6, 0],
            ['Tender Juicy Hotdog 250g', 'Frozen & Ice', 58, 78, 4, 1], ['Hotdog (per piece)', 'Frozen & Ice', 7, 10, 5, 1],
            ['Skinless Longganisa 6pcs', 'Frozen & Ice', 40, 60, 3, 1],
            // Laundry & cleaning
            ['Surf Powder Sachet', 'Laundry & Cleaning', 8, 12, 8, 0], ['Tide Powder Sachet', 'Laundry & Cleaning', 8, 12, 6, 0],
            ['Ariel Powder Sachet', 'Laundry & Cleaning', 9, 13, 5, 0], ['Downy Fabric Conditioner Sachet', 'Laundry & Cleaning', 8, 12, 6, 0],
            ['Joy Dishwashing Liquid 250ml', 'Laundry & Cleaning', 42, 58, 4, 0], ['Zonrox Bleach 250ml', 'Laundry & Cleaning', 19, 28, 3, 0],
            ['Perla Soap Bar 90g', 'Laundry & Cleaning', 15, 22, 5, 0], ['Domex Toilet Cleaner 500ml', 'Laundry & Cleaning', 38, 55, 2, 0],
            ['Scouring Pad', 'Laundry & Cleaning', 7, 12, 3, 0], ['Trash Bags (small, 10pcs)', 'Laundry & Cleaning', 18, 28, 2, 0],
            // Personal care
            ['Safeguard Soap 85g', 'Personal Care', 29, 40, 5, 0], ['Head & Shoulders Sachet', 'Personal Care', 7, 11, 6, 0],
            ['Pantene Shampoo Sachet', 'Personal Care', 7, 11, 5, 0], ['Colgate Toothpaste 25g', 'Personal Care', 16, 24, 5, 0],
            ['Toothbrush', 'Personal Care', 22, 32, 3, 0], ['Rexona Deodorant Sachet', 'Personal Care', 6, 10, 4, 0],
            ['Modess Napkin 8s', 'Personal Care', 40, 56, 4, 0], ['Cotton Buds 100s', 'Personal Care', 20, 32, 2, 0],
            ['Alcohol 70% 60ml', 'Personal Care', 26, 40, 3, 0], ['Alcohol 70% 250ml', 'Personal Care', 55, 80, 3, 0],
            ['Disposable Razor', 'Personal Care', 10, 18, 3, 0],
            // Medicines (common over-the-counter items, sold per piece)
            ['Biogesic 500mg (per tablet)', 'Medicines & First Aid', 2.5, 4, 9, 2], ['Neozep Forte (per tablet)', 'Medicines & First Aid', 3.5, 6, 8, 2],
            ['Bioflu (per tablet)', 'Medicines & First Aid', 6, 9, 6, 2], ['Alaxan FR (per capsule)', 'Medicines & First Aid', 6, 9, 6, 2],
            ['Medicol Advance 400mg (per capsule)', 'Medicines & First Aid', 8, 12, 4, 2], ['Diatabs (per tablet)', 'Medicines & First Aid', 7, 10, 4, 2],
            ['Kremil-S (per tablet)', 'Medicines & First Aid', 6, 9, 5, 2], ['Strepsils Lozenge (per piece)', 'Medicines & First Aid', 8, 12, 5, 2],
            ['Cetirizine 10mg (per tablet)', 'Medicines & First Aid', 5, 8, 3, 2], ['Vitamin C (per tablet)', 'Medicines & First Aid', 6, 10, 4, 2],
            ['Hydrite Tablet', 'Medicines & First Aid', 12, 18, 2, 2], ['Vicks VapoRub 10g', 'Medicines & First Aid', 28, 40, 4, 2],
            ['Katinko Ointment', 'Medicines & First Aid', 12, 20, 3, 2], ['Efficascent Oil 25ml', 'Medicines & First Aid', 45, 65, 3, 2],
            ['Salonpas Patch (per piece)', 'Medicines & First Aid', 6, 10, 4, 2], ['Betadine Solution 15ml', 'Medicines & First Aid', 42, 60, 2, 2],
            ['Band-Aid (per piece)', 'Medicines & First Aid', 2, 4, 5, 0],
            // School supplies
            ['Notebook 80 leaves', 'School Supplies', 22, 35, 5, 0], ['Notebook 40 leaves', 'School Supplies', 14, 22, 6, 0],
            ['Pad Paper (intermediate)', 'School Supplies', 18, 28, 6, 0], ['Yellow Pad', 'School Supplies', 20, 30, 4, 0],
            ['Ballpen Blue', 'School Supplies', 5, 8, 9, 0], ['Ballpen Black', 'School Supplies', 5, 8, 8, 0],
            ['Pencil #2', 'School Supplies', 4, 7, 8, 0], ['Eraser', 'School Supplies', 4, 7, 6, 0],
            ['Sharpener', 'School Supplies', 5, 8, 5, 0], ['Ruler 12 inch', 'School Supplies', 6, 10, 4, 0],
            ['Scissors (small)', 'School Supplies', 18, 30, 2, 0], ['Glue (small bottle)', 'School Supplies', 10, 16, 4, 0],
            ['Crayons 8 colors', 'School Supplies', 22, 35, 3, 0], ['Colored Pencils 12 colors', 'School Supplies', 45, 70, 2, 0],
            ['Index Cards 25s', 'School Supplies', 8, 12, 3, 0], ['Long Brown Envelope', 'School Supplies', 4, 7, 3, 0],
            ['Bond Paper Short (per sheet)', 'School Supplies', 1, 2, 6, 0], ['Manila Paper', 'School Supplies', 5, 8, 3, 0],
            ['Plastic Folder Long', 'School Supplies', 7, 12, 3, 0], ['Scotch Tape (small)', 'School Supplies', 8, 14, 3, 0],
            ['Correction Tape', 'School Supplies', 18, 30, 3, 0], ['Permanent Marker', 'School Supplies', 15, 25, 3, 0],
            ['Highlighter', 'School Supplies', 12, 20, 2, 0], ['Clear Book Long', 'School Supplies', 28, 45, 2, 0],
            ['Staple Wire #35', 'School Supplies', 10, 16, 2, 0], ['Pencil Case', 'School Supplies', 25, 45, 2, 0],
            ['Cartolina', 'School Supplies', 8, 12, 2, 0],
            // Household
            ['Safety Matches (box)', 'Household Items', 1.5, 3, 5, 0], ['Lighter', 'Household Items', 10, 18, 4, 0],
            ['Candle (per piece)', 'Household Items', 4, 7, 3, 0], ['Eveready AA Battery 2pcs', 'Household Items', 42, 62, 3, 0],
            ['Tissue Roll (single)', 'Household Items', 12, 20, 5, 0], ['Mosquito Coil (per piece)', 'Household Items', 4, 7, 4, 0],
        ];

        $prod = [];
        foreach ($list as [$name, $cat, $cost, $price, $pop, $fresh]) {
            $target = max(24, 30 + $pop * 14);
            $low = max(5, (int) round($target * 0.25));
            $id = DB::table('products')->insertGetId([
                'store_id' => $sid, 'name' => $name, 'category_id' => $cats[$cat],
                'cost_price' => $cost, 'unit_price' => $price, 'stock_quantity' => $target,
                'low_stock' => $low, 'is_active' => 1, 'created_at' => $start,
            ]);
            $prod[$id] = ['name' => $name, 'cat' => $cat, 'price' => $price, 'ratio' => $cost / $price, 'pop' => $pop,
                          'fresh' => $fresh, 'target' => $target, 'low' => $low, 'stock' => $target];
        }
        $ids = array_keys($prod);

        // Seasons: school supplies peak May to August, cold drinks in summer, medicines in the rainy months
        $season = function (string $cat, int $m): float {
            if ($cat === 'School Supplies') return in_array($m, [5, 6, 7, 8]) ? 3.5 : ($m === 1 ? 1.2 : 0.5);
            if ($cat === 'Drinks' || $cat === 'Frozen & Ice') return in_array($m, [3, 4, 5]) ? 1.5 : (in_array($m, [12, 1]) ? 1.1 : (in_array($m, [7, 8, 9, 10]) ? 0.9 : 1.0));
            if ($cat === 'Medicines & First Aid') return $m >= 7 && $m <= 11 ? 1.6 : 1.0;
            return 1.0;
        };
        $cums = [];
        for ($m = 1; $m <= 12; $m++) {
            $c = []; $t = 0;
            foreach ($ids as $i) {
                $t += max(1, (int) round(pow($prod[$i]['pop'], 1.5) * 10 * $season($prod[$i]['cat'], $m)));
                $c[] = $t;
            }
            $cums[$m] = [$c, $t];
        }
        $pick = function (int $m) use ($ids, $cums) {
            [$c, $t] = $cums[$m];
            $r = mt_rand(1, $t); $lo = 0; $hi = count($c) - 1;
            while ($lo < $hi) { $mid = ($lo + $hi) >> 1; if ($r <= $c[$mid]) $hi = $mid; else $lo = $mid + 1; }
            return $ids[$lo];
        };
        $priceAt = function (array $p, Carbon $d) use ($today) {
            $f = pow(1.04, -(($today->timestamp - $d->timestamp) / 86400 / 365));
            return max(1, round($p['price'] * $f * 2) / 2);
        };

        /* ---------- Buffers ---------- */
        $orders = []; $items = []; $mv = [];
        $flush = function () use (&$orders, &$items, &$mv, &$acts) {
            foreach (array_chunk($orders, 800) as $c) DB::table('orders')->insert($c);
            foreach (array_chunk($items, 2000) as $c) DB::table('order_items')->insert($c);
            foreach (array_chunk($mv, 1500) as $c) DB::table('stock_movements')->insert($c);
            foreach (array_chunk($acts, 1000) as $c) DB::table('activity_log')->insert($c);
            $orders = $items = $mv = $acts = [];
        };
        $movement = function ($pid, $type, $qty, $remarks, $when, $uid, $refId = null, $refType = null) use (&$mv, $sid) {
            $mv[] = ['store_id' => $sid, 'user_id' => $uid, 'product_id' => $pid, 'type' => $type, 'quantity' => $qty,
                     'remarks' => $remarks, 'reference_id' => $refId, 'reference_type' => $refType, 'created_at' => $when];
        };
        $m = fn($n) => '₱' . number_format((float) $n, 2);

        foreach ($prod as $pid => $p) $movement($pid, 'IN', $p['target'], 'Opening stock', $start->copy()->setTime(8, 0), $ownerId);

        $hours = [5, 6, 6, 7, 7, 7, 8, 8, 9, 10, 11, 12, 12, 13, 14, 15, 16, 16, 17, 17, 18, 18, 18, 19, 19, 20, 20, 21];
        $oid = (int) DB::table('orders')->max('order_id') + 1;
        $orderCount = 0;

        /* ---------- Day by day ---------- */
        for ($i = 0; $i <= $days; $i++) {
            $day = $start->copy()->addDays($i);
            $prog = $i / max(1, $days);
            $month = (int) $day->month;
            $dayKey = 'd:' . $day->format('Y-m-d');

            // Who can ring up sales today: people who have joined (inventory cannot sell)
            $pool = [];
            foreach ($staff as $s) {
                if ($s['joined']->gt($day->copy()->endOfDay())) continue;
                $w = match ($s['role']) { 'cashier' => 6, 'manager' => 3, 'owner' => 5, default => 0 };
                for ($k = 0; $k < $w; $k++) $pool[] = $s['id'];
            }

            $dow = (int) $day->dayOfWeekIso;
            $n = 24 + $prog * 20;
            $n *= $dow >= 5 ? 1.15 : ($dow == 1 ? 0.92 : 1);
            if (in_array($day->day, [15, 30]) || $day->isLastOfMonth()) $n *= 1.3;
            if ($month === 12) $n *= 1.2;
            if (mt_rand(1, 100) <= 5) $n *= 0.8; // rainy day
            $n = (int) round($n * (0.88 + mt_rand(0, 24) / 100));

            $times = [];
            for ($o = 0; $o < $n; $o++) {
                $t = $day->copy()->setTime($hours[array_rand($hours)], mt_rand(0, 59), mt_rand(0, 59));
                if ($t->lte($now)) $times[] = $t;
            }
            usort($times, fn($a, $b) => $a->timestamp <=> $b->timestamp);
            $seq = 0;
            $recent = $day->diffInDays($today) <= 21;
            $recentMoves = $day->diffInDays($today) <= 60;

            foreach ($times as $when) {
                $cancelled = mt_rand(1, 100) === 1;
                $k = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4][mt_rand(0, 9)];
                $chosen = [];
                for ($t = 0; $t < $k * 4 && count($chosen) < $k; $t++) $chosen[$pick($month)] = true;

                $lines = []; $sum = 0;
                foreach (array_keys($chosen) as $pid) {
                    $price = $priceAt($prod[$pid], $day);
                    $qty = $price < 15 ? [1, 1, 2, 2, 3, 4, 5, 6][mt_rand(0, 7)] : [1, 1, 1, 2, 2, 3][mt_rand(0, 5)];
                    if (!$cancelled) {
                        $qty = min($qty, $prod[$pid]['stock']);
                        if ($qty <= 0) continue;
                    }
                    $lines[] = [$pid, $qty, $price, round($price * $prod[$pid]['ratio'], 2)];
                    $sum += $price * $qty;
                }
                if (!$lines) continue;
                $seq++;

                // Cash is common, e-wallets grow over the years
                $r = mt_rand(1, 100);
                $gcash = 2 + 28 * $prog; $maya = 1 + 6 * $prog;
                $method = $r <= $gcash ? 'gcash' : ($r <= $gcash + $maya ? 'maya' : ($r <= $gcash + $maya + 1 ? 'other' : 'cash'));
                if ($method === 'cash') {
                    $opts = [$sum, ceil($sum / 5) * 5, ceil($sum / 10) * 10, ceil($sum / 20) * 20, ceil($sum / 50) * 50, ceil($sum / 100) * 100];
                    $paid = max($sum, $opts[array_rand($opts)]);
                } else {
                    $paid = $sum;
                }

                $uid = $pool[array_rand($pool)];
                $orders[] = [
                    'order_id' => $oid, 'user_id' => $uid, 'order_date' => $when,
                    'status' => $cancelled ? 'cancelled' : 'completed', 'total_amount' => $sum, 'created_at' => $when,
                    'store_id' => $sid, 'payment_method' => $method, 'amount_paid' => $paid,
                    'order_no' => $seq, 'period_key' => $dayKey,
                ];
                foreach ($lines as [$pid, $qty, $price, $cost]) {
                    $items[] = ['order_id' => $oid, 'product_id' => $pid, 'quantity' => $qty,
                                'unit_price' => $price, 'subtotal' => $price * $qty, 'unit_cost' => $cost];
                    if (!$cancelled) {
                        $before = $prod[$pid]['stock'];
                        $prod[$pid]['stock'] -= $qty;
                        if ($recentMoves) $movement($pid, 'OUT', $qty, "Sale #$seq · " . $when->format('M j'), $when, $uid, $oid, 'order');
                        if ($recent && $before > $prod[$pid]['low'] && $prod[$pid]['stock'] <= $prod[$pid]['low']) {
                            $acts[] = ['store_id' => $sid, 'user_id' => $uid, 'action' => 'lowstock',
                                'summary' => "{$prod[$pid]['name']} is running low ({$prod[$pid]['stock']} left)", 'created_at' => $when];
                        }
                    }
                }
                if ($recent) {
                    $acts[] = ['store_id' => $sid, 'user_id' => $uid, 'action' => 'sale',
                        'summary' => "Sale #$seq · " . $m($sum) . ' · ' . count($lines) . ' item(s)', 'created_at' => $when];
                    if ($cancelled) {
                        $acts[] = ['store_id' => $sid, 'user_id' => $managerId, 'action' => 'void',
                            'summary' => "Voided sale #$seq (" . $m($sum) . ')', 'created_at' => $when->copy()->addMinutes(8)];
                    }
                }
                $oid++; $orderCount++;
            }

            // End of day: expired or damaged removals, then restocks
            $keeper = $invJoined->lte($day) ? $invId : $managerId;
            foreach ($prod as $pid => &$p) {
                $rate = $p['fresh'] === 1 ? 3 : ($p['fresh'] === 2 ? 0.3 : 0);
                if ($rate && $p['stock'] > 10 && mt_rand(1, 1000) <= $rate * 10) {
                    $q = min($p['stock'], mt_rand(1, $p['fresh'] === 1 ? 4 : 3));
                    $p['stock'] -= $q;
                    $movement($pid, 'OUT', $q, 'Expired', $day->copy()->setTime(20, 30), $keeper, null, 'removal');
                } elseif (mt_rand(1, 1000) <= 3 && $p['stock'] > 10) {
                    $p['stock'] -= 1;
                    $movement($pid, 'OUT', 1, 'Damaged: dropped on the floor', $day->copy()->setTime(14, 0), $keeper, null, 'removal');
                }
                if ($p['stock'] <= $p['low'] && $day->lt($today)) {
                    $q = $p['target'] - $p['stock'];
                    $p['stock'] += $q;
                    $movement($pid, 'IN', $q, 'Restock from ' . $supNames[array_rand($supNames)],
                              $day->copy()->setTime(mt_rand(7, 9), mt_rand(0, 59)), $keeper);
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

        $this->command->info("Done: $orderCount sales and " . count($prod) . ' products over 6 years.');
        $this->command->info("Store code: $code");
        $this->command->info('Password for all four accounts: ' . self::PASSWORD);
        foreach ($staff as $s) $this->command->line("  {$s['role']}: {$s['email']}");
    }
}