package kr.boxworks.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 싱잉볼 종소리를 앱이 직접 끝까지 튼다(대표 지적: 종이 한 번 울리고 끝남).
 * 알림 채널 소리에 맡기면 휴대폰 설정에 따라 잘리거나 안 날 수 있어서, 알람 소리 크기(USAGE_ALARM)로 직접 재생한다.
 * 화면이 꺼져 있어도 끝까지 나도록 재생하는 동안만 잠깐 깨어 있게 한다.
 */
final class BowlPlayer {
    private BowlPlayer() {}

    /**
     * 싱잉볼 종류(2판, 대표 지적 10/31: 더 맑고 길게, 종류 여러 가지): clear 맑은 볼 · deep 깊은 볼 · crystal 크리스탈 볼 · chime 작은 종.
     * sound: bowl(한 번), bowl_soft(중간 종, 작게), bowl3(끝, 세 번). 파일은 scripts/sound/make-bowl.py로 만든다
     */
    static int rawFor(Context c, String sound, String type) {
        String t = type != null && type.matches("[a-z]{3,12}") ? type : "clear";
        boolean end = "bowl3".equals(sound);
        String pkg = c.getPackageName();
        int id = c.getResources().getIdentifier("bx_bowl_" + t + (end ? "_end" : ""), "raw", pkg);
        if (id == 0) id = c.getResources().getIdentifier("bx_bowl_clear" + (end ? "_end" : ""), "raw", pkg);
        return id;
    }

    static float volumeFor(String sound) {
        return "bowl_soft".equals(sound) ? 0.55f : 1f;
    }

    /** 미리 듣기(명상 화면·루틴 창의 ▶). 앞의 미리 듣기는 멈추고 새로 튼다 */
    private static MediaPlayer preview;

    static synchronized void preview(Context c, String sound, String type) {
        try {
            if (preview != null) {
                preview.release();
                preview = null;
            }
        } catch (Exception ignored) {
        }
        preview = start(c, sound, type, null);
    }

    static synchronized void stopPreview() {
        try {
            if (preview != null) preview.release();
        } catch (Exception ignored) {
        }
        preview = null;
    }

    private static MediaPlayer start(Context c, String sound, String type, Runnable onEnd) {
        try {
            MediaPlayer mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            mp.setWakeMode(c.getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            AssetFileDescriptor afd = c.getResources().openRawResourceFd(rawFor(c, sound, type));
            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mp.setOnCompletionListener(m -> { m.release(); if (onEnd != null) onEnd.run(); });
            mp.setOnErrorListener((m, what, extra) -> { m.release(); if (onEnd != null) onEnd.run(); return true; });
            mp.prepare();
            float v = volumeFor(sound);
            mp.setVolume(v, v);
            mp.start();
            return mp;
        } catch (Exception e) {
            if (onEnd != null) onEnd.run();
            return null;
        }
    }

    static void play(Context c, String sound, String type, BroadcastReceiver.PendingResult pr) {
        AtomicBoolean done = new AtomicBoolean(false);
        Runnable finish = () -> {
            if (pr != null && done.compareAndSet(false, true)) {
                try {
                    pr.finish();
                } catch (Exception ignored) {
                }
            }
        };
        start(c, sound, type, finish);
        // 방송 처리는 9초 안에 끝내야 해서 그때 놓아 주고, 소리는 끝까지 이어진다
        new Handler(Looper.getMainLooper()).postDelayed(finish, 9000);
    }
}
