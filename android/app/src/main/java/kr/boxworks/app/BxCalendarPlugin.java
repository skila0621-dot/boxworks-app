package kr.boxworks.app;

import android.Manifest;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.List;

/**
 * 휴대폰 캘린더(구글 캘린더 등)를 읽기만 하는 연결부(D-05). 웹에서는 Capacitor.Plugins.BxCalendar로 부른다.
 * 쓰기·고치기는 하지 않는다. 고칠 때는 open()으로 휴대폰 캘린더 앱의 그 일정을 연다.
 */
@CapacitorPlugin(
    name = "BxCalendar",
    permissions = { @Permission(strings = { Manifest.permission.READ_CALENDAR }, alias = "calendar") }
)
public class BxCalendarPlugin extends Plugin {

    private static final int MAX_EVENTS = 1500;
    private static final int MAX_TEXT = 2000;

    private boolean granted() {
        return getPermissionState("calendar") == PermissionState.GRANTED;
    }

    private JSObject statusObject() {
        JSObject r = new JSObject();
        r.put("granted", granted());
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(statusObject());
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (granted()) {
            call.resolve(statusObject());
            return;
        }
        requestPermissionForAlias("calendar", call, "calendarResult");
    }

    @PermissionCallback
    private void calendarResult(PluginCall call) {
        call.resolve(statusObject());
    }

    /** 휴대폰에 있는 캘린더 목록: id, name, account, color, visible */
    @PluginMethod
    public void calendars(PluginCall call) {
        if (!granted()) {
            call.reject("휴대폰 캘린더 권한이 없어요", "denied");
            return;
        }
        String[] proj = {
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.CALENDAR_COLOR,
            CalendarContract.Calendars.VISIBLE
        };
        JSArray out = new JSArray();
        try (Cursor c = getContext().getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, proj, null, null, null)) {
            while (c != null && c.moveToNext()) {
                JSObject o = new JSObject();
                o.put("id", String.valueOf(c.getLong(0)));
                o.put("name", c.isNull(1) ? "" : c.getString(1));
                o.put("account", c.isNull(2) ? "" : c.getString(2));
                o.put("color", c.isNull(3) ? 0 : c.getInt(3));
                o.put("visible", !c.isNull(4) && c.getInt(4) == 1);
                out.put(o);
            }
        } catch (Exception e) {
            call.reject("캘린더 목록을 읽지 못했어요", e);
            return;
        }
        JSObject r = new JSObject();
        r.put("calendars", out);
        call.resolve(r);
    }

    /**
     * from~to(밀리초) 사이의 일정. 반복 일정은 한 번씩 펼쳐서 준다(Instances).
     * 휴대폰에서 보이게 켜 둔 캘린더만. ids를 주면 그 가운데 그 캘린더만. 취소된 일정과 거절한 초대는 뺀다.
     */
    @PluginMethod
    public void events(PluginCall call) {
        if (!granted()) {
            call.reject("휴대폰 캘린더 권한이 없어요", "denied");
            return;
        }
        Long from = call.getLong("from");
        Long to = call.getLong("to");
        if (from == null || to == null || to <= from) {
            call.reject("기간이 잘못됐어요");
            return;
        }
        JSArray ids = call.getArray("ids", null);

        Uri.Builder b = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(b, from);
        ContentUris.appendId(b, to);

        StringBuilder sel = new StringBuilder();
        List<String> args = new ArrayList<>();
        sel.append("(").append(CalendarContract.Instances.STATUS).append(" IS NULL OR ")
            .append(CalendarContract.Instances.STATUS).append(" != ").append(CalendarContract.Events.STATUS_CANCELED).append(")");
        sel.append(" AND (").append(CalendarContract.Instances.SELF_ATTENDEE_STATUS).append(" IS NULL OR ")
            .append(CalendarContract.Instances.SELF_ATTENDEE_STATUS).append(" != ").append(CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED).append(")");
        if (ids != null && ids.length() > 0) {
            sel.append(" AND ").append(CalendarContract.Instances.CALENDAR_ID).append(" IN (");
            for (int i = 0; i < ids.length(); i++) {
                sel.append(i == 0 ? "?" : ",?");
                args.add(ids.optString(i, "0"));
            }
            sel.append(")");
        }
        // 휴대폰 캘린더 앱에서 끈(숨긴) 캘린더는 고른 캘린더 안에 있어도 읽지 않는다(시험판 58, 대표 11/4 '휴대폰 캘린더를 꺼도 일정이 보인다').
        // 전에는 고른 캘린더(ids)가 있으면 이 조건을 빼서, 끈 캘린더 일정이 계속 보였다
        sel.append(" AND ").append(CalendarContract.Instances.VISIBLE).append(" = 1");

        String[] proj = {
            CalendarContract.Instances.EVENT_ID,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.EVENT_LOCATION,
            CalendarContract.Instances.DESCRIPTION,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.CALENDAR_ID,
            CalendarContract.Instances.DISPLAY_COLOR,
            CalendarContract.Instances.CALENDAR_DISPLAY_NAME
        };
        JSArray out = new JSArray();
        try (Cursor c = getContext().getContentResolver().query(b.build(), proj, sel.toString(), args.toArray(new String[0]),
                CalendarContract.Instances.BEGIN + " ASC")) {
            while (c != null && c.moveToNext() && out.length() < MAX_EVENTS) {
                JSObject o = new JSObject();
                o.put("eventId", String.valueOf(c.getLong(0)));
                o.put("begin", c.getLong(1));
                o.put("end", c.isNull(2) ? c.getLong(1) : c.getLong(2));
                o.put("title", cut(c.isNull(3) ? "" : c.getString(3), 200));
                o.put("location", cut(c.isNull(4) ? "" : c.getString(4), 200));
                o.put("description", cut(c.isNull(5) ? "" : c.getString(5), MAX_TEXT));
                o.put("allDay", !c.isNull(6) && c.getInt(6) == 1);
                o.put("calendarId", String.valueOf(c.getLong(7)));
                o.put("color", c.isNull(8) ? 0 : c.getInt(8));
                o.put("calendar", c.isNull(9) ? "" : c.getString(9));
                out.put(o);
            }
        } catch (Exception e) {
            call.reject("휴대폰 캘린더를 읽지 못했어요", e);
            return;
        }
        JSObject r = new JSObject();
        r.put("events", out);
        call.resolve(r);
    }

    /** 휴대폰 캘린더 앱에서 그 일정을 연다(고치기는 거기서). */
    @PluginMethod
    public void open(PluginCall call) {
        String id = call.getString("eventId");
        Long begin = call.getLong("begin");
        Long end = call.getLong("end");
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(id)));
            if (begin != null) i.putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, (long) begin);
            if (end != null) i.putExtra(CalendarContract.EXTRA_EVENT_END_TIME, (long) end);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("캘린더 앱을 열지 못했어요", e);
        }
    }

    private static String cut(String s, int n) {
        return s.length() > n ? s.substring(0, n) : s;
    }
}
