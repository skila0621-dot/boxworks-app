package kr.boxworks.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
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
 * 홈 화면 4×2 위젯 '오늘 일정'(전체 흐름 와이어프레임 10): 오늘 날짜·확인 필요·말하기, 시각·색이 있는 네 줄.
 * 박스웍스 화면이 앞으로 사흘의 일정과 알람 시각을 넘겨 두면(BxWidgetPlugin), 위젯은 지금 시각에 맞춰 고른다.
 * 앱을 열지 않아도 다음 일정 시각·끝 시각·15분마다 스스로 다시 그린다.
 */
public class BxWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "bx_widget";
    static final String KEY = "data";
    static final String ACTION_SPEAK = "kr.boxworks.app.SPEAK";
    static final String ACTION_TICK = "kr.boxworks.app.WIDGET_TICK";
    private static final long TICK_MS = 15 * 60 * 1000L;

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        render(c, m, ids);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (intent != null && ACTION_TICK.equals(intent.getAction())) refreshAll(c);
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

    private static String hm(long ms) {
        return new SimpleDateFormat("HH:mm", Locale.KOREA).format(new Date(ms));
    }

    private static long dayStart(long ms) {
        Calendar k = Calendar.getInstance();
        k.setTimeInMillis(ms);
        k.set(Calendar.HOUR_OF_DAY, 0);
        k.set(Calendar.MINUTE, 0);
        k.set(Calendar.SECOND, 0);
        k.set(Calendar.MILLISECOND, 0);
        return k.getTimeInMillis();
    }

    /** 오늘이면 시각만, 내일·모레면 앞에 붙인다. */
    private static String when(long at, long now) {
        long d = (dayStart(at) - dayStart(now)) / (24 * 3600 * 1000L);
        String p = d == 0 ? "" : d == 1 ? "내일 " : d == 2 ? "모레 " : new SimpleDateFormat("M/d ", Locale.KOREA).format(new Date(at));
        return p + hm(at);
    }

    private static String left(long ms) {
        long m = Math.max(1, Math.round(ms / 60000.0));
        if (m < 60) return m + "분 뒤";
        long h = m / 60, r = m % 60;
        return h + "시간" + (r > 0 ? " " + r + "분" : "") + " 뒤";
    }

    private static int color(String hex, int def) {
        try {
            return hex == null || hex.isEmpty() ? def : android.graphics.Color.parseColor(hex);
        } catch (Exception e) {
            return def;
        }
    }

    /**
     * 4×2 '오늘 일정'(전체 흐름 와이어프레임 10): 머리(오늘 날짜·확인 필요·말하기) + 네 줄.
     * 줄: 시각 | 색 막대 | 제목 | 오른쪽(진행 중·출발 시각·장소·완료). 오늘 지난 일 하나는 흐리게 남겨 지금 위치를 알 수 있게 한다.
     */
    static void render(Context c, AppWidgetManager m, int[] ids) {
        long now = System.currentTimeMillis();
        long today = dayStart(now);
        JSONObject d = load(c);
        List<JSONObject> past = new ArrayList<>(), up = new ArrayList<>();
        JSONArray items = d.optJSONArray("items");
        if (items != null) {
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.optJSONObject(i);
                if (o == null) continue;
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
        List<JSONObject> rows = new ArrayList<>();
        if (!past.isEmpty() && up.size() < 4) rows.add(past.get(past.size() - 1));
        for (JSONObject o : up) {
            if (rows.size() >= 4) break;
            rows.add(o);
        }

        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_widget);
        v.setTextViewText(R.id.w_head, "오늘 · " + new SimpleDateFormat("M월 d일 (E)", Locale.KOREAN).format(new Date(now)));
        int late = d.optInt("late", 0);
        if (late > 0) {
            v.setTextViewText(R.id.w_late, "확인 필요 " + late);
            v.setViewVisibility(R.id.w_late, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.w_late, View.GONE);
        }
        v.setViewVisibility(R.id.w_empty, rows.isEmpty() ? View.VISIBLE : View.GONE);
        int ink = c.getResources().getColor(R.color.bx_w_ink, null);
        int ink2 = c.getResources().getColor(R.color.bx_w_ink2, null);
        int dim = c.getResources().getColor(R.color.bx_w_dim, null);
        int accent = c.getResources().getColor(R.color.bx_w_accent, null);
        int[][] slots = {
            {R.id.w_r1_box, R.id.w_r1_t, R.id.w_r1_c, R.id.w_r1, R.id.w_r1_r},
            {R.id.w_r2_box, R.id.w_r2_t, R.id.w_r2_c, R.id.w_r2, R.id.w_r2_r},
            {R.id.w_r3_box, R.id.w_r3_t, R.id.w_r3_c, R.id.w_r3, R.id.w_r3_r},
            {R.id.w_r4_box, R.id.w_r4_t, R.id.w_r4_c, R.id.w_r4, R.id.w_r4_r}};
        for (int i = 0; i < slots.length; i++) {
            int[] sl = slots[i];
            JSONObject r = i < rows.size() ? rows.get(i) : null;
            if (r == null) {
                v.setViewVisibility(sl[0], View.GONE);
                continue;
            }
            v.setViewVisibility(sl[0], View.VISIBLE);
            long at = r.optLong("at", 0), end = r.optLong("end", at + 3600000L), go = r.optLong("go", 0);
            boolean done = r.optBoolean("done", false), gone = done || end <= now, live = !gone && at <= now;
            long dd = (dayStart(at) - today) / (24 * 3600 * 1000L);
            String pre = dd == 1 ? "내일 · " : dd == 2 ? "모레 · " : dd > 2 ? new SimpleDateFormat("M/d · ", Locale.KOREA).format(new Date(at)) : "";
            String right;
            if (done) right = "완료";
            else if (gone) right = "지남";
            else if (live) right = "진행 중";
            else if (go > now) right = hm(go) + " 출발";
            else right = r.optString("place", "");
            v.setTextViewText(sl[1], hm(at));
            v.setTextViewText(sl[3], pre + r.optString("title", ""));
            v.setTextViewText(sl[4], right);
            v.setTextColor(sl[1], gone ? dim : ink);
            v.setTextColor(sl[3], gone ? dim : ink);
            v.setTextColor(sl[4], live ? accent : gone ? dim : ink2);
            v.setInt(sl[2], "setBackgroundColor", gone ? 0xFFC9CED6 : color(r.optString("c"), accent));
        }

        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(c, 0x0B10, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        Intent speak = new Intent(c, MainActivity.class);
        speak.setAction(ACTION_SPEAK);
        speak.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        v.setOnClickPendingIntent(R.id.w_mic, PendingIntent.getActivity(c, 0x0B11, speak,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        m.updateAppWidget(ids, v);

        // 다음에 다시 그릴 때: 15분 뒤, 또는 그보다 먼저 오는 일정 시작·끝·출발, 자정
        long next = now + TICK_MS;
        for (JSONObject o : up) {
            long at = o.optLong("at", 0), end = o.optLong("end", 0), go = o.optLong("go", 0);
            if (at > now && at < next) next = at;
            if (end > now && end < next) next = end;
            if (go > now && go < next) next = go;
        }
        long midnight = today + 24 * 3600 * 1000L;
        if (midnight < next) next = midnight;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.set(AlarmManager.RTC, next + 1000, tickIntent(c));
    }

    private static PendingIntent tickIntent(Context c) {
        Intent t = new Intent(c, BxWidgetProvider.class);
        t.setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(c, 0x0B12, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
