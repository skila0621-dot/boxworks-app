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
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 2×2 '지금 단계' 위젯(전체 흐름 와이어프레임 10). 루틴을 하는 동안 지금 단계, 출발까지 남은 시간, 진행, 다음 단계, 확인 단추.
 * 확인은 알람의 '확인'과 같은 동작(남은 다시 알림 지우기)만 한다. 기록·점수는 없다(대표 결정 10/31).
 * 루틴이 없을 때는 다음 루틴을 보여 준다. 홈 화면에만 두므로 잠금 화면에는 보이지 않는다.
 * 자료는 박스웍스 화면이 넘긴 오늘·내일 루틴(BxWidgetProvider와 같은 저장소의 routines).
 */
public class BxNowWidget extends AppWidgetProvider {
    static final String ACTION_TICK = "kr.boxworks.app.NOW_TICK";

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        render(c, m, ids);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (intent != null && ACTION_TICK.equals(intent.getAction())) refresh(c);
    }

    @Override
    public void onDisabled(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(tickIntent(c));
    }

    static void refresh(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(c, BxNowWidget.class));
            if (ids != null && ids.length > 0) render(c, m, ids);
        } catch (Exception ignored) {
        }
    }

    private static String hm(long ms) {
        return new SimpleDateFormat("a h:mm", Locale.KOREA).format(new Date(ms));
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

    private static String mins(long ms) {
        long m = Math.max(0, Math.round(ms / 60000.0));
        if (m < 60) return m + "분";
        long h = m / 60, r = m % 60;
        return h + "시간" + (r > 0 ? " " + r + "분" : "");
    }

    static long endOf(JSONObject r) {
        long leave = r.optLong("leave", 0);
        if (leave > 0) return leave;
        JSONArray st = r.optJSONArray("steps");
        if (st == null || st.length() == 0) return r.optLong("from", 0);
        JSONObject last = st.optJSONObject(st.length() - 1);
        return last == null ? 0 : last.optLong("at", 0) + last.optLong("min", 5) * 60000L;
    }

    static void render(Context c, AppWidgetManager m, int[] ids) {
        long now = System.currentTimeMillis();
        JSONObject d = BxWidgetProvider.load(c);
        JSONArray rts = d.optJSONArray("routines");
        JSONObject active = null, upcoming = null;
        if (rts != null) {
            for (int i = 0; i < rts.length(); i++) {
                JSONObject r = rts.optJSONObject(i);
                if (r == null) continue;
                long from = r.optLong("from", 0), end = endOf(r);
                if (from <= now && now <= end && (active == null || from > active.optLong("from"))) active = r;
                if (from > now && (upcoming == null || from < upcoming.optLong("from"))) upcoming = r;
            }
        }
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_now_widget);
        Intent open = new Intent(c, MainActivity.class);
        // 시험판 48: '앱 열기' · 위젯 누르기는 홈 화면으로(대표 11/4 14:07)
        open.setAction(BxWidgetProvider.ACTION_HOME);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent openPi = PendingIntent.getActivity(c, 0x0B30, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.n_root, openPi);
        long nextTick = now + 15 * 60 * 1000L;

        if (active != null) {
            JSONArray st = active.optJSONArray("steps");
            JSONObject done = AlarmStore.loadDone(c);
            int cur = RoutineOngoing.currentIndex(st, now);
            JSONObject s = st.optJSONObject(cur);
            JSONObject nx = cur + 1 < st.length() ? st.optJSONObject(cur + 1) : null;
            long leave = active.optLong("leave", 0);
            v.setTextViewText(R.id.n_label, "지금 · " + active.optString("name", "루틴"));
            v.setTextViewText(R.id.n_step, s == null ? active.optString("name") : s.optString("n"));
            String left = leave > now ? "출발까지 " + mins(leave - now) : leave > 0 ? "출발할 시간" : "끝까지 " + mins(endOf(active) - now);
            v.setTextViewText(R.id.n_left, left);
            v.setViewVisibility(R.id.n_left, View.VISIBLE);
            v.setViewVisibility(R.id.n_prog, View.VISIBLE);
            v.setProgressBar(R.id.n_prog, st.length(), cur + 1, false);
            if (nx != null) {
                v.setTextViewText(R.id.n_next, "다음 " + hm(nx.optLong("at")) + " " + nx.optString("n"));
                v.setViewVisibility(R.id.n_next, View.VISIBLE);
                if (nx.optLong("at") < nextTick) nextTick = nx.optLong("at");
            } else {
                v.setViewVisibility(R.id.n_next, View.GONE);
            }
            boolean ok = RoutineOngoing.isDone(s, done);
            // 시험판 52(D-25): 확인 단추는 꼭 울림 단계(기상 · 약 · 출발)에만. 짧게 한 번 · 소리 없이 단계는 글만 보이고 단추는 '앱 열기'
            boolean must = s != null && "m".equals(s.optString("r", "m"));
            if (!must) {
                v.setTextViewText(R.id.n_ok, "앱 열기");
                v.setInt(R.id.n_ok, "setBackgroundResource", R.drawable.bx_widget_chip);
                v.setTextColor(R.id.n_ok, c.getResources().getColor(R.color.bx_w_ink, null));
                v.setOnClickPendingIntent(R.id.n_ok, openPi);
            } else if (ok) {
                v.setTextViewText(R.id.n_ok, "확인했어요");
                v.setInt(R.id.n_ok, "setBackgroundResource", R.drawable.bx_widget_chip);
                v.setTextColor(R.id.n_ok, c.getResources().getColor(R.color.bx_w_ink2, null));
                v.setOnClickPendingIntent(R.id.n_ok, openPi);
            } else {
                String okl = s.optString("ok", "");
                v.setTextViewText(R.id.n_ok, okl.isEmpty() ? "확인" : okl);
                v.setInt(R.id.n_ok, "setBackgroundResource", R.drawable.bx_widget_btn);
                v.setTextColor(R.id.n_ok, 0xFFFFFFFF);
                v.setOnClickPendingIntent(R.id.n_ok, confirmPi(c, s));
            }
            v.setViewVisibility(R.id.n_ok, View.VISIBLE);
            // 루틴 동안에는 남은 분을 맞추려고 1분마다 다시 그린다(화면이 켜져 있을 때만)
            long minute = now - (now % 60000L) + 60000L;
            if (minute < nextTick) nextTick = minute;
            long end = endOf(active) + 60000L;
            if (end < nextTick) nextTick = end;
        } else {
            v.setViewVisibility(R.id.n_prog, View.GONE);
            v.setViewVisibility(R.id.n_next, View.GONE);
            if (upcoming != null) {
                long from = upcoming.optLong("from");
                long dd = (dayStart(from) - dayStart(now)) / (24 * 3600 * 1000L);
                v.setTextViewText(R.id.n_label, "다음 루틴");
                v.setTextViewText(R.id.n_step, upcoming.optString("name", "루틴"));
                v.setTextViewText(R.id.n_left, (dd == 0 ? "오늘 " : dd == 1 ? "내일 " : "") + hm(from) + " 시작");
                v.setViewVisibility(R.id.n_left, View.VISIBLE);
                if (from < nextTick) nextTick = from;
            } else {
                v.setTextViewText(R.id.n_label, AlarmNotify.appName(c));
                v.setTextViewText(R.id.n_step, "예정된 루틴이 없어요");
                v.setViewVisibility(R.id.n_left, View.GONE);
            }
            v.setTextViewText(R.id.n_ok, "앱 열기");
            v.setInt(R.id.n_ok, "setBackgroundResource", R.drawable.bx_widget_chip);
            v.setTextColor(R.id.n_ok, c.getResources().getColor(R.color.bx_w_ink, null));
            v.setOnClickPendingIntent(R.id.n_ok, openPi);
            v.setViewVisibility(R.id.n_ok, View.VISIBLE);
        }
        m.updateAppWidget(ids, v);
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.set(AlarmManager.RTC, Math.max(now + 30000L, nextTick + 1000), tickIntent(c));
    }

    /** 위젯의 '확인': 알림의 확인과 같은 받는 곳(AlarmActionReceiver)으로 보낸다 */
    private static PendingIntent confirmPi(Context c, JSONObject step) {
        String series = step == null ? "" : step.optString("s");
        JSONObject o = new JSONObject();
        try {
            o.put("id", series);
            o.put("series", series);
            o.put("widget", true);
        } catch (Exception ignored) {
        }
        Intent i = new Intent(c, AlarmActionReceiver.class);
        i.setAction("kr.boxworks.app.ACT.ok." + series);
        i.putExtra(AlarmNotify.EXTRA_ACT, "ok");
        i.putExtra(AlarmStore.EXTRA_JSON, o.toString());
        return PendingIntent.getBroadcast(c, ("w" + series).hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent tickIntent(Context c) {
        Intent t = new Intent(c, BxNowWidget.class);
        t.setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(c, 0x0B31, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
