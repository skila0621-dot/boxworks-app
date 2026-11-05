package kr.boxworks.b;

import android.app.Activity;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.style.RelativeSizeSpan;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import java.lang.ref.WeakReference;
import org.json.JSONObject;

/**
 * 잠금 화면 위에 뜨는 알람 화면(늘 어두운 바탕). 맨 위 작은 이름(준비 시작 · 출발 · 알림), 지금 시각(크게), 약속 제목,
 * SPEC 4절 본문, 장소, 단추(큰 것 64dp · 둘째 56dp · 사이 16dp), 준비 · 출발에는 작은 글자 '이번엔 안 가요'.
 * 소리는 BRingService가 낸다(이 화면은 소리를 내지 않는다).
 */
public class BAlarmActivity extends Activity {
    static final String EXTRA = "b_alarm";

    private static final int BG = 0xFF0F1115, TEXT = 0xFFECEEF2, MUTED = 0xFF9AA1AD, ACCENT = 0xFF7C9BFF, LINE = 0xFF3A4150;
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static WeakReference<BAlarmActivity> current = new WeakReference<>(null);

    private final Handler handler = new Handler(Looper.getMainLooper());
    private JSONObject alarm = new JSONObject();
    private BPlanner.Entry entry = new BPlanner.Entry();
    private String kind = "prep", key = "";
    private boolean h24, busy;
    private TextView clockView, bodyView, placeView;
    private Button secondView;
    private String shownClock = "", shownBody = "", shownSecond = "";
    private long lastTexts = 0;

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            refresh(false);
            handler.postDelayed(this, 1000);
        }
    };

    /** 다른 곳(알림 단추 · 앱)에서 대답했을 때: 그 약속 화면이면 닫는다 */
    static void answered(final String key) {
        MAIN.post(() -> {
            BAlarmActivity a = current.get();
            if (a != null && !a.isFinishing() && key != null && key.equals(a.key)) a.finish();
        });
    }

    /** 같은 약속이 다시 울렸을 때(붙잡기): 떠 있는 화면의 글을 새로 */
    static void update(final JSONObject alarm) {
        final String k = BJson.str(alarm, "key", "");
        MAIN.post(() -> {
            BAlarmActivity a = current.get();
            if (a != null && !a.isFinishing() && k.equals(a.key)) a.show(alarm);
        });
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        current = new WeakReference<>(this);
        show(BJson.parseObj(getIntent() == null ? null : getIntent().getStringExtra(EXTRA)));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        current = new WeakReference<>(this);
        show(BJson.parseObj(intent == null ? null : intent.getStringExtra(EXTRA)));
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.removeCallbacks(tick);
        handler.post(tick);
    }

    @Override
    protected void onPause() {
        handler.removeCallbacks(tick);
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (current.get() == this) current = new WeakReference<>(null);
        super.onDestroy();
    }

    private void show(JSONObject a) {
        alarm = a == null ? new JSONObject() : a;
        kind = BJson.str(alarm, "kind", "prep");
        key = BJson.str(alarm, "key", "");
        entry = BEngine.fromSnap(alarm.optJSONObject("e"));
        h24 = BStore.h24(this);
        busy = false;
        shownClock = shownBody = shownSecond = "";
        setContentView(build());
        refresh(true);
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private TextView text(float sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER_HORIZONTAL);
        t.setIncludeFontPadding(true);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private LinearLayout.LayoutParams lp(int width, int height, int topDp) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(width, height);
        p.topMargin = dp(topDp);
        return p;
    }

    private View build() {
        final int side = dp(24), top = dp(20), bottom = dp(16);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(side, top, side, bottom);
        // 상태 표시줄 · 아래 막대 · 카메라 구멍을 피한다
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets i = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(side + i.left, top + i.top, side + i.right, bottom + i.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        LinearLayout info = new LinearLayout(this);
        info.setOrientation(LinearLayout.VERTICAL);
        info.setGravity(Gravity.CENTER);
        info.setPadding(0, dp(12), 0, dp(12));

        TextView label = text(15, MUTED, true);
        label.setLetterSpacing(0.04f);
        label.setText(BText.label(kind));
        info.addView(label, lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, 0));

        clockView = text(64, TEXT, true);
        clockView.setFontFeatureSettings("tnum");
        clockView.setSingleLine(true);
        info.addView(clockView, lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, 4));

        TextView title = text(26, TEXT, true);
        title.setText(entry.title == null || entry.title.isEmpty() ? "(제목 없음)" : entry.title);
        title.setMaxLines(3);
        title.setEllipsize(TextUtils.TruncateAt.END);
        title.setLineSpacing(0, 1.12f);
        info.addView(title, lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, 28));

        bodyView = text(18, TEXT, false);
        bodyView.setLineSpacing(0, 1.15f);
        info.addView(bodyView, lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, 12));

        placeView = text(16, MUTED, false);
        placeView.setMaxLines(2);
        placeView.setEllipsize(TextUtils.TruncateAt.END);
        info.addView(placeView, lp(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT, 8));

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setVerticalScrollBarEnabled(false);
        scroll.addView(info, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT));
        root.addView(scroll, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        Button first = button(BText.primary(kind), true);
        first.setOnClickListener(v -> act(BText.primaryAct(kind), null));
        root.addView(first, lp(LinearLayout.LayoutParams.MATCH_PARENT, dp(64), 16));

        secondView = button("", false);
        secondView.setOnClickListener(v -> {
            Object[] sec = BText.secondary(kind, entry, System.currentTimeMillis());
            if ("late".equals(sec[1])) late();
            else act("snooze", (Double) sec[2]);
        });
        root.addView(secondView, lp(LinearLayout.LayoutParams.MATCH_PARENT, dp(56), 16));

        if ("prep".equals(kind) || "leave".equals(kind)) {
            TextView off = text(15, MUTED, false);
            off.setText("이번엔 안 가요");
            off.setGravity(Gravity.CENTER);
            off.setPaintFlags(off.getPaintFlags() | Paint.UNDERLINE_TEXT_FLAG);
            off.setClickable(true);
            off.setOnClickListener(v -> act("off", null));
            root.addView(off, lp(LinearLayout.LayoutParams.MATCH_PARENT, dp(48), 8));
        }
        return root;
    }

    private Button button(String label, boolean primary) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, primary ? 19 : 17);
        b.setTextColor(primary ? BG : TEXT);
        b.setStateListAnimator(null);
        b.setMinHeight(0);
        b.setMinimumHeight(0);
        b.setPadding(dp(16), 0, dp(16), 0);
        GradientDrawable shape = new GradientDrawable();
        shape.setCornerRadius(dp(16));
        if (primary) {
            shape.setColor(ACCENT);
        } else {
            shape.setColor(Color.TRANSPARENT);
            shape.setStroke(dp(1.5f), LINE);
        }
        GradientDrawable mask = new GradientDrawable();
        mask.setCornerRadius(dp(16));
        mask.setColor(Color.WHITE);
        b.setBackground(new RippleDrawable(ColorStateList.valueOf(primary ? 0x33000000 : 0x33FFFFFF), shape, mask));
        return b;
    }

    /** 큰 시계: '오후'는 작게, 숫자는 크게 */
    private static CharSequence clock(String s) {
        int sp = s.indexOf(' ');
        SpannableString out = new SpannableString(s);
        if (sp > 0) out.setSpan(new RelativeSizeSpan(0.42f), 0, sp + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        return out;
    }

    /** 1초마다 시계, 15초마다(늦음이 바뀔 수 있어) 본문 · 둘째 단추 */
    private void refresh(boolean force) {
        if (clockView == null) return;
        long now = System.currentTimeMillis();
        String c = BText.hm(now, h24);
        if (!c.equals(shownClock)) {
            shownClock = c;
            clockView.setText(clock(c));
        }
        if (!force && now - lastTexts < 15000) return;
        lastTexts = now;
        String b = BText.body(kind, entry, now, h24);
        if (!b.equals(shownBody)) {
            shownBody = b;
            bodyView.setText(b);
        }
        String place = entry.place == null ? "" : entry.place;
        boolean showPlace = !place.isEmpty() && !b.contains(place);
        placeView.setText(showPlace ? place : "");
        placeView.setVisibility(showPlace ? View.VISIBLE : View.GONE);
        String s = (String) BText.secondary(kind, entry, now)[0];
        if (!s.equals(shownSecond)) {
            shownSecond = s;
            secondView.setText(s);
        }
    }

    private void act(final String act, final Double n) {
        if (busy) return;
        busy = true;
        final String k = key, kd = kind;
        final JSONObject snap = alarm.optJSONObject("e");
        final android.content.Context app = getApplicationContext();
        BEngine.bg(() -> BActions.handle(app, k, act, kd, n, snap));
        finish();
    }

    /** 늦는다고 알리기: 공유 창을 연다(화면은 남겨 두어 돌아와서 '시작했어요'를 누를 수 있게) */
    private void late() {
        BActions.lateShare(this, key, kind, alarm.optJSONObject("e"));
    }
}
