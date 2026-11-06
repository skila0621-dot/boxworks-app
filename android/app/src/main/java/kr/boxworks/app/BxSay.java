package kr.boxworks.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 시험판 67(결정 사안 s05 '나 루틴마다 스위치(처음 꺼짐)'): 단계 이름을 휴대폰 목소리(TextToSpeech)로 읽는다.
 * - 알람 소리와 같은 길(알람 음량, 무음 모드에서도)로 읽고, 다 읽은 뒤 done을 부른다(알람 화면 · 서비스는 그 뒤 알람 소리를 튼다)
 * - 한국어 목소리가 없거나 준비가 늦으면(6초) 읽지 않고 바로 done — 알람이 늦어지지 않게
 * - 한 번에 하나만: 새로 읽으면 앞의 것은 멈춘다. stop()은 '확인' · '5분 뒤'를 누를 때
 */
final class BxSay {
    private BxSay() {}

    interface Result { void on(boolean ok, String why); }

    private static final long WAIT_MS = 6000;
    private static TextToSpeech cur;

    static void say(Context c, String text, Runnable done) {
        say(c, text, (ok, why) -> { if (done != null) done.run(); });
    }

    static synchronized void say(Context c, String text, Result res) {
        final Handler h = new Handler(Looper.getMainLooper());
        final AtomicBoolean fin = new AtomicBoolean(false);
        final TextToSpeech[] box = new TextToSpeech[1];
        final java.util.function.BiConsumer<Boolean, String> finish = (ok, why) -> {
            if (!fin.compareAndSet(false, true)) return;
            h.post(() -> {
                TextToSpeech t = box[0];
                synchronized (BxSay.class) { if (cur == t) cur = null; }
                if (t != null) {
                    try { t.shutdown(); } catch (Exception ignored) { }
                }
                if (res != null) res.on(ok, why);
            });
        };
        if (text == null || text.trim().isEmpty()) { finish.accept(false, "empty"); return; }
        stop();
        try {
            box[0] = new TextToSpeech(c.getApplicationContext(), status -> {
                TextToSpeech t = box[0];
                if (status != TextToSpeech.SUCCESS || t == null) { finish.accept(false, "init"); return; }
                int lang = t.setLanguage(Locale.KOREAN);
                if (lang == TextToSpeech.LANG_MISSING_DATA || lang == TextToSpeech.LANG_NOT_SUPPORTED) { finish.accept(false, "lang"); return; }
                t.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
                t.setSpeechRate(0.95f);
                t.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { }
                    @Override public void onDone(String id) { finish.accept(true, ""); }
                    @Override public void onError(String id) { finish.accept(false, "speak"); }
                    @Override public void onStop(String id, boolean interrupted) { finish.accept(false, "stop"); }
                });
                Bundle p = new Bundle();
                p.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1f);
                if (t.speak(text.trim(), TextToSpeech.QUEUE_FLUSH, p, "bx_say") != TextToSpeech.SUCCESS) finish.accept(false, "speak");
            });
            synchronized (BxSay.class) { cur = box[0]; }
        } catch (Exception e) {
            finish.accept(false, "init");
            return;
        }
        // 목소리 준비가 늦거나 끝 알림이 오지 않으면 그대로 넘어간다(알람이 늦어지지 않게, 읽는 중이면 끊지 않고 끝까지)
        h.postDelayed(() -> {
            TextToSpeech t = box[0];
            boolean speaking = false;
            try { speaking = t != null && t.isSpeaking(); } catch (Exception ignored) { }
            if (!speaking) finish.accept(false, "timeout");
            else h.postDelayed(() -> finish.accept(true, ""), WAIT_MS);
        }, WAIT_MS);
    }

    /** 읽는 중이면 멈춘다(알람에서 '확인' · '5분 뒤'를 눌렀을 때) */
    static synchronized void stop() {
        if (cur == null) return;
        try { cur.stop(); } catch (Exception ignored) { }
        try { cur.shutdown(); } catch (Exception ignored) { }
        cur = null;
    }
}
