package kr.boxworks.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

/**
 * 말로 넣기(3단계). 휴대폰 기본 음성 인식 창을 열어 받은 글자를 돌려준다.
 * 소리는 우리 서버로 가지 않고, 비용도 들지 않는다(D-02). 해석은 박스웍스 규칙이 맡는다.
 */
@CapacitorPlugin(name = "BxSpeech")
public class BxSpeechPlugin extends Plugin {

    @PluginMethod
    public void listen(PluginCall call) {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ko-KR");
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, call.getString("prompt", "말해 보세요"));
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
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
}
