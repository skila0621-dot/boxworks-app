package kr.boxworks.b;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** 알람 · 알림 · 알람 화면 · 읽어 주기 · 늦음 알리기 글(SPEC 4절, 해요체). 한 곳에서 만들어 모양이 어긋나지 않게 한다 */
final class BText {
    private BText() {}

    /** settings.h24면 '14:20', 아니면 '오후 2:20' */
    static String hm(double ms, boolean h24) {
        return new SimpleDateFormat(h24 ? "HH:mm" : "a h:mm", Locale.KOREA).format(new Date((long) ms));
    }

    /** 1.0 → '1', 2.5 → '2.5' */
    static String n(double v) {
        return BPlanner.jsNum(v);
    }

    /** 알람 화면 맨 위 작은 이름 */
    static String label(String kind) {
        if ("prep".equals(kind)) return "준비 시작";
        if ("leave".equals(kind)) return "출발";
        return "알림";
    }

    /** '도착 예정' = 시작 − 남은 여유 */
    static double arrive(BPlanner.Entry e) {
        return e.start - Math.max(0, e.buffer - e.snoozed) * BPlanner.MIN;
    }

    static double leaveAt(BPlanner.Entry e) {
        return e.leaveAt != null ? e.leaveAt : e.start - (e.travel + e.buffer) * BPlanner.MIN;
    }

    /** 이 단계에서 지금 하면 몇 분 늦는지(준비 단계는 지금 시작, 그 밖은 지금 출발) */
    static double late(String kind, BPlanner.Entry e, double now) {
        if ("prep".equals(kind)) return BPlanner.lateIfStartNow(e, now);
        if ("leave".equals(kind) || "heads".equals(kind)) return BPlanner.lateIfLeaveNow(e, now);
        return 0;
    }

    static String title(String kind, BPlanner.Entry e, double now) {
        String t = e.title == null || e.title.isEmpty() ? "(제목 없음)" : e.title;
        if ("prep".equals(kind)) return "준비 시작 · " + t;
        if ("leave".equals(kind)) return "출발 · " + t;
        if ("heads".equals(kind)) {
            double m = Math.max(1, Math.round((leaveAt(e) - now) / BPlanner.MIN));
            return n(m) + "분 뒤 출발 · " + t;
        }
        return t;
    }

    static String body(String kind, BPlanner.Entry e, double now, boolean h24) {
        if ("prep".equals(kind)) {
            double l = late(kind, e, now);
            if (l > 0) return "지금 시작해도 " + n(l) + "분 늦어요";
            return "지금 시작하면 " + hm(arrive(e), h24) + " 도착 · " + hm(leaveAt(e), h24) + " 출발";
        }
        if ("leave".equals(kind)) {
            double l = late(kind, e, now);
            if (l > 0) return "지금 나가도 " + n(l) + "분 늦어요";
            return "지금 나가면 " + hm(arrive(e), h24) + " 도착" + (e.place == null || e.place.isEmpty() ? "" : " · " + e.place);
        }
        if ("heads".equals(kind)) return hm(leaveAt(e), h24) + " 출발";
        return hm(e.start, h24);
    }

    /** 두 번째 울림부터 소리 다음에 읽어 주는 말 */
    static String say(String kind, BPlanner.Entry e, double now) {
        String t = e.title == null || e.title.isEmpty() ? "약속" : e.title;
        if ("prep".equals(kind)) {
            double l = late(kind, e, now);
            return t + " 갈 준비를 시작할 시간이에요. " + (l > 0 ? "지금 시작해도 " + n(l) + "분 늦어요. 늦는다고 미리 알려 두세요." : "지금 시작하면 제시간에 도착해요.");
        }
        if ("leave".equals(kind)) {
            double l = late(kind, e, now);
            return t + " 갈 시간이에요. " + (l > 0 ? "지금 나가도 " + n(l) + "분 늦어요. 늦는다고 미리 알려 두세요." : "지금 나가면 제시간에 도착해요.");
        }
        return t + " 할 시간이에요.";
    }

    /** 큰 단추 글 */
    static String primary(String kind) {
        if ("prep".equals(kind)) return "시작했어요";
        if ("leave".equals(kind) || "heads".equals(kind)) return "나갔어요";
        return "했어요";
    }

    static String primaryAct(String kind) {
        if ("prep".equals(kind)) return "start";
        if ("leave".equals(kind) || "heads".equals(kind)) return "left";
        return "done";
    }

    /** 둘째 단추: {글, act, n}. 여유가 있으면 'n분만', 늦거나 여유가 없으면 '늦는다고 알리기', 이 앱 알림은 '10분 뒤' */
    static Object[] secondary(String kind, BPlanner.Entry e, double now) {
        if ("remind".equals(kind)) return new Object[] { "10분 뒤", "snooze", 10.0 };
        double l = late(kind, e, now), s = BPlanner.snoozeLeft(e);
        if (l > 0 || s <= 0) return new Object[] { "늦는다고 알리기", "late", l };
        return new Object[] { n(s) + "분만", "snooze", s };
    }

    /** 늦는다고 알리기 글. 받는 사람은 사용자가 고른다 */
    static String share(String kind, BPlanner.Entry e, double now, boolean h24, double late) {
        if (late > 0) return "미안해요, " + n(late) + "분쯤 늦을 것 같아요. " + hm(e.start + late * BPlanner.MIN, h24) + "쯤 도착해요.";
        // 늦지 않으면 지금 나가는 기준(준비 단계면 준비 시간까지 더한다)으로 도착 시각
        double at = now + (("prep".equals(kind) ? e.prep : 0) + e.travel) * BPlanner.MIN;
        return "지금 출발해요. " + hm(at, h24) + "쯤 도착해요.";
    }

    /** 아침 요약 {제목, 본문}. 그날 보일 것이 없으면 null */
    static String[] morning(java.util.List<BPlanner.Entry> entries, double midnight, boolean h24) {
        double end = midnight + 1440 * BPlanner.MIN;
        int outs = 0, own = 0, words = 0;
        BPlanner.Entry first = null, firstOwn = null;
        for (BPlanner.Entry e : entries) {
            if (e.off || e.allDay || !(e.start >= midnight) || !(e.start < end)) continue;
            if (e.out) {
                outs++;
                if (first == null || (e.prepAt != null && first.prepAt != null && e.prepAt < first.prepAt)) first = e;
            } else if ("own".equals(e.src)) {
                own++;
                if (firstOwn == null || e.start < firstOwn.start) firstOwn = e;
            }
            if (e.suggest) words++;
        }
        String tail = words > 0 ? " · 장소 없는 일정 " + words + "개는 알람 없이 둘게요" : "";
        if (outs > 0 && first != null) {
            String t = first.title == null || first.title.isEmpty() ? "(제목 없음)" : first.title;
            return new String[] { "오늘 나가는 약속 " + outs + "개",
                "첫 준비 시작 " + hm(first.prepAt != null ? first.prepAt : first.start, h24) + " · " + t + "(" + hm(first.start, h24) + ")" + tail };
        }
        if (own > 0 && firstOwn != null) {
            String t = firstOwn.title == null || firstOwn.title.isEmpty() ? "(제목 없음)" : firstOwn.title;
            return new String[] { "오늘 알림 " + own + "개", "첫 알림 " + hm(firstOwn.start, h24) + " · " + t + tail };
        }
        return null;
    }
}
