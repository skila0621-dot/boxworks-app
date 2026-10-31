package kr.boxworks.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BxAlarmPlugin.class);
        registerPlugin(BxSpeechPlugin.class);
        registerPlugin(BxCalendarPlugin.class);
        registerPlugin(BxWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        // 화면 끝에서 더 밀 때 안드로이드 12+가 화면 전체를 늘이는 효과(stretch)를 끈다.
        // 홈에서 옆으로 밀어 날짜를 넘길 때 아래 메뉴까지 같이 늘어나 움직여 보이던 문제(대표 지적 10/31)
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
            }
        } catch (Exception ignored) {
        }
    }
}
