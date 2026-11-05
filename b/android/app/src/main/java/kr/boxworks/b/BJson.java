package kr.boxworks.b;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * org.json ↔ 자바 Map · List. BPlanner는 org.json을 모르므로 이것으로 바꿔 넘긴다.
 * 안드로이드 org.json과 JVM 시험용 org.json(org.json:json) 둘 다에서 같은 뜻인 것만 쓴다(optString 등은 null을 다르게 다룬다).
 */
final class BJson {
    private BJson() {}

    static boolean isNull(Object v) {
        return v == null || JSONObject.NULL.equals(v);
    }

    /** org.json 값 → Map · List · String · Number · Boolean · null */
    static Object plain(Object v) {
        if (isNull(v)) return null;
        if (v instanceof JSONObject) {
            JSONObject o = (JSONObject) v;
            Map<String, Object> m = new LinkedHashMap<>();
            for (Iterator<String> it = o.keys(); it.hasNext(); ) {
                String k = it.next();
                m.put(k, plain(o.opt(k)));
            }
            return m;
        }
        if (v instanceof JSONArray) {
            JSONArray a = (JSONArray) v;
            List<Object> l = new ArrayList<>(a.length());
            for (int i = 0; i < a.length(); i++) l.add(plain(a.opt(i)));
            return l;
        }
        return v;
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> map(JSONObject o) {
        Object p = plain(o);
        return p instanceof Map ? (Map<String, Object>) p : new LinkedHashMap<String, Object>();
    }

    @SuppressWarnings("unchecked")
    static List<Object> list(JSONArray a) {
        Object p = plain(a);
        return p instanceof List ? (List<Object>) p : new ArrayList<Object>();
    }

    /** Map · List … → org.json 값(null은 JSONObject.NULL, 정수인 소수는 Long) */
    static Object json(Object v) {
        if (v == null) return JSONObject.NULL;
        if (v instanceof JSONObject || v instanceof JSONArray) return v;
        if (v instanceof Map) {
            JSONObject o = new JSONObject();
            for (Map.Entry<?, ?> e : ((Map<?, ?>) v).entrySet()) put(o, String.valueOf(e.getKey()), json(e.getValue()));
            return o;
        }
        if (v instanceof List) {
            JSONArray a = new JSONArray();
            for (Object x : (List<?>) v) a.put(json(x));
            return a;
        }
        if (v instanceof Double || v instanceof Float) {
            Object n = BPlanner.num(((Number) v).doubleValue());
            return n == null ? JSONObject.NULL : n;
        }
        return v;
    }

    static JSONObject obj(Map<String, Object> m) {
        Object o = json(m);
        return o instanceof JSONObject ? (JSONObject) o : new JSONObject();
    }

    static JSONObject parseObj(String s) {
        if (s == null || s.isEmpty()) return new JSONObject();
        try {
            return new JSONObject(s);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    static JSONArray parseArr(String s) {
        if (s == null || s.isEmpty()) return new JSONArray();
        try {
            return new JSONArray(s);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    /** 실패해도 멈추지 않는 put(값이 null이면 JSON null로) */
    static JSONObject put(JSONObject o, String k, Object v) {
        try {
            o.put(k, v == null ? JSONObject.NULL : v);
        } catch (Exception ignored) {
        }
        return o;
    }

    /** 숫자 칸 읽기(없거나 숫자가 아니면 d) */
    static double num(JSONObject o, String k, double d) {
        if (o == null) return d;
        Object v = o.opt(k);
        if (v instanceof Number) return ((Number) v).doubleValue();
        return d;
    }

    static long lng(JSONObject o, String k, long d) {
        if (o == null) return d;
        Object v = o.opt(k);
        if (v instanceof Number) return Math.round(((Number) v).doubleValue());
        return d;
    }

    /** 글 칸 읽기(없거나 null이면 d) */
    static String str(JSONObject o, String k, String d) {
        if (o == null) return d;
        Object v = o.opt(k);
        if (isNull(v)) return d;
        if (v instanceof Number) return BPlanner.jsNum(((Number) v).doubleValue());
        return String.valueOf(v);
    }

    static boolean bool(JSONObject o, String k, boolean d) {
        if (o == null) return d;
        Object v = o.opt(k);
        return v instanceof Boolean ? (Boolean) v : d;
    }

    static JSONObject copy(JSONObject o) {
        return o == null ? new JSONObject() : parseObj(o.toString());
    }
}
