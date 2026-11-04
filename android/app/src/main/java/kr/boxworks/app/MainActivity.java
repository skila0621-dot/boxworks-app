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
        registerPlugin(BxSoundPlugin.class);
        registerPlugin(BxShareInPlugin.class);
        // 일정 첨부(시험판 42): 사진 선택기 · 카메라 앱 · 파일 창, 앱 안에 줄여서 복사, 백업 zip
        registerPlugin(BxAttachPlugin.class);
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

    /**
     * 시험판 44: 명상 소리 멈추기. 배경 소리가 없는 명상(서비스가 없음)도 앱을 닫으면 남은 종을 지운다.
     * withBells: 남은 명상 종(med_ 알람)도 지우고, 앱이 다시 열릴 때 '명상 중' 화면을 치우게 시각을 남긴다
     */
    static void stopMeditation(android.content.Context c, boolean withBells) {
        BowlPlayer.stopAll();
        if (!withBells) return;
        MedOngoing.clear(c);
        if (AlarmStore.cancelPrefix(c, "med_") > 0) SoundPrefs.medCancel(c, System.currentTimeMillis());
    }

    /**
     * 시험판 47: 이 앱의 카드(최근 목록)가 남아 있는지. 사용자가 최근 목록에서 지웠으면 false.
     * 뒤로 · 홈 단추로 내려 둔 것, 휴대폰이 메모리 때문에 앱을 잠시 끈 것은 카드가 남아 있어 true. 알 수 없으면 true(종은 그대로 울림)
     */
    static boolean hasTask(android.content.Context c) {
        try {
            android.app.ActivityManager am = (android.app.ActivityManager) c.getSystemService(android.content.Context.ACTIVITY_SERVICE);
            if (am == null) return true;
            java.util.List<android.app.ActivityManager.AppTask> t = am.getAppTasks();
            return t == null || !t.isEmpty();
        } catch (Exception e) {
            return true;
        }
    }

    @Override
    public void onDestroy() {
        // 최근 목록에서 지워 끝날 때만(화면 돌리기 · 뒤로 단추는 앱을 뒤로 보낼 뿐이라 여기 오지 않음)
        if (isFinishing() && !isChangingConfigurations()) {
            try {
                stopMeditation(this, true);
                BxSoundService.requestStop(this);
            } catch (Exception ignored) {
            }
        }
        super.onDestroy();
    }

    @Override
    public void onResume() {
        super.onResume();
        // 휴대폰을 쓰는 중 울리던 알람의 알림을 눌러 앱을 열었으면 소리는 멈춘다(알림은 '확인' 전까지 남는다)
        AlarmRingService.quietNow(this);
    }
}
