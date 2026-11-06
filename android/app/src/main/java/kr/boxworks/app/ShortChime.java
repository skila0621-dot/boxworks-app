package kr.boxworks.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 시험판 52(대표 11/4 16:58, D-25): 루틴 '짧게 한 번' 단계의 소리. 휴대폰 알림 소리 한 번 + 짧은 진동 한 번, 저절로 멈추고 누를 것이 없다.
 * "가볍게 알람을 울려 주면서 지금쯤 씻기를 해야 하는구나" · "잠깐 집중력이 다른 곳으로 흘러갔다면 짧게 울리는 알람으로 다시 준비로"
 * - 꼭 울림 알람처럼 알람 소리 크기(USAGE_ALARM)로 낸다. 무음으로 자는 사람도 아침 루틴은 들리게(꼭 울림 알람도 그렇게 울린다)
 * - 알람 소리 크기보다 조금 작게(70%), 3초가 지나면 끊는다(긴 알림 소리를 고른 휴대폰)
 * - 유튜브 같은 소리는 그동안 잠깐 줄인다. 통화 중에는 소리 없이 진동만
 */
final class ShortChime {
    private ShortChime() {}

    private static final long MAX_MS = 3000;
    private static final float VOLUME = 0.7f;

    static void play(Context c, BroadcastReceiver.PendingResult pr) {
        play(c, pr, "");
    }

    /** say: 시험판 67(결정 사안 s05) — 짧은 소리가 끝난 뒤 단계 이름을 읽는다(통화 중에는 읽지 않음) */
    static void play(Context c, BroadcastReceiver.PendingResult pr, String say) {
        Context ctx = c.getApplicationContext();
        AtomicBoolean done = new AtomicBoolean(false);
        Handler h = new Handler(Looper.getMainLooper());
        AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        vibrate(ctx, attrs);
        int mode = am == null ? AudioManager.MODE_NORMAL : am.getMode();
        boolean call = mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION;
        MediaPlayer mp = null;
        AudioFocusRequest focus = null;
        if (!call) {
            try {
                Uri uri = RingtoneManager.getActualDefaultRingtoneUri(ctx, RingtoneManager.TYPE_NOTIFICATION);
                if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                if (uri != null) {
                    if (am != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(attrs).build();
                        am.requestAudioFocus(focus);
                    }
                    mp = new MediaPlayer();
                    mp.setAudioAttributes(attrs);
                    mp.setWakeMode(ctx, PowerManager.PARTIAL_WAKE_LOCK);
                    mp.setDataSource(ctx, uri);
                    mp.setVolume(VOLUME, VOLUME);
                    mp.prepare();
                }
            } catch (Exception e) {
                if (mp != null) {
                    try {
                        mp.release();
                    } catch (Exception ignored) {
                    }
                }
                mp = null;
            }
        }
        final MediaPlayer player = mp;
        final AudioFocusRequest fr = focus;
        Runnable finish = () -> {
            if (!done.compareAndSet(false, true)) return;
            if (player != null) {
                try {
                    player.release();
                } catch (Exception ignored) {
                }
            }
            if (am != null && fr != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    am.abandonAudioFocusRequest(fr);
                } catch (Exception ignored) {
                }
            }
            Runnable end = () -> {
                if (pr != null) {
                    try {
                        pr.finish();
                    } catch (Exception ignored) {
                    }
                }
            };
            if (!call && say != null && !say.isEmpty()) BxSay.say(ctx, say, end);
            else end.run();
        };
        if (player == null) {
            h.postDelayed(finish, 400);
            return;
        }
        player.setOnCompletionListener(m -> finish.run());
        player.setOnErrorListener((m, what, extra) -> {
            finish.run();
            return true;
        });
        try {
            player.start();
        } catch (Exception e) {
            finish.run();
            return;
        }
        h.postDelayed(finish, MAX_MS);
    }

    private static void vibrate(Context c, AudioAttributes attrs) {
        try {
            Vibrator v;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) c.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                v = vm == null ? null : vm.getDefaultVibrator();
            } else {
                v = (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) v.vibrate(VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE), attrs);
            else v.vibrate(300);
        } catch (Exception ignored) {
        }
    }
}
