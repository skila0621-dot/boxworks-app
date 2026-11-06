package kr.boxworks.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;

/** 박스웍스 화면(웹)과 휴대폰 알람을 잇는 연결부. 웹에서는 Capacitor.Plugins.BxAlarm으로 부른다. */
@CapacitorPlugin(
    name = "BxAlarm",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class BxAlarmPlugin extends Plugin {

    /** 화면이 계산한 앞으로 7일의 알람 목록으로 예약을 바꾼다. */
    @PluginMethod
    public void sync(PluginCall call) {
        JSArray list = call.getArray("alarms", new JSArray());
        // 잠금 화면에 보여 줄 것: alarm(기본) | title | none
        AlarmStore.setLockMode(getContext(), call.getString("lock", null));
        // 시각 표시(시험판 58): 잠금 화면 알람 · 루틴 진행 알림 · 위젯이 같은 표시를 쓴다
        Boolean h24 = call.getBoolean("h24", null);
        if (h24 != null) BxTime.set(getContext(), h24);
        try {
            int n = AlarmStore.replaceAll(getContext(), new JSONArray(list.toString()));
            JSObject r = new JSObject();
            r.put("scheduled", n);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("알람 예약 실패", e);
        }
    }

    /** 앱 안에서 루틴 단계를 '했어요'로 누르면, 휴대폰을 쓰는 중 울리던 알람 소리를 멈춘다(알림은 남는다) */
    /** 시험판 67(결정 사안 s05): '들어 보기' — 휴대폰 목소리로 읽어 본다. {ok, why: lang(한국어 목소리 없음) · init · speak · timeout} */
    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        BxSay.say(getContext(), text, (ok, why) -> {
            JSObject r = new JSObject();
            r.put("ok", ok);
            r.put("why", why == null ? "" : why);
            call.resolve(r);
        });
    }

    @PluginMethod
    public void ringOff(PluginCall call) {
        AlarmRingService.quietNow(getContext());
        call.resolve();
    }

    /** 몇 초 뒤 시험 알람을 울린다(설정 > 휴대폰 알람 시험). */
    @PluginMethod
    public void test(PluginCall call) {
        int seconds = call.getInt("seconds", 10);
        try {
            long at = System.currentTimeMillis() + seconds * 1000L;
            JSONObject o = new JSONObject();
            o.put("id", "test_" + at);
            o.put("at", at);
            o.put("kind", "item");
            o.put("group", "알람 시험");
            o.put("title", call.getString("title", "알람 시험"));
            o.put("sub", call.getString("sub", "이렇게 울려요"));
            o.put("body", call.getString("body", "실제 알람도 이렇게 울려요"));
            AlarmStore.addLocal(getContext(), o);
            call.resolve();
        } catch (Exception e) {
            call.reject("시험 알람 실패", e);
        }
    }

    /** 싱잉볼 미리 듣기·명상 시작 종(앱 안에서). sound: bowl | bowl_soft | bowl3, type: clear | deep | crystal | chime | stop */
    @PluginMethod
    public void bowl(PluginCall call) {
        String type = call.getString("type", "clear");
        if ("stop".equals(type)) BowlPlayer.stopPreview();
        else BowlPlayer.preview(getContext(), call.getString("sound", "bowl"), type);
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(statusObject());
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || notificationsOn()) {
            call.resolve(statusObject());
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsResult");
    }

    @PermissionCallback
    private void notificationsResult(PluginCall call) {
        call.resolve(statusObject());
    }

    /** 앱이 직접 거는 알람(명상 끝 종 등). 화면 목록을 다시 받아도 지워지지 않는다 */
    @PluginMethod
    public void local(PluginCall call) {
        JSArray list = call.getArray("alarms", new JSArray());
        int n = 0;
        try {
            JSONArray a = new JSONArray(list.toString());
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.optJSONObject(i);
                if (o == null || o.optString("id").isEmpty() || o.optLong("at", 0) <= System.currentTimeMillis()) continue;
                AlarmStore.addLocal(getContext(), o);
                n++;
            }
        } catch (Exception e) {
            call.reject("알람을 걸지 못했어요", e);
            return;
        }
        JSObject r = new JSObject();
        r.put("scheduled", n);
        call.resolve(r);
    }

    @PluginMethod
    public void cancelLocal(PluginCall call) {
        JSObject r = new JSObject();
        r.put("cancelled", AlarmStore.cancelPrefix(getContext(), call.getString("prefix", "")));
        call.resolve(r);
    }

    /** 휴대폰 알람에서 '확인'·'5분 뒤'를 누른 묶음(series → 누른 시각). 앱이 루틴 단계를 '했어요'로 옮길 때 쓴다 */
    @PluginMethod
    public void confirmed(PluginCall call) {
        JSObject r = new JSObject();
        try {
            r.put("done", new JSObject(AlarmStore.loadDone(getContext()).toString()));
        } catch (Exception e) {
            r.put("done", new JSObject());
        }
        call.resolve(r);
    }

    /** 휴대폰 설정 화면을 연다: exact(정확한 알람), fullscreen(잠금 화면 알람), notifications, battery(앱 정보 → 배터리), app */
    @PluginMethod
    public void openSettings(PluginCall call) {
        String which = call.getString("which", "app");
        Context c = getContext();
        String pkg = c.getPackageName();
        Intent i;
        if ("exact".equals(which) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + pkg));
        } else if ("fullscreen".equals(which) && Build.VERSION.SDK_INT >= 34) {
            i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + pkg));
        } else if ("battery".equals(which)) {
            // 박스웍스 앱 정보 → '배터리' → '제한 없음'(시험판 34, 대표 지적 11/3: 삼성 '절전 앱·깊은 절전 앱'에 들어가면 알람이 늦거나 안 울림).
            // 예전에 열던 '배터리 사용량 최적화' 목록은 길어서 박스웍스를 찾기 번거로웠다. 삼성은 '제한 없음'인 앱을 자동 절전에서 뺀다
            i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
        } else if ("notifications".equals(which) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
        } else {
            i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            c.startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("설정 화면을 열 수 없어요");
        }
    }

    private boolean notificationsOn() {
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private JSObject statusObject() {
        Context c = getContext();
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            exact = am != null && am.canScheduleExactAlarms();
        }
        boolean full = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            full = nm != null && nm.canUseFullScreenIntent();
        }
        boolean battery = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager) c.getSystemService(Context.POWER_SERVICE);
            battery = pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName());
        }
        // 배터리 '제한'(백그라운드 실행 막힘)이면 알람이 울리지 않을 수 있다. 대기 버킷(10 활성 · 40 드묾 · 45 제한)은 문제를 볼 때 쓴다
        boolean restricted = false;
        int bucket = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                android.app.ActivityManager amg = (android.app.ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
                restricted = amg != null && amg.isBackgroundRestricted();
            } catch (Exception ignored) {
            }
            try {
                android.app.usage.UsageStatsManager us = (android.app.usage.UsageStatsManager) c.getSystemService(Context.USAGE_STATS_SERVICE);
                if (us != null) bucket = us.getAppStandbyBucket();
            } catch (Exception ignored) {
            }
        }
        JSObject r = new JSObject();
        r.put("notifications", notificationsOn());
        r.put("exact", exact);
        r.put("fullScreen", full);
        r.put("battery", battery);
        r.put("restricted", restricted);
        r.put("bucket", bucket);
        // 삼성 휴대폰은 '절전 앱·깊은 절전 앱' 때문에 절전에서 빼기를 꼭 할 일로 묻는다
        r.put("maker", Build.MANUFACTURER == null ? "" : Build.MANUFACTURER.toLowerCase(java.util.Locale.ROOT));
        r.put("sdk", Build.VERSION.SDK_INT);
        r.put("scheduled", AlarmStore.load(c).length());
        return r;
    }
}
