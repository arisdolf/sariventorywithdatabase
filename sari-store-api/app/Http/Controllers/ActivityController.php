<?php

namespace App\Http\Controllers;

use App\Support\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityController extends Controller
{
    public function index(Request $r)
    {
        $u = $r->user();
        abort_unless($u->hasPerm('activity'), 403, 'Only the owner and managers can see the activity center');
        $sid = $u->store_id;
        abort_unless($sid, 403, 'This account is not part of a store');

        $q = DB::table('activity_log as a')
            ->leftJoin('users as u', 'u.user_id', '=', 'a.user_id')
            ->where('a.store_id', $sid)
            ->orderByDesc('a.activity_id')->limit(41)
            ->selectRaw("a.activity_id id, a.action, a.summary, a.user_id uid, COALESCE(u.name,'Someone') who,
                DATE_FORMAT(a.created_at,'%b %e, %Y %l:%i %p') at");

        if ($b = (int) $r->query('before')) $q->where('a.activity_id', '<', $b);
        if ($uid = (int) $r->query('user')) $q->where('a.user_id', $uid);
        if (($t = $r->query('type')) && isset(Activity::GROUPS[$t])) $q->whereIn('a.action', Activity::GROUPS[$t]);

        $rows = $q->get()->all();
        $more = count($rows) > 40;

        return [
            'items' => array_slice($rows, 0, 40),
            'more' => $more,
            'members' => DB::select("SELECT user_id id, name FROM users WHERE store_id = ? ORDER BY name", [$sid]),
        ];
    }
}