package kr.boxworks.app;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.core.app.NotificationManagerCompat;

/**
 * 휴대폰을 쓰는 중(잠금이 풀려 있음)이거나 전체 화면 알람을 쓸 수 없을 때, 앱이 직접 알람 소리를 1분 동안 되풀이한다.
 * 이때 안드로이드는 전체 화면 대신 위에서 내려오는 알림만 띄운다. 그 알림 소리를 되풀이하게(FLAG_INSISTENT) 맡겼더니
 * One UI 9에서는 한 번 짧게 울리고 끝났다(대표 확인 11/3: 유튜브·게임 중 루틴 알람, 수정·보완 목록 2번).
 * 그래서 시계 앱처럼 포그라운드 서비스가 알람 소리(USAGE_ALARM)와 진동을 직접 낸다. 알림은 소리 없는 채널로 같이 띄운다.
 * 멈추는 때: '확인'·'5분 뒤'(지우기), 알림을 밀어 지움, 앱을 엶(알림은 남김), 1분이 지남(알림은 남김), 다음 알람이 울림(넘겨받음).
 * 잠금 화면에 전체 화면 알람이 뜨면 그 화면이 직접 울리므로 이 서비스는 쓰지 않는다.
 */
public class AlarmRingService extends Service {
    static final String EXTRA_ID = "bx_ring_id";
    static final String EXTRA_SERIES = "bx_ring_series";
    static final String EXTRA_NOTIF = "bx_ring_notif";
    static final String ACTION_QUIET = "kr.boxworks.app.RING_QUIET";
    private static final long RING_MS = 60 * 1000L;

    private static volatile boolean ringing = false;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeUp = () -> quiet(true);
    private Ringtone ringtone;
    private Vibrator vibrator;
    private int currentId = 0;
    private String currentSeries = "";

    /** 알람 알림을 이 서비스에 맡겨 띄우고 울린다. 서비스를 못 띄우면 알림 소리 되풀이로 물러선다 */
    static void start(Context c, int notifId, String series, Notification n) {
        Intent i = new Intent(c, AlarmRingService.class);
        i.putExtra(EXTRA_ID, notifId);
        i.putExtra(EXTRA_SERIES, series == null ? "" : series);
        i.putExtra(EXTRA_NOTIF, n);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) c.startForegroundService(i);
            else c.startService(i);
        } catch (Exception e) {
            fallback(c, notifId, n);
        }
    }

    private static void fallback(Context c, int notifId, Notification n) {
        try {
            n.flags |= Notification.FLAG_INSISTENT;
            NotificationManagerCompat.from(c).notify(notifId, n);
        } catch (Exception ignored) {
        }
    }

    /** '확인'·'5분 뒤'·알림 지움: 소리를 끄고 서비스를 내린다(알림은 같이 지워진다) */
    static void stop(Context c) {
        if (!ringing) return;
        try {
            c.stopService(new Intent(c, AlarmRingService.class));
        } catch (Exception ignored) {
        }
    }

    /** 앱을 열었을 때: 소리만 끄고 알림은 알림창에 남긴다(아직 '확인'을 누르지 않았으므로) */
    static void quietNow(Context c) {
        if (!ringing) return;
        try {
            Intent i = new Intent(c, AlarmRingService.class);
            i.setAction(ACTION_QUIET);
            c.startService(i);
        } catch (Exception ignored) {
            stop(c);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_QUIET.equals(intent.getAction())) {
            quiet(true);
            return START_NOT_STICKY;
        }
        int id = intent.getIntExtra(EXTRA_ID, 0);
        String series = intent.getStringExtra(EXTRA_SERIES);
        if (series == null) series = "";
        Notification n = intent.getParcelableExtra(EXTRA_NOTIF);
        if (n == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        // 앞 알람이 아직 울리는 중이면: 같은 루틴의 앞 단계 알림은 지우고, 다른 알람의 알림은 알림창에 남긴 채 소리만 넘겨받는다
        if (currentId != 0 && currentId != id) {
            int old = currentId;
            boolean sameSeries = !currentSeries.isEmpty() && currentSeries.equals(series);
            try {
                stopForeground(STOP_FOREGROUND_DETACH);
            } catch (Exception ignored) {
            }
            if (sameSeries) NotificationManagerCompat.from(this).cancel(old);
        }
        // 알람 앱이 알람을 이어 울리는 종류(systemExempted)로 띄우고, 휴대폰이 받지 않으면 짧은 일(shortService, 3분까지)로.
        // 둘 다 안 되면 알림 소리 되풀이로 물러선다
        boolean fg = false;
        if (Build.VERSION.SDK_INT >= 34) {
            try {
                startForeground(id, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED);
                fg = true;
            } catch (Exception e) {
                try {
                    startForeground(id, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE);
                    fg = true;
                } catch (Exception ignored) {
                }
            }
        } else {
            try {
                startForeground(id, n);
                fg = true;
            } catch (Exception ignored) {
            }
        }
        if (!fg) {
            fallback(this, id, n);
            stopRinging();
            stopSelf();
            return START_NOT_STICKY;
        }
        currentId = id;
        currentSeries = series;
        startRinging();
        handler.removeCallbacks(timeUp);
        handler.postDelayed(timeUp, RING_MS);
        return START_NOT_STICKY;
    }

    /** 소리를 끄고 서비스를 내린다. keep이면 알림을 알림창에 남긴다(1분이 지남·앱을 엶) */
    private void quiet(boolean keep) {
        handler.removeCallbacks(timeUp);
        stopRinging();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(keep ? STOP_FOREGROUND_DETACH : STOP_FOREGROUND_REMOVE);
            else stopForeground(!keep);
        } catch (Exception ignored) {
        }
        currentId = 0;
        currentSeries = "";
        stopSelf();
    }

    private void startRinging() {
        // 같은 소리를 이어서 울리는 중이면 처음부터 다시 틀지 않는다(다음 단계 알람이 바로 이어 울릴 때)
        if (ringtone != null && ringtone.isPlaying()) {
            ringing = true;
            return;
        }
        stopRinging();
        try {
            Uri uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            ringtone = RingtoneManager.getRingtone(this, uri);
            if (ringtone != null) {
                ringtone.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) ringtone.setLooping(true);
                ringtone.play();
            }
        } catch (Exception ignored) {
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm == null ? null : vm.getDefaultVibrator();
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator != null) {
                long[] pattern = {0, 700, 500};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build());
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception ignored) {
        }
        ringing = true;
    }

    private void stopRinging() {
        try {
            if (ringtone != null) ringtone.stop();
        } catch (Exception ignored) {
        }
        ringtone = null;
        try {
            if (vibrator != null) vibrator.cancel();
        } catch (Exception ignored) {
        }
        vibrator = null;
        ringing = false;
    }

    /** 짧은 일(shortService)로 띄웠을 때 3분이 다 되면(1분에 멈추므로 보통은 오지 않음) */
    @Override
    public void onTimeout(int startId) {
        quiet(true);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(timeUp);
        stopRinging();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
