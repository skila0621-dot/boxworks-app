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

    static int rawFor(String sound) {
        if ("bowl3".equals(sound)) return R.raw.bx_bowl3;
        if ("bowl_soft".equals(sound)) return R.raw.bx_bowl_soft;
        return R.raw.bx_bowl;
    }

    static void play(Context c, String sound, BroadcastReceiver.PendingResult pr) {
        AtomicBoolean done = new AtomicBoolean(false);
        Runnable finish = () -> {
            if (pr != null && done.compareAndSet(false, true)) {
                try {
                    pr.finish();
                } catch (Exception ignored) {
                }
            }
        };
        try {
            MediaPlayer mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            mp.setWakeMode(c.getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            AssetFileDescriptor afd = c.getResources().openRawResourceFd(rawFor(sound));
            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mp.setOnCompletionListener(m -> { m.release(); finish.run(); });
            mp.setOnErrorListener((m, what, extra) -> { m.release(); finish.run(); return true; });
            mp.prepare();
            mp.start();
            // 방송 처리는 9초 안에 끝내야 해서 그때 놓아 주고, 소리는 끝까지 이어진다
            new Handler(Looper.getMainLooper()).postDelayed(finish, 9000);
        } catch (Exception e) {
            finish.run();
        }
    }
}
