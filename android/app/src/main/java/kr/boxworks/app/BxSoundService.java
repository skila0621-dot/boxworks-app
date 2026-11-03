package kr.boxworks.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

/**
 * 명상·공부 배경 소리(시험판 33, 대표 요청·결정 11/3, 결정 기록 D-12). 화면을 꺼도 계속 나오게 음악 앱처럼
 * 미디어 재생 포그라운드 서비스(mediaPlayback)로 튼다. 알림창에 '배경 소리 · 파도'와 '끄기'가 보인다.
 * mode: only(소리만 틀기, 끌 때까지) · med(명상, until에 8초 동안 줄이며 끝 종과 함께 꺼짐).
 * 멈추는 때: 앱의 '소리 끄기'·알림의 '끄기', 명상이 끝남, 이어폰이 빠짐, 다른 앱이 소리를 틂(전화·음성 입력은 잠깐 멈췄다 이어짐).
 * 싱잉볼 종은 알람 소리(BowlPlayer)로 따로 울려 배경 소리 위에 들린다.
 */
public class BxSoundService extends Service {
    static final String ACTION_PLAY = "kr.boxworks.app.BG_PLAY";
    private static final String EXTRA_SOUND = "sound";
    private static final String EXTRA_MODE = "mode";
    private static final String EXTRA_START = "startAt";
    private static final String EXTRA_UNTIL = "until";
    private static final String CHANNEL = "bx_bg_v1";
    static final int NOTIF_ID = 0x42470001;

    private static volatile BxSoundService self;
    /** 앱 화면에 알려 줄 지금 상태. 꺼져 있으면 nowSound가 빈 글자 */
    static volatile String nowSound = "";
    static volatile String nowMode = "";
    static volatile long nowUntil = 0;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private BgPlayer player;
    private AudioManager am;
    private AudioFocusRequest focusReq;
    private boolean hasFocus = false;
    private PowerManager.WakeLock wake;
    private boolean noisyOn = false;

    private final AudioManager.OnAudioFocusChangeListener focusL = change -> {
        BgPlayer p = player;
        if (p == null) return;
        if (change == AudioManager.AUDIOFOCUS_GAIN) {
            p.setPaused(false);
            p.setDuck(1f);
        } else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            p.setPaused(true);
        } else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
            p.setDuck(0.3f);
        } else if (change == AudioManager.AUDIOFOCUS_LOSS) {
            hasFocus = false;
            stopPlaying(0.5f);
        }
    };

    /** 이어폰이 빠지면 스피커로 갑자기 나오지 않게 끈다 */
    private final BroadcastReceiver noisy = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) {
            stopPlaying(0.3f);
        }
    };

    /** 앱에서: 배경 소리를 튼다. 이미 나오고 있으면 그 자리에서 바꾼다(앞 소리는 0.4초 동안 줄어듦) */
    static void play(Context c, String sound, String mode, long startAt, long until) {
        Intent i = new Intent(c, BxSoundService.class);
        i.setAction(ACTION_PLAY);
        i.putExtra(EXTRA_SOUND, sound);
        i.putExtra(EXTRA_MODE, mode);
        i.putExtra(EXTRA_START, startAt);
        i.putExtra(EXTRA_UNTIL, until);
        ContextCompat.startForegroundService(c, i);
    }

    /** 앱·알림의 '끄기': 1.2초 동안 줄이고 끈다 */
    static void requestStop(Context c) {
        BxSoundService s = self;
        if (s != null) {
            s.handler.post(() -> s.stopPlaying(1.2f));
            return;
        }
        // 서비스가 없는데 알림만 남아 있으면 알림을 지운다
        try {
            NotificationManagerCompat.from(c).cancel(NOTIF_ID);
        } catch (Exception ignored) {
        }
        clearState();
    }

    private static void clearState() {
        nowSound = "";
        nowMode = "";
        nowUntil = 0;
        BxSoundPlugin.changed();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        self = this;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || !ACTION_PLAY.equals(intent.getAction())) {
            if (player == null) {
                goForeground("", "only");
                finishService();
            }
            return START_NOT_STICKY;
        }
        String sound = intent.getStringExtra(EXTRA_SOUND);
        String mode = intent.getStringExtra(EXTRA_MODE);
        if (mode == null) mode = "only";
        long startAt = intent.getLongExtra(EXTRA_START, 0);
        long until = intent.getLongExtra(EXTRA_UNTIL, 0);
        // 포그라운드 서비스는 먼저 알림부터 띄워야 한다
        if (!goForeground(sound, mode)) {
            finishService();
            return START_NOT_STICKY;
        }
        if (!BgPlayer.valid(sound) || (until > 0 && until <= System.currentTimeMillis())) {
            stopPlaying(0.3f);
            return START_NOT_STICKY;
        }
        BxSoundPlugin.previewStop();
        // 전화 중처럼 소리를 낼 수 없으면 틀지 않는다
        if (!hasFocus && !requestFocus()) {
            stopPlaying(0.1f);
            return START_NOT_STICKY;
        }
        acquireWake(until);
        if (!noisyOn) {
            try {
                // 휴대폰(시스템)이 보내는 알림만 받는다(다른 앱은 보낼 수 없게)
                ContextCompat.registerReceiver(this, noisy, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY), ContextCompat.RECEIVER_NOT_EXPORTED);
                noisyOn = true;
            } catch (Exception ignored) {
            }
        }
        BgPlayer old = player;
        player = new BgPlayer(this, sound, startAt, until, 3f, 8f, this::onPlayerEnded);
        if (old != null) old.finish(0.4f);
        nowSound = sound;
        nowMode = mode;
        nowUntil = until;
        player.start();
        BxSoundPlugin.changed();
        return START_NOT_STICKY;
    }

    private void onPlayerEnded(BgPlayer p) {
        handler.post(() -> {
            if (p == player) {
                player = null;
                finishService();
            }
        });
    }

    /** 지금 소리를 fade초 동안 줄이고 끈다. 다 줄면 서비스도 내린다 */
    private void stopPlaying(float fade) {
        BgPlayer p = player;
        if (p != null) p.finish(fade);
        else finishService();
    }

    private void finishService() {
        abandonFocus();
        if (noisyOn) {
            try {
                unregisterReceiver(noisy);
            } catch (Exception ignored) {
            }
            noisyOn = false;
        }
        try {
            if (wake != null && wake.isHeld()) wake.release();
        } catch (Exception ignored) {
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE);
            else stopForeground(true);
        } catch (Exception ignored) {
        }
        stopSelf();
        clearState();
    }

    private boolean goForeground(String sound, String mode) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel nc = new NotificationChannel(CHANNEL, "배경 소리", NotificationManager.IMPORTANCE_LOW);
                nc.setDescription("명상하거나 공부할 때 틀어 둔 배경 소리를 끌 수 있는 알림이에요");
                nc.setSound(null, null);
                nc.enableVibration(false);
                nc.setShowBadge(false);
                nc.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(nc);
            }
        }
        Intent open = new Intent(this, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(this, NOTIF_ID, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stopPi = PendingIntent.getBroadcast(this, NOTIF_ID + 1, new Intent(this, StopReceiver.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String name = BgPlayer.label(sound);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(name.isEmpty() ? "배경 소리" : "배경 소리 · " + name)
            .setContentText("med".equals(mode) ? "명상이 끝나면 같이 꺼져요" : "끌 때까지 계속 나와요")
            .setOngoing(true)
            .setSilent(true)
            .setShowWhen(false)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(openPi)
            .addAction(0, "끄기", stopPi)
            .build();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(NOTIF_ID, n);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean requestFocus() {
        am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return true;
        int r;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build())
                .setOnAudioFocusChangeListener(focusL, handler)
                .setWillPauseWhenDucked(false)
                .build();
            r = am.requestAudioFocus(focusReq);
        } else {
            r = am.requestAudioFocus(focusL, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
        hasFocus = r == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        return hasFocus;
    }

    private void abandonFocus() {
        if (am == null || !hasFocus) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusReq != null) am.abandonAudioFocusRequest(focusReq);
            else am.abandonAudioFocus(focusL);
        } catch (Exception ignored) {
        }
        hasFocus = false;
    }

    /** 화면이 꺼져도 끊기지 않게 소리가 나는 동안만 깨어 있게 한다(명상은 끝난 뒤 1분, 소리만 틀기는 8시간까지) */
    private void acquireWake(long until) {
        try {
            if (wake == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm == null) return;
                wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "boxworks:bg");
                wake.setReferenceCounted(false);
            }
            long ms = until > 0 ? Math.max(60_000L, until - System.currentTimeMillis() + 60_000L) : 8 * 3600_000L;
            wake.acquire(ms);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onDestroy() {
        BgPlayer p = player;
        player = null;
        if (p != null) p.finish(0.05f);
        abandonFocus();
        if (noisyOn) {
            try {
                unregisterReceiver(noisy);
            } catch (Exception ignored) {
            }
            noisyOn = false;
        }
        try {
            if (wake != null && wake.isHeld()) wake.release();
        } catch (Exception ignored) {
        }
        if (self == this) self = null;
        clearState();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /** 알림의 '끄기' */
    public static class StopReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context c, Intent i) {
            requestStop(c);
        }
    }
}
