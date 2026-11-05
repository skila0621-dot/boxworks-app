package kr.boxworks.app;

import android.content.Context;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * 휴대폰 쪽 시각 글자 하나(시험판 58, 대표 11/4 22:20 설정 › 화면 › 시각 표시).
 * 오전 · 오후(기본, D-24 '오후 3:00') | 24시간('15:00'). 앱이 알람 목록 · 위젯 자료와 함께 h24를 넘기면 저장해 두고,
 * 잠금 화면 알람 · 루틴 진행 알림 · 위젯 두 가지가 모두 이것으로 쓴다. 저장은 알람 목록과 같은 기기 보호 저장소(잠금을 풀기 전에도 읽음).
 */
final class BxTime {
    private static volatile Boolean h24;

    private BxTime() {
    }

    /** 그리기 전에 부른다(서비스 · 위젯은 앱과 따로 깨어날 수 있어서) */
    static void load(Context c) {
        try {
            h24 = AlarmStore.h24(c);
        } catch (Exception e) {
            if (h24 == null) h24 = false;
        }
    }

    static void set(Context c, boolean v) {
        AlarmStore.setH24(c, v);
        h24 = v;
    }

    static boolean is24() {
        Boolean v = h24;
        return v != null && v;
    }

    static String hm(long ms) {
        return new SimpleDateFormat(is24() ? "HH:mm" : "a h:mm", Locale.KOREA).format(new Date(ms));
    }
}
