package kr.boxworks.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONObject;

/** 알람이 울릴 때 띄우는 알림. 잠금 화면에서는 AlarmActivity가 화면 전체로 뜬다. */
final class AlarmNotify {
    static final String CHANNEL = "bx_alarm_v1";
    static final String CHANNEL_REPORT = "bx_report_v1";
    static final int REPORT_ID = 0x0B0B;
    static final String EXTRA_ACT = "bx_act";
    static final long SNOOZE_MS = 5 * 60 * 1000L;

    private AlarmNotify() {}

    /** 인텐트에 실려 온 알람 정보. 예전 형식(제목·내용만)도 읽는다. */
    static JSONObject fromIntent(Intent intent) {
        JSONObject o = null;
        String json = intent == null ? null : intent.getStringExtra(AlarmStore.EXTRA_JSON);
        if (json != null) {
            try {
                o = new JSONObject(json);
            } catch (Exception ignored) {
            }
        }
        if (o == null) {
            o = new JSONObject();
            try {
                if (intent != null) {
                    o.put("id", intent.getStringExtra(AlarmStore.EXTRA_ID));
                    o.put("title", intent.getStringExtra(AlarmStore.EXTRA_TITLE));
                    o.put("body", intent.getStringExtra(AlarmStore.EXTRA_BODY));
                    o.put("at", intent.getLongExtra(AlarmStore.EXTRA_AT, System.currentTimeMillis()));
                }
            } catch (Exception ignored) {
            }
        }
        return o;
    }

    /** 잠금 화면에서 내용을 가리는 알람 채널. 채널의 잠금 화면 표시는 만든 뒤 바꿀 수 없어 따로 둔다 */
    static final String CHANNEL_PRIVATE = "bx_alarm_p1";

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        // 예전 채널(잠금 화면에 내용 표시)은 이름만 바꾼다. 이미 있는 채널을 다시 만들면 이름·설명만 바뀌고 사용자 설정은 남는다
        nm.createNotificationChannel(alarmChannel(CHANNEL, "일정·루틴 알람 (잠금 화면에 제목 표시)", Notification.VISIBILITY_PUBLIC));
        if (nm.getNotificationChannel(CHANNEL_PRIVATE) == null) nm.createNotificationChannel(alarmChannel(CHANNEL_PRIVATE, "일정·루틴 알람", Notification.VISIBILITY_PRIVATE));
    }

    private static NotificationChannel alarmChannel(String id, String name, int lock) {
        NotificationChannel ch = new NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("박스웍스 일정과 루틴 알람");
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        ch.setSound(sound, new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build());
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[] {0, 600, 400, 600});
        ch.setLockscreenVisibility(lock);
        return ch;
    }

    /** 잠금 화면에 보일 제목. 루틴 단계 이름은 보이고, 일정 제목은 화면이 넘긴 pt(예: '일정 알림')로 바꾼다 */
    static String pubTitle(Context c, JSONObject o) {
        if ("none".equals(AlarmStore.lockMode(c))) return "박스웍스 알람";
        String pt = o.optString("pt", "");
        if (!pt.isEmpty()) return pt;
        return "routine".equals(o.optString("kind")) ? o.optString("title", "박스웍스 알람") : "박스웍스 알람";
    }

    static String pubSub(Context c, JSONObject o) {
        if ("none".equals(AlarmStore.lockMode(c))) return "잠금을 풀면 보여요";
        String ps = o.optString("ps", "");
        if (!ps.isEmpty()) return ps;
        return "routine".equals(o.optString("kind")) ? o.optString("sub", "") : "잠금을 풀면 보여요";
    }

    /** 잠금 화면에서 제목·내용을 그대로 보여도 되는지 */
    static boolean showAllOnLock(Context c) {
        return "title".equals(AlarmStore.lockMode(c));
    }

    /**
     * 아침 보고(4안-5). 소리 나는 알람이 아니라 보통 알림으로, 오늘 일정 요약을 펼쳐 보여 준다.
     * 아침 루틴 첫 알람을 확인한 직후나, 정한 시각에 뜬다.
     */
    static void showReport(Context c, JSONObject r) {
        if (r == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            // 이름이 바뀌어도(11/1 "아침 보고" → "아침에 오늘 일정") 이미 있는 채널의 이름·설명만 새로 쓴다. 중요도·잠금 화면 표시는 처음 값 그대로
            if (nm != null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL_REPORT, "아침에 오늘 일정", NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription("하루를 시작할 때 오늘 일정을 요약해 보여 줘요");
                ch.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
                nm.createNotificationChannel(ch);
            }
        }
        String title = r.optString("title", "오늘 일정");
        String text = r.optString("text", "");
        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, REPORT_ID, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent close = new Intent(c, AlarmActionReceiver.class);
        close.setAction("kr.boxworks.app.ACT.report-close");
        close.putExtra(EXTRA_ACT, "report-close");
        PendingIntent closePi = PendingIntent.getBroadcast(c, REPORT_ID + 1, close,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // 아침 보고는 오늘 일정 목록이라 잠금 화면에서는 늘 가린다(대표 결정 10/31)
        NotificationCompat.Builder pub = new NotificationCompat.Builder(c, CHANNEL_REPORT)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle("오늘 일정")
            .setContentText("잠금을 풀면 보여요");
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL_REPORT)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(pub.build())
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(text.split("\n", 2)[0])
            .setStyle(new NotificationCompat.BigTextStyle().setBigContentTitle(title).bigText(text))
            .setSubText("오늘 일정")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(openPi)
            .addAction(0, "오늘 보기", openPi)
            .addAction(0, "보내기", sharePi(c, title, text))
            .addAction(0, "닫기", closePi);
        try {
            NotificationManagerCompat.from(c).notify(REPORT_ID, b.build());
        } catch (SecurityException ignored) {
            // 알림 권한이 꺼져 있으면 띄우지 못한다.
        }
    }

    /** 아침 보고를 카카오톡·메일 등으로 보내는 휴대폰 공유 창(대표 요청). 보내는 앱과 받는 사람은 사용자가 고른다 */
    private static PendingIntent sharePi(Context c, String title, String text) {
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_SUBJECT, "박스웍스 · " + title);
        send.putExtra(Intent.EXTRA_TEXT, title + "\n\n" + text);
        Intent chooser = Intent.createChooser(send, "오늘 일정 보내기");
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(c, REPORT_ID + 2, chooser,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /**
     * 명상 종소리(싱잉볼). 화면 전체 알람 없이 소리 한 번과 알림만. 소리마다 알림 채널이 따로다(채널 소리는 바꿀 수 없어서).
     * sound: bowl(시작), bowl3(끝, 세 번), bowl_soft(중간 종)
     */
    static void showSoft(Context c, JSONObject o) {
        // 소리는 BowlPlayer가 직접 튼다. 알림은 소리 없는 채널로 글만 보여 준다
        String ch = "bx_soft_v2";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(ch) == null) {
                NotificationChannel nc = new NotificationChannel(ch, "명상·싱잉볼 알림", NotificationManager.IMPORTANCE_HIGH);
                nc.setDescription("싱잉볼 종이 울릴 때 함께 보이는 알림이에요. 소리는 앱이 직접 내요");
                nc.setSound(null, null);
                nc.enableVibration(false);
                nc.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(nc);
            }
        }
        String id = o.optString("id");
        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, notifId(id) + 1, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String title = o.optString("title");
        if (title.isEmpty()) title = "박스웍스";
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, ch)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(o.optString("sub", o.optString("body")))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSilent(true)
            .setAutoCancel(true)
            .setContentIntent(openPi);
        if (!o.optString("series").isEmpty()) b.addAction(0, "확인", actionPi(c, "ok", o));
        try {
            NotificationManagerCompat.from(c).notify(notifId(id), b.build());
        } catch (SecurityException ignored) {
        }
    }

    static int notifId(String id) {
        return id == null ? 0 : id.hashCode();
    }

    /**
     * 울리는 방식(전체 흐름 와이어프레임 18): alarm = 잠금 화면에 크게·확인할 때까지(아래 show),
     * notice = 위에서 내려오는 알림·소리 한 번, quiet = 알림창에만. 5분 뒤로 미루면 같은 lv로 다시 울린다
     */
    static final String CHANNEL_NOTICE = "bx_notice_p1";
    static final String CHANNEL_QUIET = "bx_quiet_p1";

    static void showNotice(Context c, JSONObject o, boolean quiet) {
        String ch = quiet ? CHANNEL_QUIET : CHANNEL_NOTICE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(ch) == null) {
                NotificationChannel nc = new NotificationChannel(ch, quiet ? "조용한 알림" : "일정 알림",
                    quiet ? NotificationManager.IMPORTANCE_LOW : NotificationManager.IMPORTANCE_HIGH);
                nc.setDescription(quiet ? "소리 없이 알림창에만 와요" : "위에서 내려오고 소리가 한 번 나요");
                if (quiet) {
                    nc.setSound(null, null);
                    nc.enableVibration(false);
                } else {
                    nc.enableVibration(true);
                }
                nc.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
                nm.createNotificationChannel(nc);
            }
        }
        String id = o.optString("id");
        String title = o.optString("title");
        String body = o.optString("body", o.optString("sub"));
        if (title.isEmpty()) title = "박스웍스";
        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, notifId(id) + 1, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        boolean all = showAllOnLock(c);
        NotificationCompat.Builder pub = new NotificationCompat.Builder(c, ch)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(all ? title : pubTitle(c, o))
            .setContentText(all ? body : pubSub(c, o))
            .addAction(0, "확인", actionPi(c, "ok", o))
            .addAction(0, "5분 뒤", actionPi(c, "snooze", o));
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, ch)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setSubText(o.optString("group", ""))
            .setPriority(quiet ? NotificationCompat.PRIORITY_LOW : NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(pub.build())
            .setAutoCancel(true)
            .setContentIntent(openPi)
            .addAction(0, "확인", actionPi(c, "ok", o))
            .addAction(0, "5분 뒤", actionPi(c, "snooze", o));
        try {
            NotificationManagerCompat.from(c).notify(notifId(id), b.build());
        } catch (SecurityException ignored) {
        }
    }

    static void show(Context c, JSONObject o) {
        String lv = o.optString("lv", "alarm");
        if ("notice".equals(lv) || "quiet".equals(lv)) {
            showNotice(c, o, "quiet".equals(lv));
            return;
        }
        ensureChannel(c);
        String id = o.optString("id");
        String title = o.optString("title");
        String body = o.optString("body");
        if (title.isEmpty()) title = "박스웍스 알람";

        Intent full = new Intent(c, AlarmActivity.class);
        full.putExtra(AlarmStore.EXTRA_JSON, o.toString());
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        PendingIntent fullPi = PendingIntent.getActivity(c, notifId(id), full,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, notifId(id) + 1, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        boolean all = showAllOnLock(c);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, all ? CHANNEL : CHANNEL_PRIVATE)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(all ? NotificationCompat.VISIBILITY_PUBLIC : NotificationCompat.VISIBILITY_PRIVATE)
            .setAutoCancel(true)
            .setContentIntent(openPi)
            .setFullScreenIntent(fullPi, true)
            .addAction(0, "확인", actionPi(c, "ok", o))
            .addAction(0, "5분 뒤", actionPi(c, "snooze", o));
        if (!all) {
            // 잠금 화면에 대신 보이는 글: 루틴은 '씻기 · 출발까지 30분', 일정은 '일정 알림 · 잠금을 풀면 보여요'
            b.setPublicVersion(new NotificationCompat.Builder(c, CHANNEL_PRIVATE)
                .setSmallIcon(R.drawable.ic_stat_bx)
                .setContentTitle(pubTitle(c, o))
                .setContentText(pubSub(c, o))
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .addAction(0, "확인", actionPi(c, "ok", o))
                .addAction(0, "5분 뒤", actionPi(c, "snooze", o))
                .build());
        }
        try {
            NotificationManagerCompat.from(c).notify(notifId(id), b.build());
        } catch (SecurityException ignored) {
            // 알림 권한이 꺼져 있으면 띄우지 못한다. 휴대폰 설정에서 다시 켤 수 있다.
        }
    }

    private static PendingIntent actionPi(Context c, String act, JSONObject o) {
        String id = o.optString("id");
        Intent i = new Intent(c, AlarmActionReceiver.class);
        i.setAction("kr.boxworks.app.ACT." + act + "." + id);
        i.putExtra(EXTRA_ACT, act);
        i.putExtra(AlarmStore.EXTRA_JSON, o.toString());
        return PendingIntent.getBroadcast(c, (act + id).hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void snooze(Context c, JSONObject o) {
        try {
            JSONObject s = new JSONObject(o.toString());
            String base = o.optString("id", "alarm");
            s.put("id", base.endsWith("_s") ? base : base + "_s");
            s.put("at", System.currentTimeMillis() + SNOOZE_MS);
            AlarmStore.addLocal(c, s);
        } catch (Exception ignored) {
        }
    }

    static void dismiss(Context c, String id) {
        NotificationManagerCompat.from(c).cancel(notifId(id));
    }
}
