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
import android.text.style.StrikethroughSpan;
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
 * 홈 화면 4×2 위젯 '오늘 일정'. 박스웍스 화면이 앞뒤 며칠의 일정을 넘겨 두면(BxWidgetPlugin), 위젯은 지금 시각에 맞춰 그린다.
 * 앱을 열지 않아도 다음 일정 시각 · 끝 시각 · 15분마다 스스로 다시 그린다.
 * 시험판 36(대표 결정 11/3 17:01):
 * - 그날 일정만. ‹ ›로 하루씩, 날짜를 누르면 오늘. 넘겨 둔 지 10분이 지나면 저절로 오늘
 * - 목록은 위아래로 밀어 끝까지(ListView + BxWidgetService). 그릴 때 지금 시각 바로 앞 일정부터 보이게
 * - 맨 위 한 줄 가운데 정렬: 말하기 · ‹ 날짜 › · 새 일정. 새 일정 · 말하기는 보고 있는 날짜로
 * - 줄은 시각 · 색 막대 · 제목(하는 중이면 '지금'). '루틴 포함 / 일정만'은 앱 설정(자료의 only)
 * - 줄을 누르면 앱에서 그 일정(루틴은 루틴, 시간표는 시간표 화면)
 */
public class BxWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "bx_widget";
    static final String KEY = "data";
    static final String ACTION_SPEAK = "kr.boxworks.app.SPEAK";
    static final String ACTION_ADD = "kr.boxworks.app.ADD";
    static final String ACTION_OPEN = "kr.boxworks.app.OPEN_ROW";
    // ✎ 메모(시험판 41, 대표 요청 11/3 23:38): 앱의 메모 화면을 열고 바로 적기
    static final String ACTION_MEMO = "kr.boxworks.app.MEMO";
    /** 시험판 48(대표 11/4 14:07): 위젯을 눌러 앱을 열면 보던 화면이 아니라 홈 화면으로 */
    static final String ACTION_HOME = "kr.boxworks.app.W_HOME";
    static final String ACTION_TICK = "kr.boxworks.app.WIDGET_TICK";
    static final String ACTION_DAY = "kr.boxworks.app.WIDGET_DAY";
    private static final long DAY_MS = 24 * 3600 * 1000L;
    private static final long BACK_MS = 10 * 60 * 1000L;
    private static final long TICK_MS = 15 * 60 * 1000L;
    /** 줄 표시(시험판 57, 대표 11/5 선택실 3): 위 가는 선 · 연보라 바탕 · 곧 시작(오른쪽 남은 시간) */
    static final int M_LINE = 1, M_BG = 2, M_NEXT = 4;

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        render(c, m, ids);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (intent == null) return;
        if (ACTION_TICK.equals(intent.getAction())) refreshAll(c);
        if (ACTION_DAY.equals(intent.getAction())) {
            int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (id == AppWidgetManager.INVALID_APPWIDGET_ID) return;
            int step = intent.getIntExtra("step", 0);
            long now = System.currentTimeMillis(), today = dayStart(now);
            long cur = step == 0 ? today : dayOf(c, id, now);
            long day = step == 0 ? today : dayStart(cur + step * DAY_MS + 3 * 3600 * 1000L);
            JSONObject d = load(c);
            long lo = today - d.optInt("back", 7) * DAY_MS, hi = today + d.optInt("ahead", 14) * DAY_MS;
            if (day < lo) day = lo;
            if (day > hi) day = hi;
            c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putLong("day_" + id, day).putLong("dayAt_" + id, now).apply();
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            if (m != null) render(c, m, new int[] {id});
        }
    }

    @Override
    public void onDeleted(Context c, int[] ids) {
        android.content.SharedPreferences.Editor e = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        for (int id : ids) { e.remove("day_" + id); e.remove("dayAt_" + id); }
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

    /** 일정만(루틴 빼고) 볼지: 앱 ⋯ › 위젯 추가 화면의 스위치(자료의 only) */
    static boolean onlyItems(JSONObject d) {
        return d.optBoolean("only", false);
    }

    /** 이 위젯이 보는 날(그날 0시). ‹ ›로 넘긴 지 10분이 지났거나 날이 바뀌어 범위를 벗어나면 오늘 */
    static long dayOf(Context c, int id, long now) {
        android.content.SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long day = sp.getLong("day_" + id, 0), at = sp.getLong("dayAt_" + id, 0), today = dayStart(now);
        if (day == 0 || now - at > BACK_MS || Math.abs(day - today) > 31 * DAY_MS) return today;
        return day;
    }

    static String hm(long ms) {
        return new SimpleDateFormat("a h:mm", Locale.KOREA).format(new Date(ms));
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

    /**
     * 그날 목록(시각 순, 종일 일정이 맨 위). only면 루틴을 뺀다.
     */
    static List<JSONObject> rows(JSONObject d, boolean only, long day) {
        List<JSONObject> list = new ArrayList<>();
        JSONArray items = d.optJSONArray("items");
        if (items != null) {
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.optJSONObject(i);
                if (o == null) continue;
                if (only && "routine".equals(o.optString("k"))) continue;
                long at = o.optLong("at", 0);
                if (at < day || at >= day + DAY_MS) continue;
                list.add(o);
            }
        }
        java.util.Collections.sort(list, (a, b) -> {
            boolean x = a.optBoolean("allDay", false), y = b.optBoolean("allDay", false);
            if (x != y) return x ? -1 : 1;
            return Long.compare(a.optLong("at"), b.optLong("at"));
        });
        return list;
    }

    /** 오늘이면 지금 시각 바로 앞 일정부터 보이게: 아직 안 끝난 첫 줄의 하나 위(종일 일정은 건너뜀) */
    static int scrollTo(List<JSONObject> rows, long day, long now) {
        if (day != dayStart(now)) return 0;
        for (int i = 0; i < rows.size(); i++) {
            JSONObject o = rows.get(i);
            if (o.optBoolean("allDay", false)) continue;
            long at = o.optLong("at", 0), end = o.optLong("end", at + 3600000L);
            if (end > now && !o.optBoolean("done", false)) return Math.max(0, i - 1);
        }
        return Math.max(0, rows.size() - 3);
    }

    /**
     * 줄마다 표시(시험판 57, 대표 11/5 선택실 3 'A' · '다' · 메모).
     * - 바탕(연보라): 하는 중인 일정. 하는 중인 일정이 없으면 곧 시작할 일정 한 줄(앱 홈 목록과 같은 규칙)
     * - 곧 시작: 오늘 아직 시작 안 한 첫 일정. 오른쪽에 남은 시간('16분 뒤')
     * - 위 가는 선: 첫 줄이 아니고, 이 줄과 바로 위 줄에 바탕이 없을 때(바탕이 줄을 나눠 준다)
     */
    static int[] marks(List<JSONObject> rows, long day, long now) {
        int n = rows.size();
        int[] m = new int[n];
        boolean today = day == dayStart(now), anyLive = false;
        int next = -1;
        for (int i = 0; i < n; i++) {
            JSONObject o = rows.get(i);
            if (o.optBoolean("allDay", false) || o.optBoolean("done", false)) continue;
            long at = o.optLong("at", 0), end = o.optLong("end", at + 3600000L);
            if (at <= now && end > now) { m[i] |= M_BG; anyLive = true; }
            else if (today && at > now && next < 0) next = i;
        }
        if (next >= 0) { m[next] |= M_NEXT; if (!anyLive) m[next] |= M_BG; }
        for (int i = 1; i < n; i++) if ((m[i] & M_BG) == 0 && (m[i - 1] & M_BG) == 0) m[i] |= M_LINE;
        return m;
    }

    /** 남은 시간: 앱의 untilText와 같은 말('16분 뒤' · '1시간 20분 뒤') */
    static String until(long ms) {
        long m = Math.max(1, Math.round(ms / 60000.0));
        if (m < 60) return m + "분 뒤";
        long h = m / 60, r = m % 60;
        return h + "시간" + (r > 0 ? " " + r + "분" : "") + " 뒤";
    }

    private static CharSequence strike(CharSequence t) {
        SpannableString sp = new SpannableString(t);
        sp.setSpan(new StrikethroughSpan(), 0, sp.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        return sp;
    }

    /** 목록의 한 줄: 시각 | 색 막대 | 제목 | (확인 필요) | 오른쪽(지금 · 남은 시간 · 완료). mk = marks()의 값 */
    static RemoteViews row(Context c, JSONObject r, long now, int mk) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_widget_row);
        long at = r.optLong("at", 0), end = r.optLong("end", at + 3600000L);
        boolean allDay = r.optBoolean("allDay", false), done = r.optBoolean("done", false);
        // 끝남: 종일 일정은 그날이 지나면, 시간 있는 일정은 끝 시각이 지나면
        boolean ended = allDay ? dayStart(at) < dayStart(now) : end <= now;
        boolean gone = done || ended, live = !gone && !allDay && at <= now;
        boolean bg = (mk & M_BG) != 0, next = (mk & M_NEXT) != 0;
        // 확인 필요(동그라미 안 느낌표): 시간이 지났는데 체크하지 않은 일정, 먹었는지 확인하지 않은 약 단계가 있는 루틴. 수업은 확인 필요에 들지 않는다(앱과 같게)
        String k = r.optString("k", "item");
        boolean warn = !done && (("item".equals(k) && ended) || ("routine".equals(k) && r.optBoolean("miss", false)));
        int ink = c.getResources().getColor(R.color.bx_w_ink, null);
        int ink2 = c.getResources().getColor(R.color.bx_w_ink2, null);
        int dim = c.getResources().getColor(R.color.bx_w_dim, null);
        int faint = c.getResources().getColor(R.color.bx_w_faint, null);
        int accent = c.getResources().getColor(R.color.bx_w_accent, null);
        // 오른쪽: 끝낸 일 '완료' · 하는 중 '지금' · 곧 시작 남은 시간(위젯은 작아서 짧게, 대표 11/3). 장소 · 출발 시각은 앱에서
        String right = warn ? "" : done ? "완료" : live ? "지금" : next ? until(at - now) : "";
        CharSequence rightCs = right;
        if (live || next) {
            SpannableString sp = new SpannableString(right);
            sp.setSpan(new StyleSpan(Typeface.BOLD), 0, sp.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            rightCs = sp;
        }
        CharSequence tCs = allDay ? "종일" : hm(at), nCs = r.optString("title", "");
        // 체크한 일정: 시각 · 이름 가로줄 + 흐리게(선택실 3 '다'). 시간이 지났는데 체크 안 한 일정은 조금 연하게만(가로줄 없음)
        if (done) { tCs = strike(tCs); nCs = strike(nCs); }
        v.setTextViewText(R.id.wr_t, tCs);
        v.setTextViewText(R.id.wr_n, nCs);
        v.setTextViewText(R.id.wr_m, rightCs);
        v.setTextColor(R.id.wr_t, done ? faint : gone ? dim : (live || (next && bg)) ? accent : ink);
        v.setTextColor(R.id.wr_n, done ? faint : gone ? dim : ink);
        v.setTextColor(R.id.wr_m, done ? faint : (live || next) ? accent : gone ? dim : ink2);
        v.setInt(R.id.wr_c, "setBackgroundColor", done ? c.getResources().getColor(R.color.bx_w_faintbar, null) : gone ? 0xFFC9CED6 : color(r.optString("c"), accent));
        v.setInt(R.id.wr_root, "setBackgroundResource", bg ? R.drawable.bx_widget_live : 0);
        v.setViewVisibility(R.id.wr_line, (mk & M_LINE) != 0 ? View.VISIBLE : View.GONE);
        v.setViewVisibility(R.id.wr_w, warn ? View.VISIBLE : View.GONE);
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
        boolean cd = false;
        JSONArray items = d.optJSONArray("items");
        if (items != null) {
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.optJSONObject(i);
                if (o == null) continue;
                long at = o.optLong("at", 0), end = o.optLong("end", 0), go = o.optLong("go", 0);
                if (at > now && at < next) next = at;
                if (end > now && end < next) next = end;
                if (go > now && go < next) next = go;
                if (at > now && at < today + DAY_MS && !o.optBoolean("allDay", false) && !o.optBoolean("done", false)) cd = true;
            }
        }
        // 시험판 57: 곧 시작할 일정의 남은 시간('16분 뒤')을 1분마다 고친다(깨우지 않는 RTC라 화면이 꺼져 있으면 쉰다)
        if (cd) { long nm = (now / 60000L + 1) * 60000L; if (nm < next) next = nm; }
        long midnight = today + 24 * 3600 * 1000L;
        if (midnight < next) next = midnight;
        // ‹ ›로 다른 날을 보고 있는 위젯은 10분 뒤 오늘로 돌아가게 그때 한 번 더
        android.content.SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        for (int wid : ids) {
            long back = sp.getLong("dayAt_" + wid, 0) + BACK_MS + 1000;
            if (sp.getLong("day_" + wid, today) != today && back > now && back < next) next = back;
        }
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.set(AlarmManager.RTC, next + 1000, tickIntent(c));
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, android.os.Bundle opts) {
        super.onAppWidgetOptionsChanged(c, m, id, opts);
        render(c, m, new int[] {id});
    }

    /** ‹ › · 날짜 누르기: step -1 · +1, 0이면 오늘 */
    private static PendingIntent dayPi(Context c, int wid, int step) {
        Intent t = new Intent(c, BxWidgetProvider.class);
        t.setAction(ACTION_DAY);
        // 위젯마다 · 단추마다 다른 PendingIntent(값만 다른 인텐트는 같은 것으로 쳐서 덮어써짐)
        t.setData(Uri.parse("bxw://day/" + wid + "/" + step));
        t.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, wid);
        t.putExtra("step", step);
        return PendingIntent.getBroadcast(c, 0x0B15, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent activityPi(Context c, int code, String action, String ds) {
        Intent i = new Intent(c, MainActivity.class);
        if (action != null) i.setAction(action);
        if (ds != null) {
            i.putExtra("ds", ds);
            i.setData(Uri.parse("bxw://open/" + code + "/" + ds));
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** 머리 줄 날짜: '오늘 · 11월 3일 (화)', '내일 · …', '어제 · …', 그 밖은 날짜만. 앞말은 파란 글자 */
    private static CharSequence dayTitle(Context c, long day, long today) {
        long dd = Math.round((day - today) / (double) DAY_MS);
        String pre = dd == 0 ? "오늘" : dd == 1 ? "내일" : dd == -1 ? "어제" : "";
        String date = new SimpleDateFormat("M월 d일 (E)", Locale.KOREAN).format(new Date(day + 3600000L));
        if (pre.isEmpty()) return date;
        SpannableString sp = new SpannableString(pre + " · " + date);
        sp.setSpan(new android.text.style.ForegroundColorSpan(c.getResources().getColor(R.color.bx_w_accent, null)), 0, pre.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        return sp;
    }

    private static RemoteViews build(Context c, JSONObject d, int wid, long now) {
        long today = dayStart(now), day = dayOf(c, wid, now);
        String ds = new SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(new Date(day + 3600000L));
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.bx_widget);
        v.setTextViewText(R.id.w_head, dayTitle(c, day, today));
        // ‹ ›: 앱이 넘겨 준 범위(지난 7일 ~ 앞으로 14일) 끝에서는 숨김(자리는 남겨 날짜가 가운데에 머묾)
        v.setViewVisibility(R.id.w_prev, day <= today - d.optInt("back", 7) * DAY_MS ? View.INVISIBLE : View.VISIBLE);
        v.setViewVisibility(R.id.w_next, day >= today + d.optInt("ahead", 14) * DAY_MS ? View.INVISIBLE : View.VISIBLE);
        v.setOnClickPendingIntent(R.id.w_prev, dayPi(c, wid, -1));
        v.setOnClickPendingIntent(R.id.w_next, dayPi(c, wid, 1));
        v.setOnClickPendingIntent(R.id.w_head, day == today ? activityPi(c, 0x0B10, ACTION_HOME, null) : dayPi(c, wid, 0));

        // 목록: 위젯마다 · 날마다 다른 인텐트여야 휴대폰이 목록을 따로 만든다
        Intent svc = new Intent(c, BxWidgetService.class);
        svc.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, wid);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        v.setRemoteAdapter(R.id.w_list, svc);
        v.setEmptyView(R.id.w_list, R.id.w_empty);
        // 지금 시각 바로 앞 일정부터 보이게(오늘). 다른 날은 맨 위부터
        try {
            v.setScrollPosition(R.id.w_list, scrollTo(rows(d, onlyItems(d), day), day, now));
        } catch (Exception ignored) {
        }
        Intent open = new Intent(c, MainActivity.class);
        open.setAction(ACTION_OPEN);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        // 줄마다 채워 넣는 틀이라 바뀔 수 있어야 한다(안드로이드 12부터 FLAG_MUTABLE)
        int mut = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        v.setPendingIntentTemplate(R.id.w_list, PendingIntent.getActivity(c, 0x0B14, open, PendingIntent.FLAG_UPDATE_CURRENT | mut));

        v.setOnClickPendingIntent(R.id.w_root, activityPi(c, 0x0B10, ACTION_HOME, null));
        // 새 일정(＋) = 새 일정 창(글자로), 말하기(🎤) = 새 일정 창 + 바로 듣기. 보고 있는 날짜로(대표 요청 11/3: 따로)
        v.setOnClickPendingIntent(R.id.w_add, activityPi(c, 0x0B13, ACTION_ADD, ds));
        v.setOnClickPendingIntent(R.id.w_mic, activityPi(c, 0x0B11, ACTION_SPEAK, ds));
        // ✎ 메모는 오늘 메모로(떠오른 때가 기준). '기능 · 메뉴 편집'에서 메모를 끄면 숨김(앱이 넘겨 준 memo)
        v.setOnClickPendingIntent(R.id.w_memo, activityPi(c, 0x0B16, ACTION_MEMO, null));
        v.setViewVisibility(R.id.w_memo, d.optBoolean("memo", true) ? View.VISIBLE : View.GONE);
        return v;
    }

    private static PendingIntent tickIntent(Context c) {
        Intent t = new Intent(c, BxWidgetProvider.class);
        t.setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(c, 0x0B12, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
