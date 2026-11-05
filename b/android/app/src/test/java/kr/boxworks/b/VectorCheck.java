package kr.boxworks.b;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 안드로이드 도구 없이 계획 계산만 시험하는 작은 프로그램(org.json도 없이 돈다). BPlannerTest와 같은 것을 본다.
 *   javac -d /tmp/vc app/src/main/java/kr/boxworks/b/BPlanner.java app/src/test/java/kr/boxworks/b/VectorCheck.java
 *   java -cp /tmp/vc kr.boxworks.b.VectorCheck ../vectors/planner.json
 */
public final class VectorCheck {
    private VectorCheck() {}

    /** planner.js plan() 항목 가운데 시험표가 적어 둔 칸(tests/make-vectors.mjs pick) */
    static final String[] FIELDS = { "key", "src", "title", "place", "allDay", "start", "end", "out", "outWhy", "suggest", "prep", "prepWhy",
        "travel", "travelWhy", "off", "prepAt", "leaveAt", "headsAt", "snoozed", "state", "tight" };
    static final String[] ALARM_FIELDS = { "id", "key", "kind", "at", "strong" };

    public static void main(String[] args) throws Exception {
        File f = args.length > 0 ? new File(args[0]) : find();
        if (f == null) {
            System.err.println("vectors/planner.json을 찾지 못했어요");
            System.exit(2);
            return;
        }
        Map<String, Object> root = asMap(new Reader(new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8)).value());
        List<Object> vectors = asList(root.get("vectors"));
        int pass = 0;
        List<String> fails = new ArrayList<>();
        for (Object vo : vectors) {
            Map<String, Object> v = asMap(vo);
            List<String> errs = check(v);
            if (errs.isEmpty()) pass++;
            else fails.add(v.get("name") + "\n    " + String.join("\n    ", errs));
        }
        System.out.println("vectors " + pass + "/" + vectors.size() + " 통과");
        for (String s : fails) System.out.println("  틀림: " + s);
        if (!fails.isEmpty() || vectors.isEmpty()) System.exit(1);
    }

    /** 시험 하나: 틀린 곳 목록(비었으면 통과) */
    static List<String> check(Map<String, Object> v) {
        List<String> errs = new ArrayList<>();
        BPlanner.Input in = BPlanner.input(asMap(v.get("input")));
        List<BPlanner.Entry> entries = BPlanner.plan(in);
        List<BPlanner.Alarm> alarms = BPlanner.alarms(entries, in);
        Map<String, Object> expect = asMap(v.get("expect"));
        List<Object> ee = asList(expect.get("entries"));
        if (ee.size() != entries.size()) errs.add("항목 수 " + entries.size() + " (기대 " + ee.size() + ")");
        for (int i = 0; i < Math.min(ee.size(), entries.size()); i++) {
            Map<String, Object> want = asMap(ee.get(i));
            Map<String, Object> got = entries.get(i).toMap();
            for (String k : FIELDS) {
                Object w = want.get(k), g = got.get(k);
                if ("tight".equals(k) && g instanceof Map) {
                    Map<String, Object> gt = new LinkedHashMap<>();
                    gt.put("key", ((Map<?, ?>) g).get("key"));
                    gt.put("minutes", ((Map<?, ?>) g).get("minutes"));
                    g = gt;
                }
                if (!same(w, g)) errs.add("항목 " + i + " " + k + ": " + g + " (기대 " + w + ")");
            }
        }
        List<Object> ea = asList(expect.get("alarms"));
        if (ea.size() != alarms.size()) errs.add("알람 수 " + alarms.size() + " (기대 " + ea.size() + ")");
        for (int i = 0; i < Math.min(ea.size(), alarms.size()); i++) {
            Map<String, Object> want = asMap(ea.get(i));
            Map<String, Object> got = alarms.get(i).toMap();
            for (String k : ALARM_FIELDS) {
                if (!same(want.get(k), got.get(k))) errs.add("알람 " + i + " " + k + ": " + got.get(k) + " (기대 " + want.get(k) + ")");
            }
            if (want.size() != ALARM_FIELDS.length) errs.add("알람 " + i + " 칸 수 " + want.size());
        }
        return errs;
    }

    /** 숫자는 값으로, 나머지는 그대로 비교 */
    static boolean same(Object a, Object b) {
        if (a == null || b == null) return a == b;
        if (a instanceof Number && b instanceof Number) return ((Number) a).doubleValue() == ((Number) b).doubleValue();
        if (a instanceof Map && b instanceof Map) {
            Map<?, ?> x = (Map<?, ?>) a, y = (Map<?, ?>) b;
            if (x.size() != y.size()) return false;
            for (Map.Entry<?, ?> e : x.entrySet()) if (!y.containsKey(e.getKey()) || !same(e.getValue(), y.get(e.getKey()))) return false;
            return true;
        }
        if (a instanceof List && b instanceof List) {
            List<?> x = (List<?>) a, y = (List<?>) b;
            if (x.size() != y.size()) return false;
            for (int i = 0; i < x.size(); i++) if (!same(x.get(i), y.get(i))) return false;
            return true;
        }
        return a.equals(b);
    }

    /** 모듈 폴더(b/android/app)에서 돌든 다른 곳에서 돌든 시험표를 찾는다 */
    static File find() {
        File d = new File(".").getAbsoluteFile();
        for (int i = 0; i < 6 && d != null; i++, d = d.getParentFile()) {
            File f = new File(d, "vectors/planner.json");
            if (f.isFile()) return f;
            f = new File(d, "b/vectors/planner.json");
            if (f.isFile()) return f;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> asMap(Object o) {
        return (Map<String, Object>) o;
    }

    @SuppressWarnings("unchecked")
    static List<Object> asList(Object o) {
        return o == null ? new ArrayList<>() : (List<Object>) o;
    }

    /** 아주 작은 JSON 읽개: 객체 → LinkedHashMap, 배열 → ArrayList, 정수 → Long, 소수 → Double */
    static final class Reader {
        private final String s;
        private int i;

        Reader(String s) {
            this.s = s;
        }

        Object value() {
            ws();
            char c = s.charAt(i);
            if (c == '{') return obj();
            if (c == '[') return arr();
            if (c == '"') return str();
            if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
            if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
            if (s.startsWith("null", i)) { i += 4; return null; }
            return number();
        }

        private void ws() {
            while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++;
        }

        private Map<String, Object> obj() {
            Map<String, Object> m = new LinkedHashMap<>();
            i++;
            ws();
            if (s.charAt(i) == '}') { i++; return m; }
            while (true) {
                ws();
                String k = str();
                ws();
                i++; // :
                m.put(k, value());
                ws();
                if (s.charAt(i++) == '}') return m;
            }
        }

        private List<Object> arr() {
            List<Object> a = new ArrayList<>();
            i++;
            ws();
            if (s.charAt(i) == ']') { i++; return a; }
            while (true) {
                a.add(value());
                ws();
                if (s.charAt(i++) == ']') return a;
            }
        }

        private String str() {
            StringBuilder b = new StringBuilder();
            i++;
            while (true) {
                char c = s.charAt(i++);
                if (c == '"') return b.toString();
                if (c != '\\') { b.append(c); continue; }
                char e = s.charAt(i++);
                switch (e) {
                    case 'n': b.append('\n'); break;
                    case 't': b.append('\t'); break;
                    case 'r': b.append('\r'); break;
                    case 'b': b.append('\b'); break;
                    case 'f': b.append('\f'); break;
                    case 'u': b.append((char) Integer.parseInt(s.substring(i, i + 4), 16)); i += 4; break;
                    default: b.append(e);
                }
            }
        }

        private Object number() {
            int a = i;
            while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
            String t = s.substring(a, i);
            if (t.indexOf('.') < 0 && t.indexOf('e') < 0 && t.indexOf('E') < 0) {
                try {
                    return Long.parseLong(t);
                } catch (NumberFormatException ignored) {
                }
            }
            return Double.parseDouble(t);
        }
    }
}
