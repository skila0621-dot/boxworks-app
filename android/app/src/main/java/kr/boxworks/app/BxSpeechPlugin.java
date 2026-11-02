package kr.boxworks.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

/**
 * 말로 넣기(3단계). 소리는 우리 서버로 가지 않고 비용도 들지 않는다(D-02). 해석은 박스웍스 규칙이 맡는다.
 * listenLong: 앱 안에서 직접 듣는다. 휴대폰 기본 창은 말이 잠깐만 끊겨도 끝나서(대표 지적),
 * 말이 끊겨도 3.5초까지는 이어 듣고, '끝'을 누르거나 1분이 지나면 끝낸다. 듣는 중 글자는 'partial'로 보낸다.
 * listen: 휴대폰 기본 음성 인식 창(listenLong을 쓸 수 없을 때).
 */
@CapacitorPlugin(
    name = "BxSpeech",
    permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "mic") }
)
public class BxSpeechPlugin extends Plugin {
    private static final long QUIET_MS = 3500;
    private static final long MAX_MS = 60000;

    private final Handler main = new Handler(Looper.getMainLooper());
    private SpeechRecognizer rec;
    private PluginCall longCall;
    private final StringBuilder said = new StringBuilder();
    private String partial = "";
    private long started, lastVoice;
    private boolean stopping;

    @PluginMethod
    public void listen(PluginCall call) {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ko-KR");
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, call.getString("prompt", "말해 보세요"));
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        try {
            startActivityForResult(call, i, "listenResult");
        } catch (ActivityNotFoundException e) {
            call.reject("이 휴대폰에서 음성 인식을 찾지 못했어요", "unavailable");
        }
    }

    @ActivityCallback
    private void listenResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null) {
            call.reject("취소했어요", "cancelled");
            return;
        }
        ArrayList<String> list = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        JSObject r = new JSObject();
        r.put("text", list != null && !list.isEmpty() ? list.get(0) : "");
        call.resolve(r);
    }

    @PluginMethod
    public void listenLong(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("이 휴대폰에서 음성 인식을 찾지 못했어요", "unavailable");
            return;
        }
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            requestPermissionForAlias("mic", call, "micResult");
            return;
        }
        startLong(call);
    }

    @PermissionCallback
    private void micResult(PluginCall call) {
        if (getPermissionState("mic") == PermissionState.GRANTED) startLong(call);
        else call.reject("마이크 권한이 없어요", "denied");
    }

    /**
     * 이 휴대폰에서 음성 인식을 쓸 수 있는지. 없으면 화면이 마이크를 숨기고 키보드의 마이크로 안내한다(D-10 보완 11/2).
     * 앱 안에서 듣기(SpeechRecognizer)나 휴대폰 기본 음성 인식 창(RecognizerIntent) 가운데 하나라도 되면 쓸 수 있다고 본다.
     */
    @PluginMethod
    public void available(PluginCall call) {
        boolean ok = false;
        try {
            ok = SpeechRecognizer.isRecognitionAvailable(getContext());
            if (!ok) {
                Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                ok = i.resolveActivity(getContext().getPackageManager()) != null;
            }
        } catch (Exception ignored) {
            ok = true; // 확인하다 실패하면 마이크를 숨기지 않는다(누르면 그때 안내)
        }
        JSObject r = new JSObject();
        r.put("available", ok);
        call.resolve(r);
    }

    /** '끝'을 눌렀을 때. 지금까지 들은 것을 마무리해 listenLong에 돌려준다. */
    @PluginMethod
    public void stop(PluginCall call) {
        main.post(() -> {
            stopping = true;
            if (rec != null) {
                try {
                    rec.stopListening();
                } catch (Exception e) {
                    finish(null);
                }
                // 인식기가 답을 주지 않으면 1.5초 뒤 지금까지 들은 것으로 끝낸다
                main.postDelayed(() -> { if (stopping && longCall != null) finish(null); }, 1500);
            }
            call.resolve();
        });
    }

    private void startLong(PluginCall call) {
        main.post(() -> {
            if (longCall != null) finish(null);
            longCall = call;
            said.setLength(0);
            partial = "";
            started = lastVoice = System.currentTimeMillis();
            stopping = false;
            try {
                rec = SpeechRecognizer.createSpeechRecognizer(getContext());
                rec.setRecognitionListener(listener);
                begin();
            } catch (Exception e) {
                PluginCall c = longCall;
                longCall = null;
                destroy();
                if (c != null) c.reject("음성 인식을 시작하지 못했어요", "unavailable");
            }
        });
    }

    private void begin() {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ko-KR");
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
        rec.startListening(i);
    }

    private String text() {
        String s = said.toString().trim();
        if (!partial.isEmpty()) s = (s + " " + partial).trim();
        return s;
    }

    private void sendPartial() {
        JSObject o = new JSObject();
        o.put("text", text());
        notifyListeners("partial", o);
    }

    /** 한 번 듣기가 끝났을 때: 조용한 시간이 짧으면 이어서 듣고, 아니면 끝낸다. */
    private void afterSession() {
        long now = System.currentTimeMillis();
        if (stopping || now - started > MAX_MS || now - lastVoice > QUIET_MS) {
            finish(null);
            return;
        }
        try {
            begin();
        } catch (Exception e) {
            finish(null);
        }
    }

    private void finish(String errorCode) {
        PluginCall c = longCall;
        longCall = null;
        stopping = false;
        String s = text();
        destroy();
        if (c == null) return;
        if (s.isEmpty() && errorCode != null) {
            c.reject("음성 인식을 하지 못했어요", errorCode);
            return;
        }
        JSObject r = new JSObject();
        r.put("text", s);
        c.resolve(r);
    }

    private void destroy() {
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
        @Override public void onBeginningOfSpeech() { lastVoice = System.currentTimeMillis(); }
        @Override public void onRmsChanged(float rmsdB) { if (rmsdB > 4f) lastVoice = System.currentTimeMillis(); }
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onPartialResults(Bundle b) {
            String p = best(b);
            if (!p.isEmpty()) {
                partial = p;
                lastVoice = System.currentTimeMillis();
                sendPartial();
            }
        }

        @Override
        public void onResults(Bundle b) {
            String r = best(b);
            if (r.isEmpty()) r = partial;
            if (!r.isEmpty()) {
                if (said.length() > 0) said.append(' ');
                said.append(r);
            }
            partial = "";
            sendPartial();
            afterSession();
        }

        @Override
        public void onError(int error) {
            if (!partial.isEmpty()) {
                if (said.length() > 0) said.append(' ');
                said.append(partial);
                partial = "";
            }
            if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                afterSession();
            } else if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                finish("denied");
            } else {
                finish("unavailable");
            }
        }
    };
}
