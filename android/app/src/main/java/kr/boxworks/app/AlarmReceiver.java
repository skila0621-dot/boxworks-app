package kr.boxworks.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 예약한 시각이 되면 알림을 띄운다. 휴대폰을 다시 켠 뒤 잠금을 풀기 전에도 울린다(기기 보호 저장소, 문제점 점검 기술 2).
 * 잠금을 풀기 전에는 보통 저장소를 쓰는 위젯·진행 알림은 건너뛴다.
 */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        JSONObject o = AlarmNotify.fromIntent(intent);
        AlarmStore.remove(context, o.optString("id"));
        boolean unlocked = AlarmStore.unlocked(context);
        String kind = o.optString("kind");
        if (o.optString("sound").startsWith("bowl")) {
            // 시험판 47(대표 11/4 2:09 "앱을 종료했다가 다시 실행해도 소리가 나온다"): 명상 중에 앱을 최근 목록에서 지웠으면
            // 남은 명상 종은 울리지 않고 지운다. 배경 소리 없이 종만 쓰는 명상은 소리 서비스가 없어 지운 순간을 알 수 없어서, 종이 울릴 때 앱 카드가 남아 있는지 본다
            if (o.optString("id").startsWith("med_") && !MainActivity.hasTask(context)) {
                MainActivity.stopMeditation(context, true);
                SoundPrefs.medCancel(context, System.currentTimeMillis());
                return;
            }
            // 종소리는 알림 소리에 맡기지 않고 앱이 직접 끝까지 튼다(알림은 소리 없이 글만)
            AlarmNotify.showSoft(context, o);
            // 시험판 44: 종소리를 끈 명상은 끝날 때 소리 없이 알림 글만(bowl_none)
            if (!"bowl_none".equals(o.optString("sound"))) BowlPlayer.play(context, o.optString("sound"), o.optString("bowl", "clear"), goAsync());
            if (unlocked) BxWidgetProvider.refreshAll(context);
            return;
        } else if ("report".equals(kind)) {
            AlarmNotify.showReport(context, o.optJSONObject("report"));
        } else if ("nag".equals(kind)) {
            // 시험판 37: '알림'으로 울린 일정이 알림창에 그대로 있으면 한 번 더(3분 · 10분 뒤). 없으면 아무것도 하지 않는다
            AlarmNotify.renotice(context, o);
        } else if ("rcheck".equals(kind)) {
            // 루틴이 끝난 뒤: 남아 있는 단계 알림을 정리하고, 확인하지 않은 단계가 있을 때만 알람을 한 번 띄운다
            JSONArray check = o.optJSONArray("check");
            if (check != null) {
                for (int i = 0; i < check.length(); i++) {
                    JSONObject c = check.optJSONObject(i);
                    if (c != null && !c.optString("s").isEmpty()) AlarmNotify.dismissSeries(context, c.optString("s"), null);
                }
            }
            java.util.List<String> miss = AlarmStore.unconfirmed(context, check);
            if (!miss.isEmpty()) {
                try {
                    o.put("kind", "routine");
                    o.put("title", "확인하지 않은 단계 " + miss.size() + "개");
                    String names = android.text.TextUtils.join(" · ", miss);
                    o.put("sub", names);
                    o.put("body", o.optString("group") + " · " + names);
                    o.put("next", "앱에서 했는지 표시해 주세요");
                } catch (Exception ignored) {
                }
                AlarmNotify.show(context, o);
            }
        } else {
            // 같은 단계의 앞 알림과 이 루틴의 지난 단계 알림을 먼저 지운다(알림이 쌓여 아이콘 숫자 17, 대표 확인 11/2)
            if ("routine".equals(kind)) AlarmNotify.tidyBefore(context, o);
            AlarmNotify.show(context, o);
            // 루틴 단계 알람이면 알림창의 '진행 중' 알림을 만들거나 고친다
            if ("routine".equals(kind) && unlocked) RoutineOngoing.onAlarm(context, o);
        }
        if (unlocked) BxWidgetProvider.refreshAll(context);
    }
}
