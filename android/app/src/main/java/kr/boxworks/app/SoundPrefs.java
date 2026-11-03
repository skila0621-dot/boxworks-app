package kr.boxworks.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

/**
 * 명상 소리 크기(시험판 44, 대표 요청 11/4 2:09 "원하는 소리만, 소리마다 크기를 조절해서 원하는 환경에서 명상").
 * 종소리(bell)와 배경 소리(bg)를 0~1로 둔다. 휴대폰을 다시 켠 뒤 잠금을 풀기 전에도 종이 같은 크기로 울리게 기기 보호 저장소에 둔다.
 * medCancel: 앱을 최근 목록에서 지워 명상을 멈춘 시각(앱이 다시 열릴 때 '명상 중' 화면을 치운다)
 */
final class SoundPrefs {
    private SoundPrefs() {}

    private static final String PREFS = "bx_sound";

    static SharedPreferences prefs(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Context dp = c.createDeviceProtectedStorageContext();
        return dp.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static float clamp(float v) {
        return Float.isNaN(v) ? 1f : Math.max(0f, Math.min(1f, v));
    }

    static float bell(Context c) {
        try {
            return clamp(prefs(c).getFloat("bell", 1f));
        } catch (Exception e) {
            return 1f;
        }
    }

    static float bg(Context c) {
        try {
            return clamp(prefs(c).getFloat("bg", 1f));
        } catch (Exception e) {
            return 1f;
        }
    }

    static void set(Context c, Double bell, Double bg) {
        try {
            SharedPreferences.Editor e = prefs(c).edit();
            if (bell != null) e.putFloat("bell", clamp(bell.floatValue()));
            if (bg != null) {
                float v = clamp(bg.floatValue());
                e.putFloat("bg", v);
                BgPlayer.vol = v;
            }
            e.apply();
        } catch (Exception ignored) {
        }
    }

    static void medCancel(Context c, long at) {
        try {
            prefs(c).edit().putLong("medCancel", at).apply();
        } catch (Exception ignored) {
        }
    }

    static long medCancel(Context c) {
        try {
            return prefs(c).getLong("medCancel", 0);
        } catch (Exception e) {
            return 0;
        }
    }
}
