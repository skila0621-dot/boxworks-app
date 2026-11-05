package kr.boxworks.b;

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
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import androidx.core.app.NotificationManagerCompat;
import java.util.Locale;

/**
 * 강한 알람의 소리(알람 소리 USAGE_ALARM) + 진동을 시계 앱처럼 포그라운드 서비스가 직접 낸다(A의 AlarmRingService와 같은 방식).
 * 알림은 소리 없는 채널로 같이 띄우고, 잠금 화면이면 그 알림의 전체 화면 알람(BAlarmActivity)이 뜬다.
 * 붙잡기(두 번째 울림부터)는 소리 다음에 읽어 준다(TextToSpeech 한국어, 알람 음량). 소리는 60초 뒤 멈추고 알림은 남긴다.
 * 멈추는 때: 대답(BActions), 알림을 밀어 지움, 앱을 엶(알림은 남김), 60초, 다음 알람이 울림(넘겨받음).
 */
public class BRingService extends Service {
    static final String EXTRA_ID = "b_ring_id";
    static final String EXTRA_KEY = "b_ring_key";
    static final String EXTRA_NOTIF = "b_ring_notif";
    static final String EXTRA_SAY = "b_ring_say";
    static final String EXTRA_VIBRATE_ONLY = "b_ring_vib";
    static final String ACTION_QUIET = "kr.boxworks.b.RING_QUIET";
    private static final long RING_MS = 60 * 1000L;
    /** 붙잡기에서 읽어 주기 전에 울리는 시간 */
    private static final long SAY_AFTER_MS = 8 * 1000L;

    /** 지금 울리는 약속(대답한 약속의 소리만 멈추려고) */
    private static volatile String ringingKey = null;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable timeUp = () -> quiet(true);
    private final Runnable sayNow = this::speak;
    private Ringtone ringtone;
    private Vibrator vibrator;
    private PowerManager.WakeLock wake;
    private TextToSpeech tts;
    private boolean ttsReady, ttsFailed, sayPending;
    private String say;
    private boolean vibrateOnly;
    private int currentId = 0;
    private long ringUntil = 0;

    /** 알람 알림을 이 서비스에 맡겨 띄우고 울린다. 서비스를 못 띄우면 알림 소리 채널로 물러선다 */
    static void start(Context c, int notifId, String key, Notification n, Notification fallback, String say, boolean vibrateOnly) {
        Intent i = new Intent(c, BRingService.class);
        i.putExtra(EXTRA_ID, notifId);
        i.putExtra(EXTRA_KEY, key);
        i.putExtra(EXTRA_NOTIF, n);
        if (say != null) i.putExtra(EXTRA_SAY, say);
        i.putExtra(EXTRA_VIBRATE_ONLY, vibrateOnly);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) c.startForegroundService(i);
            else c.startService(i);
        } catch (Exception e) {
            BNotify.notify(c, null, notifId, fallback != null ? fallback : n);
        }
    }

    /** 대답했을 때: 그 약속이 울리는 중이면 소리를 끄고 서비스를 내린다(key가 null이면 무엇이든) */
    static void stopFor(Context c, String key) {
        String k = ringingKey;
        if (k == null || (key != null && !key.equals(k))) return;
        try {
            c.stopService(new Intent(c, BRingService.class));
        } catch (Exception ignored) {
        }
        ringingKey = null;
    }

    /** 앱을 열었을 때 · 알림을 밀어 지웠을 때 · '늦는다고 알리기': 소리만 끄고 알림은 남긴다 */
    static void quietFor(Context c, String key) {
        String k = ringingKey;
        if (k == null || (key != null && !key.equals(k))) return;
        try {
            Intent i = new Intent(c, BRingService.class);
            i.setAction(ACTION_QUIET);
            c.startService(i);
        } catch (Exception e) {
            stopFor(c, key);
        }
    }

    @Override
    @SuppressWarnings("deprecation")
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
        Notification n = intent.getParcelableExtra(EXTRA_NOTIF);
        if (n == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        // 앞 알람이 아직 울리는 중이면 그 알림은 알림창에 남기고 소리만 넘겨받는다
        if (currentId != 0 && currentId != id) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_DETACH);
            } catch (Exception ignored) {
            }
        }
        // 알람 앱이 알람을 이어 울리는 종류(systemExempted)로, 안 되면 짧은 일(shortService, 3분까지)로
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
            try {
                n.flags |= Notification.FLAG_INSISTENT;
                NotificationManagerCompat.from(this).notify(id, n);
            } catch (Exception ignored) {
            }
            stopRinging();
            stopSelf();
            return START_NOT_STICKY;
        }
        currentId = id;
        ringingKey = intent.getStringExtra(EXTRA_KEY);
        say = intent.getStringExtra(EXTRA_SAY);
        vibrateOnly = intent.getBooleanExtra(EXTRA_VIBRATE_ONLY, false);
        ringUntil = System.currentTimeMillis() + RING_MS;
        holdWake();
        startRinging();
        handler.removeCallbacks(timeUp);
        handler.postDelayed(timeUp, RING_MS);
        handler.removeCallbacks(sayNow);
        sayPending = false;
        if (say != null && !say.isEmpty() && !vibrateOnly) {
            initTts();
            handler.postDelayed(sayNow, SAY_AFTER_MS);
        }
        return START_NOT_STICKY;
    }

    private void holdWake() {
        try {
            if (wake == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "b:ring");
                    wake.setReferenceCounted(false);
                }
            }
            if (wake != null) wake.acquire(RING_MS + 15000L);
        } catch (Exception ignored) {
        }
    }

    private void releaseWake() {
        try {
            if (wake != null && wake.isHeld()) wake.release();
        } catch (Exception ignored) {
        }
    }

    /** 소리를 끄고 서비스를 내린다. keep이면 알림을 알림창에 남긴다(60초가 지남 · 앱을 엶) */
    private void quiet(boolean keep) {
        handler.removeCallbacks(timeUp);
        handler.removeCallbacks(sayNow);
        stopRinging();
        stopSpeaking();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(keep ? STOP_FOREGROUND_DETACH : STOP_FOREGROUND_REMOVE);
            else stopForegroundLegacy(!keep);
        } catch (Exception ignored) {
        }
        currentId = 0;
        ringingKey = null;
        releaseWake();
        stopSelf();
    }

    @SuppressWarnings("deprecation")
    private void stopForegroundLegacy(boolean remove) {
        stopForeground(remove);
    }

    private void startRinging() {
        // 같은 소리를 이어서 울리는 중이면 처음부터 다시 틀지 않는다
        if (ringtone != null && ringtone.isPlaying()) return;
        stopRinging();
        if (!vibrateOnly) {
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
        }
        startVibrating();
    }

    @SuppressWarnings("deprecation")
    private void startVibrating() {
        try {
            if (vibrator == null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                    vibrator = vm == null ? null : vm.getDefaultVibrator();
                } else {
                    vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                }
            }
            if (vibrator != null) {
                long[] pattern = { 0, 700, 500 };
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
    }

    // ───────── 읽어 주기 ─────────

    private void initTts() {
        if (tts != null || ttsFailed) return;
        try {
            tts = new TextToSpeech(getApplicationContext(), status -> {
                if (status != TextToSpeech.SUCCESS || tts == null) {
                    ttsFailed = true;
                    return;
                }
                int r = tts.setLanguage(Locale.KOREAN);
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                    ttsFailed = true;
                    return;
                }
                tts.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {
                    }

                    @Override
                    public void onDone(String utteranceId) {
                        handler.post(BRingService.this::afterSpeak);
                    }

                    @Override
                    @SuppressWarnings("deprecation")
                    public void onError(String utteranceId) {
                        handler.post(BRingService.this::afterSpeak);
                    }
                });
                ttsReady = true;
                if (sayPending) handler.post(sayNow);
            });
        } catch (Exception e) {
            ttsFailed = true;
        }
    }

    /** 소리를 잠깐 멈추고 읽어 준다. 아직 준비 중이면 준비되는 대로 */
    private void speak() {
        if (currentId == 0 || say == null || ttsFailed) return;
        if (!ttsReady) {
            sayPending = true;
            return;
        }
        sayPending = false;
        stopRinging();
        try {
            tts.speak(say, TextToSpeech.QUEUE_FLUSH, new Bundle(), "b_say");
        } catch (Exception e) {
            afterSpeak();
        }
    }

    /** 다 읽었으면 남은 시간 동안 다시 울린다 */
    private void afterSpeak() {
        if (currentId == 0) return;
        if (System.currentTimeMillis() < ringUntil - 1000) startRinging();
    }

    private void stopSpeaking() {
        try {
            if (tts != null) tts.stop();
        } catch (Exception ignored) {
        }
    }

    /** 짧은 일(shortService)로 띄웠을 때 3분이 다 되면(60초에 멈추므로 보통은 오지 않음) */
    @Override
    public void onTimeout(int startId) {
        quiet(true);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        stopRinging();
        try {
            if (tts != null) tts.shutdown();
        } catch (Exception ignored) {
        }
        tts = null;
        releaseWake();
        ringingKey = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
