package kr.boxworks.b;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/**
 * 단추가 하는 일(SPEC 4절). 알람 화면 · 알림 단추 · 앱 안(act)이 모두 이것을 부른다.
 * 시작했어요 → log start, prep 붙잡기 취소, 진행 알림 · 나갔어요 → log left, leave · heads · 붙잡기 취소, 진행 알림 지움 ·
 * N분만 → log snooze(kind, n), 다시 계획 · 늦는다고 알리기 → 공유 창, log late(n) · 이번엔 안 가요 → overrides[key].off, log off, 모두 취소 ·
 * 했어요 → log done · undo(kind) → 되돌리기. 대답하면 그 약속의 소리를 멈추고 남은 붙잡기를 취소한다.
 */
final class BActions {
    private BActions() {}

    /**
     * kind: 단추가 붙은 단계(prep · leave · heads · remind). n: 미룰 분 · 늦는 분(없으면 지금 계획으로 계산).
     * snap: 알람에 실어 둔 약속 요약(잠금을 풀기 전에도 계산하려고)
     */
    static void handle(Context ctx, String key, String act, String kind, Double n, JSONObject snap) {
        final Context c = ctx.getApplicationContext() != null ? ctx.getApplicationContext() : ctx;
        if (key == null || key.isEmpty() || act == null) return;
        if ("ring-off".equals(act)) {
            BRingService.quietFor(c, key);
            return;
        }
        // 시험 알람: 기록하지 않고 닫기만
        if (key.startsWith("test:")) {
            BRingService.stopFor(c, key);
            BNotify.dismissAll(c, key);
            BAlarmActivity.answered(key);
            return;
        }
        switch (act) {
            case "start":
                BStore.log(c, key, "start", null, null);
                answered(c, key, "prep");
                break;
            case "left": {
                BPlanner.Entry e = entryFor(c, key, snap);
                Double late = e == null ? null : BPlanner.lateIfLeaveNow(e, System.currentTimeMillis());
                // n: 나갈 때 몇 분 늦을 참이었는지(기록 요약에 쓴다)
                BStore.log(c, key, "left", null, late);
                answered(c, key, null);
                BNotify.cancelOngoing(c, key);
                break;
            }
            case "snooze": {
                String k = kind == null || kind.isEmpty() ? "prep" : kind;
                double m = n != null ? n : defaultSnooze(c, key, k, snap);
                if (m <= 0) return;
                BStore.log(c, key, "snooze", k, m);
                answered(c, key, k);
                break;
            }
            case "done":
                BStore.log(c, key, "done", null, null);
                answered(c, key, "remind");
                break;
            case "off":
                BStore.setOff(c, key);
                BStore.log(c, key, "off", null, null);
                answered(c, key, null);
                BNotify.cancelOngoing(c, key);
                break;
            case "undo":
                if (kind == null || kind.isEmpty()) return;
                BStore.log(c, key, "undo", kind, null);
                break;
            case "late":
                // 공유 창은 화면이 있어야 열린다(lateShare). 여기서는 기록과 소리만
                BStore.log(c, key, "late", kind, n);
                BRingService.quietFor(c, key);
                break;
            default:
                return;
        }
        BEngine.run(() -> BEngine.replan(c, false));
        BPlugin.emit("act", key);
    }

    /** 대답: 소리를 멈추고, 붙잡기 · 그 단계 알림을 치우고, 알람 화면을 닫는다. kind가 null이면 모든 단계 */
    private static void answered(Context c, String key, String kind) {
        BRingService.stopFor(c, key);
        BScheduler.cancel(c, key, kind, kind != null);
        if (kind == null) BNotify.dismissAll(c, key);
        else {
            BNotify.dismiss(c, kind, key);
            if ("leave".equals(kind)) BNotify.dismiss(c, "heads", key);
        }
        BAlarmActivity.answered(key);
    }

    private static double defaultSnooze(Context c, String key, String kind, JSONObject snap) {
        if ("remind".equals(kind)) return 10;
        BPlanner.Entry e = entryFor(c, key, snap);
        return e == null ? 0 : BPlanner.snoozeLeft(e);
    }

    /** 단추에 실어 둔 약속 요약(울릴 때 만든 것)이 있으면 그것, 없으면(앱 안) 지금 계획에서 */
    private static BPlanner.Entry entryFor(Context c, String key, JSONObject snap) {
        if (snap != null) return BEngine.fromSnap(snap);
        return BEngine.entryNow(c, key, null);
    }

    /**
     * '늦는다고 알리기': 늦는 분(n)과 글을 지금 계산해 기록하고 공유 창을 연다. 받는 사람은 사용자가 고른다(자동으로 보내지 않음).
     * kind: prep이면 '지금 시작하면', 그 밖은 '지금 나가면' 기준. 연 공유 창의 글을 돌려준다
     */
    static String lateShare(Activity a, String key, String kind, JSONObject snap) {
        Context c = a.getApplicationContext();
        long now = System.currentTimeMillis();
        BPlanner.Entry e = entryFor(c, key, snap);
        if (e == null) e = BEngine.fromSnap(null);
        String k = kind == null || kind.isEmpty() ? ("prep".equals(e.state) ? "leave" : "prep") : kind;
        if ("heads".equals(k)) k = "leave";
        // 시작한 뒤(진행 중)라면 준비 단계 알람에서 눌렀어도 '지금 나가면' 기준
        if ("prep".equals(k) && "prep".equals(e.state)) k = "leave";
        double late = BText.late(k, e, now);
        String text = BText.share(k, e, now, BStore.h24(c), late);
        if (!key.startsWith("test:")) handle(c, key, "late", k, late, snap);
        openShare(a, text, "늦는다고 알리기");
        return text;
    }

    /** 휴대폰 공유 창(카톡 등). 자동으로 보내지 않는다 */
    static boolean openShare(Activity a, String text, String title) {
        try {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            Intent chooser = Intent.createChooser(send, title);
            a.startActivity(chooser);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
