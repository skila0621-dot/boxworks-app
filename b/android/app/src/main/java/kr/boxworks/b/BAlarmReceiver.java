package kr.boxworks.b;

import android.app.Notification;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/**
 * 예약한 시각이 되면(BScheduler). 울리기 전에 지금 계획으로 다시 본다(캘린더가 바뀌었는데 아직 다시 계획하지 못한 사이에
 * 엉뚱하게 울리지 않게). 잠금을 풀기 전이면 캘린더를 읽을 수 없어 알람에 실어 둔 요약으로 울린다(기기 보호 저장소).
 * 강한 알람: log rang → 붙잡기 다음 것 예약 → 소리 서비스 + 전체 화면 알람. 약한 알람: 알림 한 장. 끝나면 다시 계획.
 */
public class BAlarmReceiver extends BroadcastReceiver {
    private static final long MIN = 60 * 1000L;

    @Override
    public void onReceive(Context context, Intent intent) {
        final Context c = context.getApplicationContext() != null ? context.getApplicationContext() : context;
        final String action = intent == null ? "" : String.valueOf(intent.getAction());
        final String json = intent == null ? null : intent.getStringExtra(BScheduler.EXTRA_JSON);
        final PendingResult pr = goAsync();
        BEngine.bg(() -> {
            try {
                if (BScheduler.ACTION_TICK.equals(action)) {
                    tick(c);
                } else if (json != null) {
                    fire(c, BJson.parseObj(json));
                }
            } finally {
                pr.finish();
            }
        });
    }

    /** Android 16 진행 막대 고치기 */
    private static void tick(Context c) {
        long now = System.currentTimeMillis();
        BEngine.Plan p = BEngine.plan(c, now, now - 6 * BEngine.H, now + 48 * BEngine.H);
        if (p != null) BNotify.syncOngoing(c, p.entries, now, p.h24());
    }

    static void fire(Context c, JSONObject a) {
        String id = BJson.str(a, "id", "");
        String kind = BJson.str(a, "kind", "");
        String key = BJson.str(a, "key", "");
        int hold = (int) BJson.lng(a, "hold", 0);
        boolean test = BJson.bool(a, "test", false);
        BScheduler.forget(c, id);
        long now = System.currentTimeMillis();
        JSONObject settings = BStore.settings(c);
        boolean h24 = BJson.bool(settings, "h24", false);
        BPlanner.Entry e = null;
        BEngine.Plan p = null;
        if (!test) {
            p = BEngine.plan(c, now, now - 6 * BEngine.H, now + 48 * BEngine.H);
            if (p != null) {
                // 지금 계획으로 다시 본다. 울릴 차례가 아니면(약속이 바뀜 · 지워짐 · 이미 대답함) 울리지 않고 다시 계획만
                boolean ok = hold > 0 ? BEngine.holdValid(p.find(key), kind, now) : BEngine.due(p, kind, key, now);
                if (!ok) {
                    BEngine.replan(c, false);
                    return;
                }
                e = p.find(key);
            }
        }
        if (e == null && !"morning".equals(kind)) e = BEngine.fromSnap(a.optJSONObject("e"));
        if ("prep".equals(kind) || "leave".equals(kind) || "remind".equals(kind)) {
            ring(c, a, e, kind, key, hold, test, now, settings, h24);
        } else if ("heads".equals(kind) && e != null) {
            BNotify.heads(c, key, e, now, h24);
        } else if ("morning".equals(kind)) {
            String[] t = null;
            if (p != null) t = BText.morning(p.entries, BEngine.midnightOf(p, key), h24);
            else if (a.has("title")) t = new String[] { BJson.str(a, "title", ""), BJson.str(a, "body", "") };
            if (t != null) BNotify.morning(c, key.startsWith("day:") ? key.substring(4) : key, t[0], t[1]);
        }
        if (!test) BEngine.replan(c, false);
        BPlugin.emit("alarm", key);
    }

    private static void ring(Context c, JSONObject a, BPlanner.Entry e, String kind, String key, int hold, boolean test, long now,
                             JSONObject settings, boolean h24) {
        if (!test) {
            BStore.log(c, key, "rang", kind, hold > 0 ? (double) hold : null);
            nextHold(c, a, e, kind, key, hold, now, settings);
        }
        // 출발 알람이 울리면 앞 단계 알림은 치운다
        if ("leave".equals(kind)) {
            BNotify.dismiss(c, "prep", key);
            BNotify.dismiss(c, "heads", key);
        }
        JSONObject shown = BJson.copy(a);
        BJson.put(shown, "e", BEngine.snap(e));
        int nid = BNotify.alarmId(kind, key);
        Notification n = BNotify.alarm(c, shown, e, now, h24, false);
        Notification fallback = BNotify.alarm(c, shown, e, now, h24, true);
        boolean vibrateOnly = "vibrate".equals(BJson.str(settings, "sound", "alarm"));
        // 두 번째 울림(붙잡기)부터 소리 다음에 읽어 준다
        String say = hold > 0 ? BText.say(kind, e, now) : null;
        // 같은 자리의 알림을 새로 올려야 전체 화면 알람 · 위에서 내려오는 알림이 다시 뜬다
        BNotify.dismiss(c, kind, key);
        BRingService.start(c, nid, key, n, fallback, say, vibrateOnly);
        BAlarmActivity.update(shown);
    }

    /** 대답이 없으면 holdEvery분 뒤 다시(최대 holdMax번). prep은 출발 전까지, leave는 시작 전까지, remind는 시작+30분 전까지 */
    private static void nextHold(Context c, JSONObject a, BPlanner.Entry e, String kind, String key, int hold, long now, JSONObject settings) {
        double every = BJson.num(settings, "holdEvery", 3), max = BJson.num(settings, "holdMax", 3);
        if (every <= 0 || hold + 1 > max) return;
        long at = now + Math.round(every * MIN);
        double limit = "prep".equals(kind) ? BText.leaveAt(e) : "leave".equals(kind) ? e.start : e.start + 30 * MIN;
        if (at >= limit) return;
        JSONObject h = new JSONObject();
        BJson.put(h, "id", BEngine.holdId(kind, key, hold + 1));
        BJson.put(h, "key", key);
        BJson.put(h, "kind", kind);
        BJson.put(h, "at", at);
        BJson.put(h, "strong", true);
        BJson.put(h, "hold", hold + 1);
        BJson.put(h, "e", BEngine.snap(e));
        BScheduler.add(c, h);
    }
}
