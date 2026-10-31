package kr.boxworks.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.lang.ref.WeakReference;
import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.Iterator;
import java.util.Date;
import java.util.Locale;
import org.json.JSONObject;

/**
 * 잠금 화면 위에 뜨는 알람 화면(와이어프레임 4안-4).
 * 할 일 아이콘, 제목, 출발까지 남은 시간, 진행 막대, 다음 알람, 확인·5분 뒤.
 */
public class AlarmActivity extends Activity {
    private static WeakReference<AlarmActivity> current = new WeakReference<>(null);
    private static final long RING_MS = 60 * 1000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Ringtone ringtone;
    private Vibrator vibrator;
    private JSONObject alarm = new JSONObject();
    /** 이 화면이 떠 있는 동안 함께 울린 다른 알람(예: 출근 루틴과 약 먹기가 같은 시각). 지금 것을 처리하면 차례로 보여 준다. */
    private final ArrayDeque<JSONObject> waiting = new ArrayDeque<>();
    private final Runnable stopper = this::stopRinging;
    /** 잠금을 풀면 가렸던 일정 제목을 보여 주려고 1초마다 잠금 상태를 본다 */
    private boolean shownLocked = false;
    private final Runnable lockWatch = new Runnable() {
        @Override
        public void run() {
            if (isLocked() != shownLocked) setContentView(buildUi());
            handler.postDelayed(this, 1000);
        }
    };

    private boolean isLocked() {
        android.app.KeyguardManager km = (android.app.KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        return km != null && km.isKeyguardLocked();
    }

    /** 알림에서 '확인'·'5분 뒤'를 눌렀을 때: 그 알람이 지금 화면이면 다음 알람으로, 기다리는 중이면 목록에서 뺀다. */
    static void handledElsewhere(String id, String series) {
        AlarmActivity a = current.get();
        if (a == null || a.isFinishing()) return;
        String curSeries = a.alarm.optString("series", "");
        if ((id != null && id.equals(a.alarm.optString("id"))) || (series != null && !series.isEmpty() && series.equals(curSeries))) {
            a.dropSeries(a.alarm.optString("series", ""));
            a.showNext();
        }
        else {
            int before = a.waiting.size();
            a.removeWaiting(id);
            a.dropSeries(series);
            if (a.waiting.size() != before) a.setContentView(a.buildUi());
        }
    }

    private void dropSeries(String series) {
        if (series == null || series.isEmpty()) return;
        for (Iterator<JSONObject> it = waiting.iterator(); it.hasNext(); ) {
            if (series.equals(it.next().optString("series", ""))) it.remove();
        }
    }

    private boolean removeWaiting(String id) {
        boolean removed = false;
        for (Iterator<JSONObject> it = waiting.iterator(); it.hasNext(); ) {
            if (it.next().optString("id").equals(id)) { it.remove(); removed = true; }
        }
        return removed;
    }

    /** 지금 알람을 처리한 뒤: 기다리는 알람이 있으면 그것을 보여 주고 다시 울린다. 없으면 닫는다. */
    private void showNext() {
        JSONObject next = waiting.pollFirst();
        if (next == null) {
            finish();
            return;
        }
        alarm = next;
        setContentView(buildUi());
        ring();
    }

    private void ring() {
        startRinging();
        handler.removeCallbacks(stopper);
        handler.postDelayed(stopper, RING_MS);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(0xFF1B1E26);
        getWindow().setNavigationBarColor(0xFF1B1E26);
        current = new WeakReference<>(this);
        alarm = AlarmNotify.fromIntent(getIntent());
        setContentView(buildUi());
        ring();
        handler.postDelayed(lockWatch, 1000);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        JSONObject incoming = AlarmNotify.fromIntent(intent);
        String inId = incoming.optString("id"), inSeries = incoming.optString("series", "");
        removeWaiting(inId);
        dropSeries(inSeries);
        // 앞서 울리던 알람은 버리지 않고 뒤에 다시 보여 준다(같은 알람의 다시 알림이면 새것으로 바꾼다)
        boolean sameSeries = !inSeries.isEmpty() && inSeries.equals(alarm.optString("series", ""));
        if (!alarm.optString("id").isEmpty() && !alarm.optString("id").equals(inId) && !sameSeries) waiting.addFirst(alarm);
        alarm = incoming;
        setContentView(buildUi());
        ring();
    }

    @Override
    protected void onDestroy() {
        stopRinging();
        handler.removeCallbacksAndMessages(null);
        if (current.get() == this) current = new WeakReference<>(null);
        super.onDestroy();
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private TextView text(String s, float sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private LinearLayout.LayoutParams wrap(int topDp) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(topDp);
        lp.gravity = Gravity.CENTER_HORIZONTAL;
        return lp;
    }

    private static String hm(long ms) {
        return new SimpleDateFormat("HH:mm", Locale.KOREA).format(new Date(ms));
    }

    private View buildUi() {
        boolean routine = "routine".equals(alarm.optString("kind"));
        int accent = routine ? 0xFF7A4FD6 : 0xFF3A5BF0;
        // 잠금 화면에서는 일정 제목·장소를 가린다(대표 결정 10/31). 루틴 단계 이름과 남은 시간은 보인다
        shownLocked = isLocked();
        String mode = AlarmStore.lockMode(this);
        boolean hide = shownLocked && !"title".equals(mode);
        boolean none = shownLocked && "none".equals(mode);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setBackgroundColor(0xFF1B1E26);
        root.setPadding(dp(24), dp(56), dp(24), dp(36));

        long now = System.currentTimeMillis();
        root.addView(text(new SimpleDateFormat("M월 d일 EEEE", Locale.KOREAN).format(new Date(now)), 16, 0xFFC9CCD3, false), wrap(0));
        root.addView(text(hm(now), 72, Color.WHITE, true), wrap(0));

        String group = none ? "" : hide ? alarm.optString("pg", routine ? alarm.optString("group", "") : "") : alarm.optString("group", "");
        root.addView(text("박스웍스" + (group.isEmpty() ? "" : " · " + group), 13, 0xFFC9CCD3, false), wrap(32));
        if (!waiting.isEmpty()) {
            TextView more = text("함께 울린 알람 " + waiting.size() + "개가 더 있어요 · 확인하면 이어서 보여 줘요", 13, 0xFFFFD27A, true);
            root.addView(more, wrap(6));
        }

        FrameLayout circle = new FrameLayout(this);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(accent);
        circle.setBackground(bg);
        ImageView icon = new ImageView(this);
        // 루틴 아이콘(책·연필·운동 등). 화면이 고른 이름의 ic_rt_ 그림이 있으면 그것, 없으면 종
        int iconRes = 0;
        String iconKey = none ? "" : alarm.optString("icon", "");
        if (iconKey.matches("[a-z]{2,20}")) iconRes = getResources().getIdentifier("ic_rt_" + iconKey, "drawable", getPackageName());
        icon.setImageResource(iconRes != 0 ? iconRes : R.drawable.ic_alarm_bell);
        circle.addView(icon, new FrameLayout.LayoutParams(dp(56), dp(56), Gravity.CENTER));
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(dp(120), dp(120));
        clp.topMargin = dp(18);
        clp.gravity = Gravity.CENTER_HORIZONTAL;
        root.addView(circle, clp);

        String title = hide ? AlarmNotify.pubTitle(this, alarm) : alarm.optString("title", "");
        TextView t = text(title.isEmpty() ? "박스웍스 알람" : title, 34, Color.WHITE, true);
        t.setMaxLines(2);
        root.addView(t, wrap(16));

        String sub = hide ? AlarmNotify.pubSub(this, alarm) : alarm.optString("sub", alarm.optString("body", ""));
        if (!sub.isEmpty()) root.addView(text(sub, 20, 0xFFE4E6EA, false), wrap(8));

        long from = alarm.optLong("from", 0), to = alarm.optLong("to", 0);
        if (!none && from > 0 && to > from) root.addView(progress(from, to, now, accent), wrap(18));

        String next = none || (hide && !routine) ? "" : alarm.optString("next", "");
        if (!next.isEmpty()) root.addView(text("다음 " + next, 14, 0xFFA9ADB6, false), wrap(14));
        if (alarm.optJSONObject("report") != null) root.addView(text(hide ? "확인하면 오늘 일정 알림이 와요 · 잠금을 풀면 보여요" : "확인하면 오늘 일정 알림이 와요", 13, 0xFFA9ADB6, false), wrap(10));

        View spacer = new View(this);
        root.addView(spacer, new LinearLayout.LayoutParams(1, 0, 1f));

        Button ok = button("확인", Color.WHITE, 0xFF1C1C1C, 0, dp(32));
        ok.setTextSize(TypedValue.COMPLEX_UNIT_SP, 19);
        ok.setOnClickListener(v -> {
            AlarmStore.confirm(this, alarm, true);
            // 아침 루틴 첫 알람이면 확인한 직후 아침 보고를 띄운다
            if (alarm.optJSONObject("report") != null) AlarmNotify.showReport(this, alarm.optJSONObject("report"));
            AlarmNotify.dismiss(this, alarm.optString("id"));
            dropSeries(alarm.optString("series", ""));
            RoutineOngoing.post(this);
            BxWidgetProvider.refreshAll(this);
            showNext();
        });
        root.addView(ok, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(64)));

        Button snooze = button("5분 뒤 · 같은 소리로 다시", Color.TRANSPARENT, Color.WHITE, 0xFF4A505D, dp(26));
        snooze.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        snooze.setOnClickListener(v -> {
            AlarmStore.confirm(this, alarm, false);
            AlarmNotify.snooze(this, alarm);
            AlarmNotify.dismiss(this, alarm.optString("id"));
            dropSeries(alarm.optString("series", ""));
            showNext();
        });
        LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52));
        slp.topMargin = dp(12);
        root.addView(snooze, slp);
        return root;
    }

    private View progress(long from, long to, long now, int accent) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        int width = dp(300);
        FrameLayout bar = new FrameLayout(this);
        GradientDrawable track = new GradientDrawable();
        track.setColor(0xFF3A3F4B);
        track.setCornerRadius(dp(5));
        bar.setBackground(track);
        float f = Math.max(0f, Math.min(1f, (now - from) / (float) (to - from)));
        View fill = new View(this);
        GradientDrawable fd = new GradientDrawable();
        fd.setColor(accent == 0xFF7A4FD6 ? 0xFF9B7BE3 : 0xFF7D96FF);
        fd.setCornerRadius(dp(5));
        fill.setBackground(fd);
        bar.addView(fill, new FrameLayout.LayoutParams(Math.max(dp(10), Math.round(width * f)), dp(10)));
        box.addView(bar, new LinearLayout.LayoutParams(width, dp(10)));
        LinearLayout labels = new LinearLayout(this);
        labels.setOrientation(LinearLayout.HORIZONTAL);
        TextView a = text(hm(from), 12, 0xFFA9ADB6, false);
        a.setGravity(Gravity.START);
        TextView b = text(hm(to) + " 출발", 12, 0xFFA9ADB6, false);
        b.setGravity(Gravity.END);
        labels.addView(a, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        labels.addView(b, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        LinearLayout.LayoutParams llp = new LinearLayout.LayoutParams(width, LinearLayout.LayoutParams.WRAP_CONTENT);
        llp.topMargin = dp(6);
        box.addView(labels, llp);
        return box;
    }

    private Button button(String label, int fill, int textColor, int stroke, int radius) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(textColor);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setStateListAnimator(null);
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(radius);
        if (stroke != 0) d.setStroke(dp(1.5f), stroke);
        b.setBackground(d);
        return b;
    }

    private void startRinging() {
        stopRinging();
        try {
            Uri uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            ringtone = RingtoneManager.getRingtone(this, uri);
            if (ringtone != null) {
                ringtone.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) ringtone.setLooping(true);
                ringtone.play();
            }
        } catch (Exception ignored) {
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm == null ? null : vm.getDefaultVibrator();
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator != null) {
                long[] pattern = {0, 700, 500};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                else vibrator.vibrate(pattern, 0);
            }
        } catch (Exception ignored) {
        }
    }

    private void stopRinging() {
        try {
            if (ringtone != null) ringtone.stop();
        } catch (Exception ignored) {
        }
        ringtone = null;
        try {
            if (vibrator != null) vibrator.cancel();
        } catch (Exception ignored) {
        }
        vibrator = null;
    }
}
