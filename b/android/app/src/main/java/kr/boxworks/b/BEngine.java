package kr.boxworks.b;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 다시 계획(SPEC 6절): 저장 + 캘린더(지금−6시간 ~ 지금+48시간) → BPlanner.plan → alarms → 걸어 둔 목록과 비교해
 * 새것 · 바뀐 것만 걸고 사라진 것은 취소한다. 붙잡기는 그 약속이 아직 대답을 기다리는 동안만 남긴다.
 * 앱을 열지 않아도 캘린더가 바뀌면(BReplanJob) · 알람이 울리면 · 재부팅 뒤 · 6시간마다 돈다.
 */
final class BEngine {
    private BEngine() {}

    static final long H = 3600 * 1000L;
    static final long MIN = 60 * 1000L;
    private static final long SOON = (long) BPlanner.SOON;

    // ───────── 뒤에서 하는 일(한 줄로 차례대로) ─────────

    private static volatile Thread bgThread;
    private static final ExecutorService BG = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "b-engine");
        bgThread = t;
        return t;
    });

    static void bg(Runnable r) {
        BG.execute(() -> {
            try {
                r.run();
            } catch (Throwable ignored) {
                // 하나가 실패해도 다음 일은 계속한다
            }
        });
    }

    static boolean onBg() {
        return Thread.currentThread() == bgThread;
    }

    /** 뒤 스레드면 바로, 아니면 뒤로 넘긴다 */
    static void run(Runnable r) {
        if (onBg()) r.run();
        else bg(r);
    }

    // ───────── 계획 ─────────

    static final class Plan {
        long now;
        BPlanner.Input input;
        List<BPlanner.Entry> entries;
        JSONObject settings;
        private Map<String, BPlanner.Entry> byKey;

        BPlanner.Entry find(String key) {
            if (byKey == null) {
                byKey = new HashMap<>();
                for (BPlanner.Entry e : entries) byKey.put(e.key, e);
            }
            return key == null ? null : byKey.get(key);
        }

        boolean h24() {
            return BJson.bool(settings, "h24", false);
        }
    }

    /**
     * from~to 사이 약속의 계획. 잠금을 풀기 전이거나 캘린더를 읽다 실패하면 null(그때는 알람을 고치지 않는다).
     * 캘린더는 앞뒤로 하루씩 더 읽고(종일 일정 · 빠듯함 계산) from~to에 걸친 것만 남긴다
     */
    static Plan plan(Context c, long now, long from, long to) {
        if (!BStore.unlocked(c)) return null;
        JSONObject settings = BStore.settings(c);
        List<Map<String, Object>> events = new ArrayList<>();
        if (BCalendar.canRead(c)) {
            List<Map<String, Object>> raw = BCalendar.instances(c, from - 24 * H, to + 24 * H, calendarsOf(settings));
            if (raw == null) return null;
            for (Map<String, Object> m : raw) {
                long b = ((Number) m.get("begin")).longValue();
                Object eo = m.get("end");
                long en = eo instanceof Number ? ((Number) eo).longValue() : b;
                if (overlaps(b, en, from, to)) events.add(m);
            }
        }
        Map<String, Object> in = new HashMap<>();
        in.put("now", now);
        in.put("days", days(now, to));
        in.put("events", events);
        List<Object> items = new ArrayList<>();
        for (Object o : BJson.list(BStore.arr(c, BStore.ITEMS))) {
            if (!(o instanceof Map)) continue;
            Object at = ((Map<?, ?>) o).get("at"), end = ((Map<?, ?>) o).get("endAt");
            if (!(at instanceof Number)) continue;
            long b = ((Number) at).longValue();
            long en = end instanceof Number ? ((Number) end).longValue() : b;
            if (overlaps(b, en, from, to)) items.add(o);
        }
        in.put("items", items);
        in.put("settings", BJson.map(settings));
        in.put("overrides", BJson.map(BStore.obj(c, BStore.OVERRIDES)));
        in.put("places", BJson.map(BStore.obj(c, BStore.PLACES)));
        in.put("kw", BJson.map(BStore.obj(c, BStore.KW)));
        in.put("log", BJson.list(BStore.arr(c, BStore.LOG)));
        Plan p = new Plan();
        p.now = now;
        p.settings = settings;
        p.input = BPlanner.input(in);
        p.entries = BPlanner.plan(p.input);
        return p;
    }

    private static boolean overlaps(long b, long e, long from, long to) {
        return b < to && (b >= from || e > from);
    }

    static List<String> calendarsOf(JSONObject settings) {
        Object v = settings.opt("calendars");
        if (!(v instanceof JSONArray)) return null;
        List<String> out = new ArrayList<>();
        JSONArray a = (JSONArray) v;
        for (int i = 0; i < a.length(); i++) {
            Object x = a.opt(i);
            if (x instanceof String) out.add((String) x);
            else if (x instanceof Number) out.add(BPlanner.jsNum(((Number) x).doubleValue()));
        }
        return out;
    }

    /** 아침 요약을 볼 날: from이 든 날부터 to가 든 날까지의 자정(이 휴대폰 시간대) */
    static List<Object> days(long from, long to) {
        List<Object> out = new ArrayList<>();
        Calendar d = Calendar.getInstance();
        d.setTimeInMillis(from);
        d.set(Calendar.HOUR_OF_DAY, 0);
        d.set(Calendar.MINUTE, 0);
        d.set(Calendar.SECOND, 0);
        d.set(Calendar.MILLISECOND, 0);
        for (int i = 0; i < 10 && d.getTimeInMillis() <= to; i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ymd", String.format(Locale.ROOT, "%04d-%02d-%02d", d.get(Calendar.YEAR), d.get(Calendar.MONTH) + 1, d.get(Calendar.DAY_OF_MONTH)));
            m.put("midnight", d.getTimeInMillis());
            out.add(m);
            d.add(Calendar.DAY_OF_MONTH, 1);
            d.set(Calendar.HOUR_OF_DAY, 0);
        }
        return out;
    }

    // ───────── 다시 계획 ─────────

    /** 다시 계획하고 걸어 둔 알람 수를 돌려준다. force: 재부팅 · 시간 변경 뒤처럼 같은 알람도 모두 다시 건다 */
    static synchronized int replan(Context c, boolean force) {
        long now = System.currentTimeMillis();
        Plan p = plan(c, now, now - 6 * H, now + 48 * H);
        if (p == null) {
            // 캘린더를 읽지 못했다: 걸어 둔 것은 그대로(필요하면 다시 걸기만)
            if (force) BScheduler.rescheduleAll(c);
            return BScheduler.count(c);
        }
        List<BPlanner.Alarm> planned = BPlanner.alarms(p.entries, p.input);
        int count;
        synchronized (BStore.LOCK) {
            JSONArray stored = BScheduler.list(c);
            Set<String> plannedIds = new HashSet<>();
            for (BPlanner.Alarm a : planned) plannedIds.add(a.id);
            Map<String, JSONObject> kept = new HashMap<>();
            JSONArray next = new JSONArray();
            for (int i = 0; i < stored.length(); i++) {
                JSONObject s = stored.optJSONObject(i);
                if (s == null) continue;
                String id = BJson.str(s, "id", "");
                long at = BJson.lng(s, "at", 0);
                if (BJson.lng(s, "hold", 0) > 0) {
                    // 붙잡기: 그 약속이 아직 대답을 기다리면 그대로, 아니면 취소
                    if (holdValid(p.find(BJson.str(s, "key", "")), BJson.str(s, "kind", ""), at)) {
                        next.put(s);
                        if (force) BScheduler.set(c, s);
                    } else {
                        BScheduler.unset(c, id);
                    }
                    continue;
                }
                if (BJson.bool(s, "test", false)) {
                    if (at > now) {
                        next.put(s);
                        if (force) BScheduler.set(c, s);
                    }
                    continue;
                }
                if (plannedIds.contains(id)) kept.put(id, s);
                else BScheduler.unset(c, id);
            }
            for (BPlanner.Alarm a : planned) {
                JSONObject o = alarmJson(a, p);
                JSONObject s = kept.get(a.id);
                // '곧바로' 울릴 것은 앞서 걸어 둔 시각을 지킨다(다시 계획할 때마다 5초씩 밀리지 않게)
                if (s != null && a.at <= now + SOON) {
                    long sat = BJson.lng(s, "at", 0);
                    if (sat > now && sat <= a.at) BJson.put(o, "at", sat);
                }
                boolean same = s != null && s.toString().equals(o.toString());
                if (force || !same) BScheduler.set(c, o);
                next.put(o);
            }
            BScheduler.save(c, next);
            count = next.length();
        }
        BNotify.syncOngoing(c, p.entries, now, p.h24());
        return count;
    }

    /** 알람 목록 한 줄. 약속 요약(e)을 함께 두어 잠금을 풀기 전에도 글을 만든다. 아침 요약은 글을 미리 만들어 둔다 */
    static JSONObject alarmJson(BPlanner.Alarm a, Plan p) {
        JSONObject o = new JSONObject();
        BJson.put(o, "id", a.id);
        BJson.put(o, "key", a.key);
        BJson.put(o, "kind", a.kind);
        BJson.put(o, "at", Math.round(a.at));
        BJson.put(o, "strong", a.strong);
        BPlanner.Entry e = p.find(a.key);
        if (e != null) BJson.put(o, "e", snap(e));
        if ("morning".equals(a.kind)) {
            String[] t = BText.morning(p.entries, midnightOf(p, a.key), p.h24());
            if (t != null) {
                BJson.put(o, "title", t[0]);
                BJson.put(o, "body", t[1]);
            }
        }
        return o;
    }

    static double midnightOf(Plan p, String dayKey) {
        String ymd = dayKey != null && dayKey.startsWith("day:") ? dayKey.substring(4) : "";
        for (BPlanner.Day d : p.input.days) if (ymd.equals(d.ymd)) return d.midnight;
        return Double.NaN;
    }

    /** 붙잡기를 남길지: prep은 출발 전까지 · 아직 시작 안 함, leave는 약속 시작 전까지 · 아직 안 나감, remind는 시작+30분 전까지 · 아직 안 함 */
    static boolean holdValid(BPlanner.Entry e, String kind, double at) {
        if (e == null || e.off || e.allDay) return false;
        if ("prep".equals(kind)) return e.out && "idle".equals(e.state) && e.leaveAt != null && at < e.leaveAt;
        if ("leave".equals(kind)) return e.out && !"left".equals(e.state) && at < e.start;
        if ("remind".equals(kind)) return !e.out && !"done".equals(e.state) && at < e.start + 30 * MIN;
        return false;
    }

    /** 이 약속 · 단계가 from 뒤에 이미 울렸는지(붙잡기 울림은 빼고) */
    private static boolean rangSince(Plan p, String key, String kind, double from) {
        for (BPlanner.LogEntry l : p.input.log) {
            if (key.equals(l.key) && "rang".equals(l.act) && kind.equals(l.kind) && l.n == null && l.t >= from) return true;
        }
        return false;
    }

    /**
     * 울릴 때 다시 본다: 캘린더가 바뀌었는데 아직 다시 계획하지 못한 사이에 울리는 것을 막는다.
     * 그 단계가 지금(조금 이르게 울린 것까지) 울릴 차례이고, 이 시각으로는 아직 안 울렸을 때만 true
     */
    static boolean due(Plan p, String kind, String key, long now) {
        if ("morning".equals(kind)) return morningDue(p, key, now);
        BPlanner.Entry e = p.find(key);
        if (e == null || e.off || e.allDay) return false;
        long early = 90 * 1000L;
        switch (kind) {
            case "prep":
                return e.out && "idle".equals(e.state) && e.prepAt != null && e.leaveAt != null && e.prepAt <= now + early && now < e.leaveAt
                    && !rangSince(p, key, "prep", e.prepAt - SOON);
            case "leave":
                return e.out && !"left".equals(e.state) && e.leaveAt != null && e.leaveAt <= now + early && now < e.start
                    && !rangSince(p, key, "leave", e.leaveAt - SOON);
            case "heads":
                return e.out && !"left".equals(e.state) && e.headsAt != null && e.leaveAt != null && Math.abs(now - e.headsAt) <= 10 * MIN && now < e.leaveAt;
            case "remind": {
                double at = e.start + e.snRemind * MIN;
                return "own".equals(e.src) && !e.out && !"done".equals(e.state) && at <= now + early && now <= Math.max(at + 10 * MIN, e.start + 30 * MIN)
                    && !rangSince(p, key, "remind", at - SOON);
            }
            default:
                return false;
        }
    }

    private static boolean morningDue(Plan p, String dayKey, long now) {
        double mid = midnightOf(p, dayKey);
        if (Double.isNaN(mid)) return false;
        if (BText.morning(p.entries, mid, p.h24()) == null) return false;
        double first = Double.POSITIVE_INFINITY;
        for (BPlanner.Entry e : p.entries) {
            if (!e.off && !e.allDay && e.out && e.start >= mid && e.start < mid + 1440 * MIN && e.prepAt != null) first = Math.min(first, e.prepAt);
        }
        return now < first;
    }

    // ───────── 약속 요약(알람에 실어 두는 것) ─────────

    static JSONObject snap(BPlanner.Entry e) {
        JSONObject o = new JSONObject();
        BJson.put(o, "key", e.key);
        BJson.put(o, "src", e.src);
        BJson.put(o, "title", e.title);
        BJson.put(o, "place", e.place);
        BJson.put(o, "start", BPlanner.num(e.start));
        BJson.put(o, "end", BPlanner.num(e.end));
        BJson.put(o, "out", e.out);
        BJson.put(o, "prep", BPlanner.num(e.prep));
        BJson.put(o, "travel", BPlanner.num(e.travel));
        BJson.put(o, "buffer", BPlanner.num(e.buffer));
        BJson.put(o, "snoozed", BPlanner.num(e.snoozed));
        BJson.put(o, "snRemind", BPlanner.num(e.snRemind));
        BJson.put(o, "prepAt", BPlanner.num(e.prepAt));
        BJson.put(o, "leaveAt", BPlanner.num(e.leaveAt));
        BJson.put(o, "headsAt", BPlanner.num(e.headsAt));
        BJson.put(o, "startedAt", BPlanner.num(e.startedAt));
        BJson.put(o, "state", e.state);
        return o;
    }

    static BPlanner.Entry fromSnap(JSONObject s) {
        BPlanner.Entry e = new BPlanner.Entry();
        if (s == null) s = new JSONObject();
        e.key = BJson.str(s, "key", "");
        e.src = BJson.str(s, "src", "cal");
        e.title = BJson.str(s, "title", "");
        e.place = BJson.str(s, "place", "");
        e.start = BJson.num(s, "start", 0);
        e.end = nullable(s, "end");
        e.out = BJson.bool(s, "out", true);
        e.prep = BJson.num(s, "prep", 30);
        e.travel = BJson.num(s, "travel", 30);
        e.buffer = BJson.num(s, "buffer", 10);
        e.snoozed = BJson.num(s, "snoozed", 0);
        e.snRemind = BJson.num(s, "snRemind", 0);
        e.prepAt = nullable(s, "prepAt");
        e.leaveAt = nullable(s, "leaveAt");
        e.headsAt = nullable(s, "headsAt");
        e.startedAt = nullable(s, "startedAt");
        e.state = BJson.str(s, "state", "idle");
        return e;
    }

    private static Double nullable(JSONObject s, String k) {
        Object v = s.opt(k);
        return v instanceof Number ? ((Number) v).doubleValue() : null;
    }

    /** 지금 계획에서 그 약속(없으면 알람에 실어 둔 요약) */
    static BPlanner.Entry entryNow(Context c, String key, JSONObject snapFallback) {
        if (key != null && !key.startsWith("test:")) {
            long now = System.currentTimeMillis();
            Plan p = plan(c, now, now - 6 * H, now + 48 * H);
            if (p != null) {
                BPlanner.Entry e = p.find(key);
                if (e != null) return e;
            }
        }
        return snapFallback == null ? null : fromSnap(snapFallback);
    }

    // ───────── 권한 · 통계 ─────────

    /** {notif, exact, fullscreen, battery, calendar, mic} 각각 "ok" · "no" · "na" */
    static JSONObject perms(Context c) {
        JSONObject r = new JSONObject();
        boolean notif = NotificationManagerCompat.from(c).areNotificationsEnabled();
        if (Build.VERSION.SDK_INT >= 33) notif = notif && granted(c, Manifest.permission.POST_NOTIFICATIONS);
        BJson.put(r, "notif", notif ? "ok" : "no");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            BJson.put(r, "exact", am != null && am.canScheduleExactAlarms() ? "ok" : "no");
        } else {
            BJson.put(r, "exact", "na");
        }
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            BJson.put(r, "fullscreen", nm != null && nm.canUseFullScreenIntent() ? "ok" : "no");
        } else {
            BJson.put(r, "fullscreen", "na");
        }
        PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        BJson.put(r, "battery", pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName()) ? "ok" : "no");
        BJson.put(r, "calendar", granted(c, Manifest.permission.READ_CALENDAR) ? "ok" : "no");
        BJson.put(r, "mic", granted(c, Manifest.permission.RECORD_AUDIO) ? "ok" : "no");
        return r;
    }

    static boolean granted(Context c, String perm) {
        return ContextCompat.checkSelfPermission(c, perm) == PackageManager.PERMISSION_GRANTED;
    }

    /** 시험판 번호(빌드 번호 = versionCode) */
    static long trial(Context c) {
        try {
            PackageInfo pi = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return pi.getLongVersionCode();
            return legacyVersionCode(pi);
        } catch (Exception e) {
            return 0;
        }
    }

    @SuppressWarnings("deprecation")
    private static long legacyVersionCode(PackageInfo pi) {
        return pi.versionCode;
    }

    /**
     * 최근 days일 기록 요약 {rang, started, prepToStart:{median, n}, snoozes, late:{count, leadMedian}, left:{onTime, late}}.
     * rang: 준비 시작 알람이 처음 울린 수(붙잡기 제외), started: 시작한 약속 수, prepToStart: 처음 울림 → 시작(분),
     * late.leadMedian: 늦는다고 알린 때가 약속 시작보다 몇 분 앞이었는지, left: 나갈 때 늦을 참이었는지(나갔어요 기록의 n)
     */
    static JSONObject stats(Context c, double days) {
        long now = System.currentTimeMillis();
        double since = days > 0 ? now - days * 24 * H : Double.NEGATIVE_INFINITY;
        List<BPlanner.LogEntry> log = BPlanner.log(BJson.list(BStore.arr(c, BStore.LOG)));
        Map<String, Double> itemsAt = new HashMap<>();
        for (BPlanner.Item it : BPlanner.items(BJson.list(BStore.arr(c, BStore.ITEMS)))) itemsAt.put("o:" + it.id, it.at);
        int rang = 0, snoozes = 0, lateCount = 0, leftOnTime = 0, leftLate = 0;
        Map<String, Double> firstRang = new HashMap<>(), started = new LinkedHashMap<>();
        List<Double> leads = new ArrayList<>();
        for (BPlanner.LogEntry e : log) {
            if (!(e.t >= since) || e.key == null || e.key.startsWith("test:")) continue;
            String act = e.act == null ? "" : e.act;
            if ("rang".equals(act) && "prep".equals(e.kind) && e.n == null) {
                rang++;
                if (!firstRang.containsKey(e.key)) firstRang.put(e.key, e.t);
            } else if ("start".equals(act)) {
                started.put(e.key, e.t);
            } else if ("undo".equals(act) && "start".equals(e.kind)) {
                started.remove(e.key);
            } else if ("snooze".equals(act)) {
                snoozes++;
            } else if ("late".equals(act)) {
                lateCount++;
                Double st = startOf(e.key, itemsAt);
                if (st != null) leads.add((double) Math.round((st - e.t) / MIN));
            } else if ("left".equals(act) && e.n != null) {
                if (e.n > 0) leftLate++;
                else leftOnTime++;
            }
        }
        List<Double> waits = new ArrayList<>();
        for (Map.Entry<String, Double> s : started.entrySet()) {
            Double r = firstRang.get(s.getKey());
            if (r != null && s.getValue() >= r) waits.add((double) Math.round((s.getValue() - r) / MIN));
        }
        JSONObject o = new JSONObject();
        BJson.put(o, "rang", rang);
        BJson.put(o, "started", started.size());
        JSONObject pts = new JSONObject();
        BJson.put(pts, "median", BPlanner.num(median(waits)));
        BJson.put(pts, "n", waits.size());
        BJson.put(o, "prepToStart", pts);
        BJson.put(o, "snoozes", snoozes);
        JSONObject late = new JSONObject();
        BJson.put(late, "count", lateCount);
        BJson.put(late, "leadMedian", BPlanner.num(median(leads)));
        BJson.put(o, "late", late);
        JSONObject left = new JSONObject();
        BJson.put(left, "onTime", leftOnTime);
        BJson.put(left, "late", leftLate);
        BJson.put(o, "left", left);
        return o;
    }

    /** 약속 시작 시각: 캘린더 약속은 key(c:<id>:<시작>)에, 이 앱 것은 목록에 있다 */
    private static Double startOf(String key, Map<String, Double> itemsAt) {
        if (key.startsWith("c:")) {
            int i = key.lastIndexOf(':');
            try {
                return Double.parseDouble(key.substring(i + 1));
            } catch (Exception e) {
                return null;
            }
        }
        return itemsAt.get(key);
    }

    private static Double median(List<Double> v) {
        if (v.isEmpty()) return null;
        List<Double> s = new ArrayList<>(v);
        Collections.sort(s);
        int n = s.size();
        return n % 2 == 1 ? s.get((n - 1) / 2) : (s.get(n / 2 - 1) + s.get(n / 2)) / 2;
    }

    /** 이 약속의 붙잡기 알람(prep:키#h1 …) id */
    static String holdId(String kind, String key, int n) {
        return kind + ":" + key + "#h" + n;
    }

}
