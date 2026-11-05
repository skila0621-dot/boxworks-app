package kr.boxworks.b;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 휴대폰 캘린더(SPEC 5절): 약속 읽기(반복 일정은 한 번씩, Instances) · 캘린더 목록 · 약속 넣기 · 캘린더 앱에서 열기.
 * 읽기 조건은 A의 BxCalendarPlugin과 같다(보이는 캘린더만, 취소 · 거절한 약속은 뺀다).
 */
final class BCalendar {
    private BCalendar() {}

    private static final int MAX_EVENTS = 1500;

    static boolean canRead(Context c) {
        return ContextCompat.checkSelfPermission(c, Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED;
    }

    static boolean canWrite(Context c) {
        return ContextCompat.checkSelfPermission(c, Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * begin~end(밀리초) 사이 약속. 권한이 없으면 빈 목록, 읽다가 실패하면 null(그때는 알람을 지우지 않으려고 구별한다).
     * calIds가 null이면 보이는 캘린더 모두, 빈 목록이면 아무것도 읽지 않는다.
     * 종일 일정은 캘린더가 UTC 자정으로 주므로 이 휴대폰 시간대의 그날 자정으로 바꿔 준다.
     */
    static List<Map<String, Object>> instances(Context c, long begin, long end, List<String> calIds) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (!canRead(c)) return out;
        if (calIds != null && calIds.isEmpty()) return out;
        Uri.Builder b = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(b, begin);
        ContentUris.appendId(b, end);
        StringBuilder sel = new StringBuilder();
        List<String> args = new ArrayList<>();
        sel.append("(").append(CalendarContract.Instances.STATUS).append(" IS NULL OR ")
            .append(CalendarContract.Instances.STATUS).append(" != ").append(CalendarContract.Events.STATUS_CANCELED).append(")");
        sel.append(" AND (").append(CalendarContract.Instances.SELF_ATTENDEE_STATUS).append(" IS NULL OR ")
            .append(CalendarContract.Instances.SELF_ATTENDEE_STATUS).append(" != ").append(CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED).append(")");
        sel.append(" AND ").append(CalendarContract.Instances.VISIBLE).append(" = 1");
        if (calIds != null) {
            sel.append(" AND ").append(CalendarContract.Instances.CALENDAR_ID).append(" IN (");
            for (int i = 0; i < calIds.size(); i++) {
                sel.append(i == 0 ? "?" : ",?");
                args.add(calIds.get(i));
            }
            sel.append(")");
        }
        String[] proj = {
            CalendarContract.Instances.EVENT_ID,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.EVENT_LOCATION,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.CALENDAR_ID,
            CalendarContract.Instances.DISPLAY_COLOR,
            CalendarContract.Instances.CALENDAR_DISPLAY_NAME
        };
        try (Cursor cur = c.getContentResolver().query(b.build(), proj, sel.toString(), args.toArray(new String[0]),
                CalendarContract.Instances.BEGIN + " ASC")) {
            if (cur == null) return null;
            while (cur.moveToNext() && out.size() < MAX_EVENTS) {
                boolean allDay = !cur.isNull(5) && cur.getInt(5) == 1;
                long bg = cur.getLong(1);
                long en = cur.isNull(2) ? bg : cur.getLong(2);
                if (allDay) {
                    bg = utcDayToLocal(bg);
                    en = utcDayToLocal(en);
                }
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", String.valueOf(cur.getLong(0)));
                m.put("begin", bg);
                m.put("end", en);
                m.put("title", cut(cur.isNull(3) ? "" : cur.getString(3), 200));
                m.put("location", cut(cur.isNull(4) ? "" : cur.getString(4), 200));
                m.put("allDay", allDay);
                m.put("calendarId", String.valueOf(cur.getLong(6)));
                m.put("color", cur.isNull(7) ? null : hex(cur.getInt(7)));
                m.put("calName", cur.isNull(8) ? "" : cur.getString(8));
                out.add(m);
            }
        } catch (Exception e) {
            return null;
        }
        return out;
    }

    /** UTC 자정(종일 일정) → 이 휴대폰 시간대의 같은 날 자정 */
    static long utcDayToLocal(long utcMs) {
        Calendar u = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        u.setTimeInMillis(utcMs);
        Calendar l = Calendar.getInstance();
        l.clear();
        l.set(u.get(Calendar.YEAR), u.get(Calendar.MONTH), u.get(Calendar.DAY_OF_MONTH), 0, 0, 0);
        return l.getTimeInMillis();
    }

    static String hex(int color) {
        return String.format(Locale.ROOT, "#%06x", color & 0xFFFFFF);
    }

    /** 캘린더 목록 [{id, name, account, color, writable, visible, primary}] */
    static JSONArray calendars(Context c) {
        JSONArray out = new JSONArray();
        if (!canRead(c)) return out;
        String[] base = {
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.CALENDAR_COLOR,
            CalendarContract.Calendars.VISIBLE,
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL
        };
        String[] withPrimary = new String[base.length + 1];
        System.arraycopy(base, 0, withPrimary, 0, base.length);
        withPrimary[base.length] = CalendarContract.Calendars.IS_PRIMARY;
        // IS_PRIMARY가 없는 캘린더 앱도 있어서, 안 되면 빼고 다시 읽는다
        if (readCalendars(c, withPrimary, out)) return out;
        out = new JSONArray();
        readCalendars(c, base, out);
        return out;
    }

    private static boolean readCalendars(Context c, String[] proj, JSONArray out) {
        try (Cursor cur = c.getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, proj, null, null, null)) {
            while (cur != null && cur.moveToNext()) {
                JSONObject o = new JSONObject();
                BJson.put(o, "id", String.valueOf(cur.getLong(0)));
                BJson.put(o, "name", cur.isNull(1) ? "" : cur.getString(1));
                BJson.put(o, "account", cur.isNull(2) ? "" : cur.getString(2));
                BJson.put(o, "color", cur.isNull(3) ? null : hex(cur.getInt(3)));
                BJson.put(o, "visible", !cur.isNull(4) && cur.getInt(4) == 1);
                BJson.put(o, "writable", !cur.isNull(5) && cur.getInt(5) >= CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR);
                BJson.put(o, "primary", proj.length > 6 && !cur.isNull(6) && cur.getInt(6) == 1);
                out.put(o);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** 약속을 넣을 캘린더: 고른 것 > 설정(writeCal) > 쓸 수 있는 보이는 캘린더 중 기본(IS_PRIMARY) > 첫째. 없으면 null */
    static String pickCalendar(Context c, String wanted, String writeCal) {
        JSONArray list = calendars(c);
        String first = null, primary = null;
        boolean wantedOk = false, writeOk = false;
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o == null || !BJson.bool(o, "writable", false)) continue;
            String id = BJson.str(o, "id", "");
            if (id.equals(wanted)) wantedOk = true;
            if (id.equals(writeCal)) writeOk = true;
            if (!BJson.bool(o, "visible", false)) continue;
            if (first == null) first = id;
            if (primary == null && BJson.bool(o, "primary", false)) primary = id;
        }
        if (wanted != null && wantedOk) return wanted;
        if (writeCal != null && writeOk) return writeCal;
        return primary != null ? primary : first;
    }

    /** 약속 넣기 → {eventId, calendarId}. 넣지 못하면 null */
    static String[] insert(Context c, String calId, String title, long begin, long end, String location) {
        if (!canWrite(c) || calId == null) return null;
        try {
            ContentValues v = new ContentValues();
            v.put(CalendarContract.Events.CALENDAR_ID, Long.parseLong(calId));
            v.put(CalendarContract.Events.TITLE, title == null ? "" : title);
            v.put(CalendarContract.Events.DTSTART, begin);
            v.put(CalendarContract.Events.DTEND, end > begin ? end : begin + 60 * 60 * 1000L);
            if (location != null && !location.isEmpty()) v.put(CalendarContract.Events.EVENT_LOCATION, location);
            v.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            ContentResolver cr = c.getContentResolver();
            Uri u = cr.insert(CalendarContract.Events.CONTENT_URI, v);
            if (u == null) return null;
            return new String[] { String.valueOf(ContentUris.parseId(u)), calId };
        } catch (Exception e) {
            return null;
        }
    }

    /** 휴대폰 캘린더 앱에서 그 일정을 연다(고치기는 거기서) */
    static boolean open(Context c, String id) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(id)));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(i);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static String cut(String s, int n) {
        return s.length() > n ? s.substring(0, n) : s;
    }
}
