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
 * 홈 화면 위젯(와이어프레임 4안-6): 다음 일정, 다음 알람, 이어지는 일정 두 개, 말하기 단추.
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
    }

    private static JSONObject load(Context c) {
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

    static void render(Context c, AppWidgetManager m, int[] ids) {
        long now = System.currentTimeMillis();
        JSONObject d = load(c);
        List<JSONObject> up = new ArrayList<>();
        JSONArray items = d.optJSONArray("items");
        if (items != null) {
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.optJSONObject(i);
                if (o != null && o.optLong("end", o.optLong("at", 0) + 3600000L) > now) up.add(o);
            }
        }
        long nextAlarm = 0;
        JSONArray alarms = d.optJSONArray("alarms");
        if (alarms != null) {
            for (int i = 0; i < alarms.length(); i++) {
                long t = alarms.optLong(i, 0);
                if (t > now && (nextAlarm == 0 || t < nextAlarm)) nextAlarm = t;
            }
        }

        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_widget);
        if (nextAlarm > 0) {
            v.setViewVisibility(R.id.w_alarm_box, View.VISIBLE);
            v.setTextViewText(R.id.w_alarm, when(nextAlarm, now));
        } else {
            v.setViewVisibility(R.id.w_alarm_box, View.GONE);
        }

        if (!up.isEmpty()) {
            JSONObject a = up.get(0);
            long at = a.optLong("at", 0), end = a.optLong("end", at + 3600000L), go = a.optLong("go", 0);
            v.setTextViewText(R.id.w_title, a.optString("title", "일정"));
            String sub;
            if (at <= now) sub = "지금 · " + hm(end) + "까지";
            else if (go > now) sub = when(at, now) + " · " + hm(go) + " 출발";
            else sub = when(at, now) + " · " + left(at - now);
            v.setTextViewText(R.id.w_sub, sub);
        } else {
            v.setTextViewText(R.id.w_title, "다가오는 일정이 없어요");
            v.setTextViewText(R.id.w_sub, "말하기 단추로 바로 넣어 보세요");
        }
        int[][] rows = {{R.id.w_r1_box, R.id.w_r1_t, R.id.w_r1}, {R.id.w_r2_box, R.id.w_r2_t, R.id.w_r2}};
        for (int i = 0; i < rows.length; i++) {
            JSONObject r = up.size() > i + 1 ? up.get(i + 1) : null;
            if (r == null) {
                v.setViewVisibility(rows[i][0], View.GONE);
                continue;
            }
            v.setViewVisibility(rows[i][0], View.VISIBLE);
            v.setTextViewText(rows[i][1], when(r.optLong("at", 0), now));
            v.setTextViewText(rows[i][2], r.optString("title", ""));
        }
        v.setViewVisibility(R.id.w_line, up.size() > 1 ? View.VISIBLE : View.GONE);

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

        // 다음에 다시 그릴 때: 15분 뒤, 또는 그보다 먼저 오는 일정 시작·끝, 알람 시각
        long next = now + TICK_MS;
        for (JSONObject o : up) {
            long at = o.optLong("at", 0), end = o.optLong("end", 0);
            if (at > now && at < next) next = at;
            if (end > now && end < next) next = end;
        }
        if (nextAlarm > now && nextAlarm < next) next = nextAlarm;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.set(AlarmManager.RTC, next + 1000, tickIntent(c));
    }

    private static PendingIntent tickIntent(Context c) {
        Intent t = new Intent(c, BxWidgetProvider.class);
        t.setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(c, 0x0B12, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
