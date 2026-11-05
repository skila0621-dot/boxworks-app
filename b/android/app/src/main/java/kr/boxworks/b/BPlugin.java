package kr.boxworks.b;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 웹(화면) → 휴대폰 다리(SPEC 7절). 웹에서는 Capacitor.Plugins.B. 모두 Promise.
 * 이벤트: changed {reason, key?} (알림 · 알람 단추 · 울림 · 캘린더 바뀜 · 앱 다시 엶 · 공유 받음), speech {text, final, error?}.
 */
@CapacitorPlugin(
    name = "B",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR }, alias = "calendar"),
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notif"),
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "mic")
    }
)
public class BPlugin extends Plugin {
    private static final long H = 3600 * 1000L;
    private static volatile WeakReference<BPlugin> live = new WeakReference<>(null);

    private final Handler main = new Handler(Looper.getMainLooper());
    // 설정 화면에서 돌아오기를 기다리는 fix()
    private PluginCall fixCall;
    private String fixKind;
    private boolean fixPaused;
    // 말 듣기
    private SpeechRecognizer rec;
    private String partial = "";
    private boolean listening;

    @Override
    public void load() {
        live = new WeakReference<>(this);
        Context c = getContext().getApplicationContext();
        BNotify.ensureChannels(c);
        BEngine.bg(() -> BReplanJob.ensure(c));
    }

    /** 앱이 떠 있으면 웹에 'changed'를 알린다 */
    static void emit(String reason, String key) {
        BPlugin p = live.get();
        if (p == null) return;
        JSObject o = new JSObject();
        o.put("reason", reason);
        if (key != null) o.put("key", key);
        try {
            p.notifyListeners("changed", o);
        } catch (Exception ignored) {
        }
    }

    private static JSObject js(JSONObject o) {
        try {
            return o == null ? new JSObject() : JSObject.fromJSONObject(o);
        } catch (Exception e) {
            return new JSObject();
        }
    }

    private static long lng(JSONObject d, String k, long def) {
        Object v = d == null ? null : d.opt(k);
        return v instanceof Number ? Math.round(((Number) v).doubleValue()) : def;
    }

    private static Double dbl(JSONObject d, String k) {
        Object v = d == null ? null : d.opt(k);
        return v instanceof Number ? ((Number) v).doubleValue() : null;
    }

    private Context app() {
        return getContext().getApplicationContext();
    }

    // ───────── 읽기 ─────────

    /** {settings, overrides, places, kw, items, learned:{prep, samples}, perms, calendars, lastOpen, now, trial, firstRun} */
    @PluginMethod
    public void state(PluginCall call) {
        Context c = app();
        JSObject r = new JSObject();
        r.put("settings", BStore.settings(c));
        r.put("overrides", BStore.obj(c, BStore.OVERRIDES));
        r.put("places", BStore.obj(c, BStore.PLACES));
        r.put("kw", BStore.obj(c, BStore.KW));
        r.put("items", BStore.arr(c, BStore.ITEMS));
        BPlanner.Learned L = BPlanner.learned(BPlanner.log(BJson.list(BStore.arr(c, BStore.LOG))));
        JSONObject learned = new JSONObject();
        BJson.put(learned, "prep", BPlanner.num(L.prep));
        JSONArray samples = new JSONArray();
        for (BPlanner.Sample s : L.samples) {
            JSONObject o = new JSONObject();
            BJson.put(o, "key", s.key);
            BJson.put(o, "t", BPlanner.num(s.t));
            BJson.put(o, "minutes", BPlanner.num(s.minutes));
            samples.put(o);
        }
        BJson.put(learned, "samples", samples);
        r.put("learned", learned);
        r.put("perms", BEngine.perms(c));
        r.put("calendars", BCalendar.calendars(c));
        Long lo = BStore.lastOpen(c);
        r.put("lastOpen", lo == null ? JSONObject.NULL : lo);
        r.put("now", System.currentTimeMillis());
        r.put("trial", BEngine.trial(c));
        r.put("firstRun", !BStore.firstRunDone(c));
        call.resolve(r);
    }

    /** {now, entries:[planner.js 항목 + eventId · calId]}. 빠듯함 계산을 위해 from 앞 12시간도 읽는다 */
    @PluginMethod
    public void plan(PluginCall call) {
        long now = System.currentTimeMillis();
        JSObject d = call.getData();
        long from = lng(d, "from", now - 6 * H), to = lng(d, "to", now + 48 * H);
        if (to <= from) to = from + 24 * H;
        BEngine.Plan p = BEngine.plan(app(), now, from - 12 * H, to);
        JSONArray list = new JSONArray();
        if (p != null) {
            for (BPlanner.Entry e : p.entries) {
                double end = e.end != null ? e.end : e.start;
                if (e.start < to && (e.start >= from || end > from)) list.put(BJson.json(e.toMap()));
            }
        }
        JSObject r = new JSObject();
        r.put("now", now);
        r.put("entries", list);
        if (p == null) r.put("error", "calendar");
        call.resolve(r);
    }

    // ───────── 쓰기 ─────────

    /** 준 것만 통째로 바꾸고 다시 계획 → {ok, scheduled}. firstRunDone: true면 첫 실행 끝 */
    @PluginMethod
    public void save(PluginCall call) {
        Context c = app();
        JSObject d = call.getData();
        Object v = d.opt("settings");
        if (v instanceof JSONObject) BStore.setSettings(c, (JSONObject) v);
        v = d.opt("overrides");
        if (v instanceof JSONObject) BStore.put(c, BStore.OVERRIDES, v);
        v = d.opt("places");
        if (v instanceof JSONObject) BStore.put(c, BStore.PLACES, v);
        v = d.opt("kw");
        if (v instanceof JSONObject) BStore.put(c, BStore.KW, v);
        v = d.opt("items");
        if (v instanceof JSONArray) BStore.put(c, BStore.ITEMS, v);
        if (Boolean.TRUE.equals(d.opt("firstRunDone"))) BStore.setFirstRunDone(c, true);
        int n = BEngine.replan(c, false);
        BReplanJob.ensure(c);
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("scheduled", n);
        call.resolve(r);
    }

    /** 알람 단추와 같은 일(앱 안에서 누를 때): {key, act, kind?, n?} → {ok} */
    @PluginMethod
    public void act(PluginCall call) {
        final String key = call.getString("key"), act = call.getString("act"), kind = call.getString("kind");
        if (key == null || key.isEmpty() || act == null || act.isEmpty()) {
            call.reject("key와 act가 필요해요", "bad_args");
            return;
        }
        if ("late".equals(act)) {
            final Activity a = getActivity();
            if (a == null) {
                call.reject("화면이 없어요", "no_activity");
                return;
            }
            BPlanner.Entry e = BEngine.entryNow(app(), key, null);
            final JSONObject snap = e == null ? null : BEngine.snap(e);
            a.runOnUiThread(() -> BActions.lateShare(a, key, kind, snap));
        } else {
            BActions.handle(app(), key, act, kind, dbl(call.getData(), "n"), null);
        }
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    /** 휴대폰 캘린더에 약속 넣기 → {ok, id, calendarId}. 권한 · 쓸 수 있는 캘린더가 없으면 거절 no_calendar */
    @PluginMethod
    public void addEvent(PluginCall call) {
        final Context c = app();
        JSObject d = call.getData();
        if (!BCalendar.canRead(c) || !BCalendar.canWrite(c)) {
            call.reject("휴대폰 캘린더 권한이 없어요", "no_calendar");
            return;
        }
        long begin = lng(d, "begin", 0);
        if (begin <= 0) {
            call.reject("시작 시각이 없어요", "bad_args");
            return;
        }
        long end = lng(d, "end", begin + H);
        String wanted = BJson.str(d, "calendarId", null);
        String calId = BCalendar.pickCalendar(c, wanted, BJson.str(BStore.settings(c), "writeCal", null));
        if (calId == null) {
            call.reject("약속을 넣을 캘린더가 없어요", "no_calendar");
            return;
        }
        String[] res = BCalendar.insert(c, calId, BJson.str(d, "title", ""), begin, end, BJson.str(d, "location", ""));
        if (res == null) {
            call.reject("약속을 넣지 못했어요", "failed");
            return;
        }
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("id", res[0]);
        r.put("calendarId", res[1]);
        call.resolve(r);
        BEngine.bg(() -> BEngine.replan(c, false));
    }

    /** 휴대폰 캘린더 앱에서 그 일정 열기 */
    @PluginMethod
    public void openEvent(PluginCall call) {
        String id = BJson.str(call.getData(), "id", null);
        Activity a = getActivity();
        if (id != null && BCalendar.open(a != null ? a : app(), id)) {
            JSObject r = new JSObject();
            r.put("ok", true);
            call.resolve(r);
        } else {
            call.reject("캘린더 앱을 열지 못했어요", "failed");
        }
    }

    // ───────── 권한 ─────────

    @PluginMethod
    public void perms(PluginCall call) {
        call.resolve(js(BEngine.perms(app())));
    }

    /** 권한 묻기 또는 설정 열기 → 대화 상자가 닫히거나 설정에서 돌아오면 {kind, state} */
    @PluginMethod
    public void fix(PluginCall call) {
        String kind = call.getString("kind", "");
        Context c = app();
        String now = BJson.str(BEngine.perms(c), kind, "");
        // 캘린더는 읽기만 있어도 "ok"지만, 약속 넣기에 쓰기도 필요해 둘 다 있을 때만 바로 끝낸다
        boolean done = "calendar".equals(kind) ? BCalendar.canRead(c) && BCalendar.canWrite(c) : "ok".equals(now) || "na".equals(now);
        if (done) {
            resolveFix(call, kind);
            return;
        }
        String pkg = c.getPackageName();
        switch (kind) {
            case "notif":
                if (Build.VERSION.SDK_INT >= 33 && !BEngine.granted(c, Manifest.permission.POST_NOTIFICATIONS)
                    && getPermissionState("notif") != PermissionState.DENIED) {
                    requestPermissionForAlias("notif", call, "permResult");
                } else {
                    Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    i.putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
                    openAndWait(call, kind, i, appDetails(pkg));
                }
                return;
            case "calendar":
                if (getPermissionState("calendar") != PermissionState.DENIED) requestPermissionForAlias("calendar", call, "permResult");
                else openAndWait(call, kind, appDetails(pkg), null);
                return;
            case "mic":
                if (getPermissionState("mic") != PermissionState.DENIED) requestPermissionForAlias("mic", call, "permResult");
                else openAndWait(call, kind, appDetails(pkg), null);
                return;
            case "exact":
                openAndWait(call, kind, new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + pkg)), appDetails(pkg));
                return;
            case "fullscreen":
                openAndWait(call, kind, new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + pkg)), appDetails(pkg));
                return;
            case "battery":
                openAndWait(call, kind, new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + pkg)),
                    new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                return;
            default:
                call.reject("모르는 권한이에요: " + kind, "bad_kind");
        }
    }

    private static Intent appDetails(String pkg) {
        return new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
    }

    @PermissionCallback
    private void permResult(PluginCall call) {
        String kind = call.getString("kind", "");
        if ("calendar".equals(kind) && BCalendar.canRead(app())) {
            final Context c = app();
            BEngine.bg(() -> {
                BReplanJob.ensure(c);
                BEngine.replan(c, false);
            });
        }
        resolveFix(call, kind);
    }

    private void resolveFix(PluginCall call, String kind) {
        JSObject r = new JSObject();
        r.put("kind", kind);
        r.put("state", BJson.str(BEngine.perms(app()), kind, "na"));
        call.resolve(r);
    }

    /** 설정 화면을 열고, 돌아오면(앱이 다시 보이면) 다시 확인해 끝낸다. 화면이 안 떴으면 곧바로 */
    private void openAndWait(final PluginCall call, final String kind, Intent i, Intent fallback) {
        final Activity a = getActivity();
        if (a == null) {
            resolveFix(call, kind);
            return;
        }
        main.post(() -> {
            if (fixCall != null && fixCall != call) resolveFix(fixCall, fixKind);
            fixCall = call;
            fixKind = kind;
            fixPaused = false;
            boolean opened = false;
            try {
                a.startActivity(i);
                opened = true;
            } catch (Exception e) {
                if (fallback != null) {
                    try {
                        a.startActivity(fallback);
                        opened = true;
                    } catch (Exception ignored) {
                    }
                }
            }
            if (!opened) {
                fixCall = null;
                resolveFix(call, kind);
                return;
            }
            main.postDelayed(() -> {
                if (fixCall == call && !fixPaused) {
                    fixCall = null;
                    resolveFix(call, kind);
                }
            }, 2500);
        });
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        main.post(() -> {
            if (fixCall != null) fixPaused = true;
        });
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        main.post(() -> {
            if (fixCall != null && fixPaused) {
                PluginCall c = fixCall;
                String k = fixKind;
                fixCall = null;
                resolveFix(c, k);
                if ("calendar".equals(k)) BEngine.bg(() -> BReplanJob.ensure(app()));
            }
        });
    }

    // ───────── 그 밖 ─────────

    /** 'prep' 모양 시험 알람(seconds초 뒤). 기록 · 붙잡기는 하지 않는다 */
    @PluginMethod
    public void test(PluginCall call) {
        Context c = app();
        long sec = Math.max(1, lng(call.getData(), "seconds", 10));
        long at = System.currentTimeMillis() + sec * 1000L;
        long start = at + 70 * 60 * 1000L;
        JSONObject e = new JSONObject();
        BJson.put(e, "key", "test:" + at);
        BJson.put(e, "src", "test");
        BJson.put(e, "title", "시험 알람");
        BJson.put(e, "place", "");
        BJson.put(e, "start", start);
        BJson.put(e, "out", true);
        BJson.put(e, "prep", 30);
        BJson.put(e, "travel", 30);
        BJson.put(e, "buffer", 10);
        BJson.put(e, "snoozed", 0);
        BJson.put(e, "prepAt", at);
        BJson.put(e, "leaveAt", start - 40 * 60 * 1000L);
        BJson.put(e, "state", "idle");
        JSONObject a = new JSONObject();
        BJson.put(a, "id", "test:" + at);
        BJson.put(a, "key", "test:" + at);
        BJson.put(a, "kind", "prep");
        BJson.put(a, "at", at);
        BJson.put(a, "strong", true);
        BJson.put(a, "test", true);
        BJson.put(a, "e", e);
        BNotify.ensureChannels(c);
        BScheduler.add(c, a);
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("at", at);
        call.resolve(r);
    }

    /** 공유 창(받는 사람은 사용자가 고른다) */
    @PluginMethod
    public void share(PluginCall call) {
        final String text = call.getString("text", "");
        final Activity a = getActivity();
        if (a == null || text == null || text.isEmpty()) {
            call.reject("보낼 글이 없어요", "bad_args");
            return;
        }
        a.runOnUiThread(() -> BActions.openShare(a, text, "보내기"));
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    /** 다른 앱에서 공유해 들어온 글 {text}(읽으면 지운다) 또는 {text:null} */
    @PluginMethod
    public void shared(PluginCall call) {
        String t = BStore.takePendingShare(app());
        JSObject r = new JSObject();
        r.put("text", t == null ? JSONObject.NULL : t);
        call.resolve(r);
    }

    /** 지난번 연 시각 {prev}를 돌려주고 지금으로 적는다 */
    @PluginMethod
    public void opened(PluginCall call) {
        Long prev = BStore.opened(app());
        JSObject r = new JSObject();
        r.put("prev", prev == null ? JSONObject.NULL : prev);
        call.resolve(r);
    }

    @PluginMethod
    public void stats(PluginCall call) {
        Double days = dbl(call.getData(), "days");
        call.resolve(js(BEngine.stats(app(), days == null ? 30 : days)));
    }

    // ───────── 말 듣기 ─────────

    /** 말 듣기 시작 → {ok}. 듣는 동안 · 끝나면 이벤트 speech {text, final, error?} */
    @PluginMethod
    public void listen(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("이 휴대폰에서 음성 인식을 찾지 못했어요", "unavailable");
            return;
        }
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            requestPermissionForAlias("mic", call, "micResult");
            return;
        }
        startListening(call);
    }

    @PermissionCallback
    private void micResult(PluginCall call) {
        if (getPermissionState("mic") == PermissionState.GRANTED) startListening(call);
        else call.reject("마이크 권한이 없어요", "denied");
    }

    @PluginMethod
    public void stopListen(PluginCall call) {
        main.post(() -> {
            if (rec != null && listening) {
                try {
                    rec.stopListening();
                } catch (Exception e) {
                    finishSpeech(null, partial);
                }
                // 인식기가 답을 주지 않으면 1.5초 뒤 지금까지 들은 것으로 끝낸다
                main.postDelayed(() -> {
                    if (listening) finishSpeech(null, partial);
                }, 1500);
            }
            JSObject r = new JSObject();
            r.put("ok", true);
            call.resolve(r);
        });
    }

    private void startListening(final PluginCall call) {
        main.post(() -> {
            if (listening) finishSpeech("cancelled", partial);
            destroyRec();
            partial = "";
            try {
                rec = SpeechRecognizer.createSpeechRecognizer(getContext());
                rec.setRecognitionListener(listener);
                Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR");
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ko-KR");
                i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
                i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
                i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
                listening = true;
                rec.startListening(i);
                JSObject r = new JSObject();
                r.put("ok", true);
                call.resolve(r);
            } catch (Exception e) {
                listening = false;
                destroyRec();
                call.reject("음성 인식을 시작하지 못했어요", "unavailable");
            }
        });
    }

    private void emitSpeech(String text, boolean fin, String error) {
        JSObject o = new JSObject();
        o.put("text", text == null ? "" : text);
        o.put("final", fin);
        if (error != null) o.put("error", error);
        notifyListeners("speech", o);
    }

    private void finishSpeech(String error, String text) {
        if (!listening) return;
        listening = false;
        emitSpeech(text, true, error);
        destroyRec();
    }

    private void destroyRec() {
        if (rec != null) {
            try {
                rec.destroy();
            } catch (Exception ignored) {
            }
            rec = null;
        }
    }

    private static String best(Bundle b) {
        if (b == null) return "";
        ArrayList<String> list = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return list != null && !list.isEmpty() && list.get(0) != null ? list.get(0).trim() : "";
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onPartialResults(Bundle b) {
            String p = best(b);
            if (!p.isEmpty() && listening) {
                partial = p;
                emitSpeech(p, false, null);
            }
        }

        @Override
        public void onResults(Bundle b) {
            String r = best(b);
            finishSpeech(null, r.isEmpty() ? partial : r);
        }

        @Override
        public void onError(int error) {
            String code;
            if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) code = "no_match";
            else if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) code = "denied";
            else if (error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) code = "network";
            else if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) code = "busy";
            else code = "error";
            // 들은 것이 있으면 그것으로 끝낸다(오류는 함께 알린다)
            finishSpeech(partial.isEmpty() ? code : null, partial);
        }
    };

    @Override
    protected void handleOnDestroy() {
        main.post(this::destroyRec);
        if (live.get() == this) live = new WeakReference<>(null);
        super.handleOnDestroy();
    }
}
