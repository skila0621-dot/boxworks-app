package kr.boxworks.app;

import android.app.KeyguardManager;
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
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONArray;
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
        nm.createNotificationChannel(alarmChannel(c, CHANNEL, "일정·루틴 알람 (잠금 화면에 제목 표시)", Notification.VISIBILITY_PUBLIC));
        if (nm.getNotificationChannel(CHANNEL_PRIVATE) == null) nm.createNotificationChannel(alarmChannel(c, CHANNEL_PRIVATE, "일정·루틴 알람", Notification.VISIBILITY_PRIVATE));
    }

    /** 앱 이름은 res/values/strings.xml 의 app_name 한 곳에서만 정한다(대표 결정 11/3 23:40, 웹 화면도 빌드 때 같은 값을 읽음) */
    static String appName(Context c) {
        return c.getString(R.string.app_name);
    }

    private static NotificationChannel alarmChannel(Context c, String id, String name, int lock) {
        NotificationChannel ch = new NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription(appName(c) + " 일정과 루틴 알람");
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
        if ("none".equals(AlarmStore.lockMode(c))) return appName(c) + " 알람";
        String pt = o.optString("pt", "");
        if (!pt.isEmpty()) return pt;
        return "routine".equals(o.optString("kind")) ? o.optString("title", appName(c) + " 알람") : appName(c) + " 알람";
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
        send.putExtra(Intent.EXTRA_SUBJECT, appName(c) + " · " + title);
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
        if (title.isEmpty()) title = appName(c);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, ch)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(o.optString("sub", o.optString("body")))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSilent(true)
            .setAutoCancel(true)
            .setTimeoutAfter(30 * 60 * 1000L)
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
    // 시험판 37: 진동을 세 번(길게 · 짧게 · 길게)으로 바꾸려고 새 채널(채널의 진동은 만든 뒤 바꿀 수 없다). 예전 채널은 지운다
    static final String CHANNEL_NOTICE = "bx_notice_p2";
    static final String CHANNEL_NOTICE_OLD = "bx_notice_p1";
    static final long[] NOTICE_VIB = {0, 450, 150, 200, 150, 450};

    /** 위에서 내려오는 '알림' 채널(일정 · 시간표 · 놓친 알람 안내가 함께 쓴다) */
    static void ensureNoticeChannel(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (nm.getNotificationChannel(CHANNEL_NOTICE_OLD) != null) nm.deleteNotificationChannel(CHANNEL_NOTICE_OLD);
        if (nm.getNotificationChannel(CHANNEL_NOTICE) != null) return;
        NotificationChannel nc = new NotificationChannel(CHANNEL_NOTICE, "일정 알림", NotificationManager.IMPORTANCE_HIGH);
        nc.setDescription("위에서 내려오고 소리와 진동(세 번)이 나요. 그대로 두면 3분 · 10분 뒤 한 번씩 더 와요");
        nc.enableVibration(true);
        nc.setVibrationPattern(NOTICE_VIB);
        nc.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        nm.createNotificationChannel(nc);
    }

    /** 알림창에 아직 그대로 있는지(확인 · 5분 뒤 · 눌러 열기 · 밀어 지우기를 하면 사라진다) */
    static boolean isActive(Context c, int nid) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return false;
        try {
            for (android.service.notification.StatusBarNotification sb : nm.getActiveNotifications()) if (sb.getId() == nid) return true;
        } catch (Exception ignored) {
        }
        return false;
    }

    /**
     * 시험판 37(대표 지적 11/3 "유튜브를 보는 중 알림이 위에서 작게 내려와 진동 한 번 뒤 사라지고 끝. 자각하기엔 너무 단조롭다"):
     * '알림'으로 울린 일정 · 시간표가 알림창에 그대로 있으면(아무것도 안 함) 3분 뒤, 10분 뒤 한 번씩 다시 내려온다.
     * 다시 알림(kind nag)은 화면이 짠 알람 목록에 들어 있어, 일정을 완료 · 삭제 · 수정하면 함께 빠진다(BX_alarmPlan)
     */
    static void renotice(Context c, JSONObject o) {
        String of = o.optString("of");
        if (of.isEmpty() || !isActive(c, notifId(of))) return;
        try {
            JSONObject r = new JSONObject(o.toString());
            r.put("id", of);
            r.put("kind", "item");
            r.put("again", o.optInt("nag", 1));
            r.remove("of");
            // 같은 자리의 알림을 새로 올려야 다시 위에서 내려오고 소리 · 진동이 난다
            dismiss(c, of);
            showNotice(c, r, false);
        } catch (Exception ignored) {
        }
    }
    static final String CHANNEL_QUIET = "bx_quiet_p1";

    static void showNotice(Context c, JSONObject o, boolean quiet) {
        String ch = quiet ? CHANNEL_QUIET : CHANNEL_NOTICE;
        if (!quiet) ensureNoticeChannel(c);
        else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
        if (title.isEmpty()) title = appName(c);
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
            .setSubText(o.optString("group", "") + (o.optInt("again", 0) > 0 ? " · 다시 알림" : ""))
            .setPriority(quiet ? NotificationCompat.PRIORITY_LOW : NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(pub.build())
            .setAutoCancel(true)
            .setContentIntent(openPi)
            .addAction(0, "확인", actionPi(c, "ok", o))
            .addAction(0, "5분 뒤", actionPi(c, "snooze", o));
        // 지난 일정 알림이 알림창에 쌓이지 않게 6시간 뒤 저절로 지운다('알람이 곧 끝나요'는 남긴다)
        if (!"bx_renew".equals(id)) b.setTimeoutAfter(6 * 3600 * 1000L);
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
        if (title.isEmpty()) title = appName(c) + " 알람";

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
        // 휴대폰을 쓰는 중이면(전체 화면 대신 위에서 내려오는 알림만 뜸) 소리는 AlarmRingService가 1분 동안 직접 울린다.
        // 그때 알림은 소리 없는 채널로(채널 소리와 겹치지 않게)
        boolean live = insist(c);
        if (live) ensureLiveChannels(c);
        String chId = live ? (all ? CHANNEL_LIVE_PUB : CHANNEL_LIVE) : (all ? CHANNEL : CHANNEL_PRIVATE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, chId)
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
            // 지난 알람이 알림창에 쌓이지 않게(아이콘 숫자 17, 대표 확인 11/2): 루틴 단계는 1시간 반, 그 밖은 3시간 뒤 저절로 지운다
            .setTimeoutAfter("routine".equals(o.optString("kind")) ? 90 * 60 * 1000L : 3 * 3600 * 1000L)
            .addAction(0, "확인", actionPi(c, "ok", o))
            .addAction(0, "5분 뒤", actionPi(c, "snooze", o));
        if (live) {
            // 위에서 내려오는 작은 알림이라도 눈에 띄게 파란 바탕(서비스 알림만 색을 입힐 수 있다, 대표 지적 11/3 '알람이 너무 작다').
            // 알림을 밀어 지우면 소리도 멈춘다
            b.setColorized(true)
                .setColor(0xFF3555D8)
                .setDeleteIntent(actionPi(c, "ring-off", o));
        }
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
        Notification n = b.build();
        // 휴대폰을 쓰는 중이면 전체 화면 대신 위에서 내려오는 알림만 떠서 소리가 한 번으로 끝났다(문제점 점검 기술 3).
        // 알림 소리 되풀이(FLAG_INSISTENT)도 One UI 9에서는 한 번 짧게 울리고 끝나서(대표 확인 11/3, 수정·보완 목록 2번)
        // 시계 앱처럼 서비스가 알람 소리를 직접 1분 동안 울린다. 서비스를 못 띄우면 그 안에서 되풀이 알림으로 물러선다.
        // 전체 화면이 뜰 때는 알람 화면이 직접 울린다
        if (live) {
            AlarmRingService.start(c, notifId(id), o.optString("series", ""), n);
            return;
        }
        try {
            NotificationManagerCompat.from(c).notify(notifId(id), n);
        } catch (SecurityException ignored) {
            // 알림 권한이 꺼져 있으면 띄우지 못한다. 휴대폰 설정에서 다시 켤 수 있다.
        }
    }

    /** 휴대폰을 쓰는 중 울리는 알람의 알림 채널. 소리는 AlarmRingService가 직접 내므로 채널은 소리·진동 없이 위에서 내려오기만 */
    static final String CHANNEL_LIVE = "bx_alarm_live_p1";
    static final String CHANNEL_LIVE_PUB = "bx_alarm_live1";

    private static void ensureLiveChannels(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        String[][] chs = {{CHANNEL_LIVE, "일정·루틴 알람 (휴대폰을 쓰는 중)"}, {CHANNEL_LIVE_PUB, "일정·루틴 알람 (휴대폰을 쓰는 중, 잠금 화면에 제목 표시)"}};
        for (String[] x : chs) {
            if (nm.getNotificationChannel(x[0]) != null) continue;
            NotificationChannel ch = new NotificationChannel(x[0], x[1], NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("휴대폰을 쓰는 중에 울리는 알람이에요. 소리는 앱이 1분 동안 직접 울려요");
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(CHANNEL_LIVE.equals(x[0]) ? Notification.VISIBILITY_PRIVATE : Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
    }

    /** 휴대폰을 켜고 쓰는 중이거나(잠금 풀림), 전체 화면 알람을 쓸 수 없는지 */
    static boolean insist(Context c) {
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                NotificationManager nm = c.getSystemService(NotificationManager.class);
                if (nm != null && !nm.canUseFullScreenIntent()) return true;
            }
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            KeyguardManager km = (KeyguardManager) c.getSystemService(Context.KEYGUARD_SERVICE);
            return pm != null && pm.isInteractive() && (km == null || !km.isKeyguardLocked());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 알람이 울리기 전에 지난 알림을 지운다: 같은 단계의 앞 알림·다시 알림·5분 뒤, 그리고 이 루틴의 앞 단계들.
     * 전에는 울릴 때마다 알림이 하나씩 쌓여 앱 아이콘 숫자가 17까지 올라갔다(대표 확인 11/2).
     */
    static void tidyBefore(Context c, JSONObject o) {
        String id = o.optString("id");
        String series = o.optString("series", "");
        if (!series.isEmpty()) dismissSeries(c, series, id);
        JSONArray steps = o.optJSONArray("steps");
        long at = o.optLong("at", 0);
        if (steps == null) return;
        for (int i = 0; i < steps.length(); i++) {
            JSONObject st = steps.optJSONObject(i);
            if (st == null) continue;
            String s = st.optString("s", "");
            if (s.isEmpty() || s.equals(series) || st.optLong("at", 0) >= at) continue;
            dismissSeries(c, s, null);
        }
    }

    /** 한 단계 묶음의 알림(처음 것, 다시 알림 1~12번, 5분 뒤)을 지운다. keep은 남긴다 */
    static void dismissSeries(Context c, String series, String keep) {
        String[] ids = new String[14];
        ids[0] = series;
        ids[1] = series + "_s";
        for (int j = 1; j <= 12; j++) ids[j + 1] = series + "_r" + j;
        for (String x : ids) if (keep == null || !keep.equals(x)) dismiss(c, x);
    }

    /** 알림 한 장(놓친 알람, 시간대 바뀜). 위에서 내려오는 일정 알림 채널을 쓴다 */
    static void showInfo(Context c, int notifId, String title, String text) {
        ensureNoticeChannel(c);
        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, notifId, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL_NOTICE)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setTimeoutAfter(12 * 3600 * 1000L)
            .setContentIntent(openPi);
        try {
            NotificationManagerCompat.from(c).notify(notifId, b.build());
        } catch (SecurityException ignored) {
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
