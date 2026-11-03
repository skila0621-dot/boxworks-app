package kr.boxworks.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.StyleSpan;
import android.view.View;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 홈 화면 4×2 위젯 '오늘 일정'. 박스웍스 화면이 앞으로 사흘의 일정과 알람 시각을 넘겨 두면(BxWidgetPlugin), 위젯은 지금 시각에 맞춰 고른다.
 * 앱을 열지 않아도 다음 일정 시각·끝 시각·15분마다 스스로 다시 그린다.
 * 시험판 36(대표 요청 11/3, 위젯 시안 A):
 * - 목록은 위아래로 밀어 끝까지 본다(ListView + BxWidgetService). 전에는 네 줄까지만 보였다
 * - 머리 줄 '루틴 포함 | 일정만'을 누르면 바뀌고, 위젯마다 따로 기억한다(시간표는 일정과 함께 보임)
 * - '일정 추가'는 새 일정 창(글자로), '말하기'는 새 일정 창 + 바로 듣기. 전에는 '일정 추가'가 바로 마이크였다
 * - 줄을 누르면 앱에서 그 일정(루틴은 루틴, 시간표는 시간표 화면)
 */
public class BxWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "bx_widget";
    static final String KEY = "data";
    static final String ACTION_SPEAK = "kr.boxworks.app.SPEAK";
    static final String ACTION_ADD = "kr.boxworks.app.ADD";
    static final String ACTION_OPEN = "kr.boxworks.app.OPEN_ROW";
    static final String ACTION_TICK = "kr.boxworks.app.WIDGET_TICK";
    static final String ACTION_FILTER = "kr.boxworks.app.WIDGET_FILTER";
    private static final long TICK_MS = 15 * 60 * 1000L;

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        render(c, m, ids);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (intent == null) return;
        if (ACTION_TICK.equals(intent.getAction())) refreshAll(c);
        if (ACTION_FILTER.equals(intent.getAction())) {
            int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (id == AppWidgetManager.INVALID_APPWIDGET_ID) return;
            c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("only_" + id, intent.getBooleanExtra("only", false)).apply();
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            if (m != null) render(c, m, new int[] {id});
        }
    }

    @Override
    public void onDeleted(Context c, int[] ids) {
        android.content.SharedPreferences.Editor e = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        for (int id : ids) e.remove("only_" + id);
        e.apply();
    }

    @Override
    public void onDisabled(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(tickIntent(c));
    }

    /** 화면이 넘긴 자료를 저장하고 위젯을 다시 그린다. */
    static void save(Context c, String json) {
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply();
        refreshAll(c);
    }

    static void refreshAll(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(c, BxWidgetProvider.class));
            if (ids != null && ids.length > 0) render(c, m, ids);
        } catch (Exception ignored) {
        }
        BxNowWidget.refresh(c);
    }

    static JSONObject load(Context c) {
        try {
            return new JSONObject(c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    /** 이 위젯이 '일정만'(루틴 빼고)인지 */
    static boolean onlyItems(Context c, int id) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("only_" + id, false);
    }

    static String hm(long ms) {
        return new SimpleDateFormat("HH:mm", Locale.KOREA).format(new Date(ms));
    }

    static long dayStart(long ms) {
        Calendar k = Calendar.getInstance();
        k.setTimeInMillis(ms);
        k.set(Calendar.HOUR_OF_DAY, 0);
        k.set(Calendar.MINUTE, 0);
        k.set(Calendar.SECOND, 0);
        k.set(Calendar.MILLISECOND, 0);
        return k.getTimeInMillis();
    }

    private static int color(String hex, int def) {
        try {
            return hex == null || hex.isEmpty() ? def : android.graphics.Color.parseColor(hex);
        } catch (Exception e) {
            return def;
        }
    }

    private static String dayLabel(long at, long today) {
        long dd = (dayStart(at) - today) / (24 * 3600 * 1000L);
        String date = new SimpleDateFormat("M/d (E)", Locale.KOREAN).format(new Date(at));
        return dd == 1 ? "내일 · " + date : dd == 2 ? "모레 · " + date : date;
    }

    /**
     * 목록에 넣을 줄(시각 순). 오늘 지난 일 하나는 다가오는 일이 적을 때(넷 미만) 흐리게 맨 위에 남겨 지금 위치를 알 수 있게 한다.
     * 내일 · 모레 일정 앞에는 '내일 · 11/4 (수)' 구분선({div: 글자}). only면 루틴을 뺀다.
     */
    static List<JSONObject> rows(JSONObject d, boolean only, long now) {
        long today = dayStart(now);
        List<JSONObject> past = new ArrayList<>(), up = new ArrayList<>();
        JSONArray items = d.optJSONArray("items");
        if (items != null) {
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.optJSONObject(i);
                if (o == null) continue;
                if (only && "routine".equals(o.optString("k"))) continue;
                long at = o.optLong("at", 0), end = o.optLong("end", at + 3600000L);
                boolean gone = o.optBoolean("done", false) || end <= now;
                if (gone) {
                    if (at >= today) past.add(o);
                } else {
                    up.add(o);
                }
            }
        }
        java.util.Comparator<JSONObject> byAt = (a, b) -> Long.compare(a.optLong("at"), b.optLong("at"));
        java.util.Collections.sort(up, byAt);
        java.util.Collections.sort(past, byAt);
        List<JSONObject> list = new ArrayList<>();
        if (!past.isEmpty() && up.size() < 4) list.add(past.get(past.size() - 1));
        list.addAll(up);
        List<JSONObject> out = new ArrayList<>();
        long prevDay = today;
        for (JSONObject o : list) {
            long at = o.optLong("at", 0), day = dayStart(at);
            if (day != today && day != prevDay) {
                JSONObject dv = new JSONObject();
                try {
                    dv.put("div", dayLabel(at, today));
                } catch (Exception ignored) {
                }
                out.add(dv);
            }
            prevDay = day;
            out.add(o);
        }
        return out;
    }

    /** 목록의 한 줄: 시각 | 색 막대 | 제목 | 오른쪽(지금 · 끝 시각 / 출발 시각 / 장소 / 완료) */
    static RemoteViews row(Context c, JSONObject r, long now) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_widget_row);
        long at = r.optLong("at", 0), end = r.optLong("end", at + 3600000L), go = r.optLong("go", 0);
        boolean done = r.optBoolean("done", false), gone = done || end <= now, live = !gone && at <= now;
        int ink = c.getResources().getColor(R.color.bx_w_ink, null);
        int ink2 = c.getResources().getColor(R.color.bx_w_ink2, null);
        int dim = c.getResources().getColor(R.color.bx_w_dim, null);
        int accent = c.getResources().getColor(R.color.bx_w_accent, null);
        String right;
        if (done) right = "완료";
        else if (gone) right = "지남";
        else if (live) right = "지금 · " + hm(end) + "까지";
        else if (go > now) right = hm(go) + " 출발";
        else right = r.optString("place", "");
        CharSequence rightCs = right;
        if (live) {
            SpannableString sp = new SpannableString(right);
            sp.setSpan(new StyleSpan(Typeface.BOLD), 0, sp.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            rightCs = sp;
        }
        v.setTextViewText(R.id.wr_t, hm(at));
        v.setTextViewText(R.id.wr_n, r.optString("title", ""));
        v.setTextViewText(R.id.wr_m, rightCs);
        v.setTextColor(R.id.wr_t, gone ? dim : live ? accent : ink);
        v.setTextColor(R.id.wr_n, gone ? dim : ink);
        v.setTextColor(R.id.wr_m, live ? accent : gone ? dim : ink2);
        v.setInt(R.id.wr_c, "setBackgroundColor", gone ? 0xFFC9CED6 : color(r.optString("c"), accent));
        v.setInt(R.id.wr_root, "setBackgroundResource", live ? R.drawable.bx_widget_live : 0);
        // 누르면 앱에서 그 일정(위젯의 줄 누르기 틀 BxWidgetProvider.build의 setPendingIntentTemplate에 채움)
        Intent fill = new Intent();
        fill.putExtra("k", r.optString("k", "item"));
        fill.putExtra("id", r.optString("id", ""));
        fill.putExtra("ds", new SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(new Date(at)));
        v.setOnClickFillInIntent(R.id.wr_root, fill);
        return v;
    }

    static RemoteViews divider(Context c, String text) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_widget_div);
        v.setTextViewText(R.id.wd_t, text);
        return v;
    }

    static void render(Context c, AppWidgetManager m, int[] ids) {
        long now = System.currentTimeMillis();
        long today = dayStart(now);
        JSONObject d = load(c);
        for (int wid : ids) {
            try {
                m.updateAppWidget(wid, build(c, d, wid, now));
            } catch (Exception ignored) {
            }
        }
        // 목록(BxWidgetService)도 지금 시각으로 다시 고르게 한다(지금 · 지남이 바뀜)
        try {
            m.notifyAppWidgetViewDataChanged(ids, R.id.w_list);
        } catch (Exception ignored) {
        }

        // 다음에 다시 그릴 때: 15분 뒤, 또는 그보다 먼저 오는 일정 시작·끝·출발, 자정
        long next = now + TICK_MS;
        JSONArray items = d.optJSONArray("items");
        if (items != null) {
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.optJSONObject(i);
                if (o == null) continue;
                long at = o.optLong("at", 0), end = o.optLong("end", 0), go = o.optLong("go", 0);
                if (at > now && at < next) next = at;
                if (end > now && end < next) next = end;
                if (go > now && go < next) next = go;
            }
        }
        long midnight = today + 24 * 3600 * 1000L;
        if (midnight < next) next = midnight;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.set(AlarmManager.RTC, next + 1000, tickIntent(c));
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, android.os.Bundle opts) {
        super.onAppWidgetOptionsChanged(c, m, id, opts);
        render(c, m, new int[] {id});
    }

    /** '루틴 포함 | 일정만' 한 칸: 골라진 쪽은 파란 바탕 흰 글자 */
    private static void seg(Context c, RemoteViews v, int id, boolean on) {
        v.setInt(id, "setBackgroundResource", on ? R.drawable.bx_widget_seg_on : 0);
        v.setTextColor(id, on ? 0xFFFFFFFF : c.getResources().getColor(R.color.bx_w_ink2, null));
    }

    private static PendingIntent filterPi(Context c, int wid, boolean only) {
        Intent t = new Intent(c, BxWidgetProvider.class);
        t.setAction(ACTION_FILTER);
        // 위젯마다 · 칸마다 다른 PendingIntent(값만 다른 인텐트는 같은 것으로 쳐서 덮어써짐)
        t.setData(Uri.parse("bxw://filter/" + wid + "/" + (only ? "only" : "all")));
        t.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, wid);
        t.putExtra("only", only);
        return PendingIntent.getBroadcast(c, 0x0B15, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent activityPi(Context c, int code, String action) {
        Intent i = new Intent(c, MainActivity.class);
        if (action != null) i.setAction(action);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static RemoteViews build(Context c, JSONObject d, int wid, long now) {
        boolean only = onlyItems(c, wid);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_widget);
        v.setTextViewText(R.id.w_head, new SimpleDateFormat("M월 d일 (E)", Locale.KOREAN).format(new Date(now)));
        // 확인 필요: '일정만'이면 지난 일정만 센다(루틴 단계는 뺌)
        int late = only ? d.optInt("lateI", d.optInt("late", 0)) : d.optInt("late", 0);
        if (late > 0) {
            v.setTextViewText(R.id.w_late, "확인 필요 " + late);
            v.setViewVisibility(R.id.w_late, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.w_late, View.GONE);
        }
        seg(c, v, R.id.w_f_all, !only);
        seg(c, v, R.id.w_f_only, only);
        v.setOnClickPendingIntent(R.id.w_f_all, filterPi(c, wid, false));
        v.setOnClickPendingIntent(R.id.w_f_only, filterPi(c, wid, true));

        // 목록: 위젯마다 다른 인텐트(데이터 주소에 위젯 번호)여야 휴대폰이 목록을 따로 만든다
        Intent svc = new Intent(c, BxWidgetService.class);
        svc.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, wid);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        v.setRemoteAdapter(R.id.w_list, svc);
        v.setEmptyView(R.id.w_list, R.id.w_empty);
        Intent open = new Intent(c, MainActivity.class);
        open.setAction(ACTION_OPEN);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        // 줄마다 채워 넣는 틀이라 바뀔 수 있어야 한다(안드로이드 12부터 FLAG_MUTABLE)
        int mut = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        v.setPendingIntentTemplate(R.id.w_list, PendingIntent.getActivity(c, 0x0B14, open, PendingIntent.FLAG_UPDATE_CURRENT | mut));

        v.setOnClickPendingIntent(R.id.w_root, activityPi(c, 0x0B10, null));
        v.setOnClickPendingIntent(R.id.w_head, activityPi(c, 0x0B10, null));
        // '일정 추가' = 새 일정 창(글자로), '말하기' = 새 일정 창 + 바로 듣기(대표 요청 11/3: 따로)
        v.setOnClickPendingIntent(R.id.w_add, activityPi(c, 0x0B13, ACTION_ADD));
        v.setOnClickPendingIntent(R.id.w_mic, activityPi(c, 0x0B11, ACTION_SPEAK));
        return v;
    }

    private static PendingIntent tickIntent(Context c) {
        Intent t = new Intent(c, BxWidgetProvider.class);
        t.setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(c, 0x0B12, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
