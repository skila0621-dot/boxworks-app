package kr.boxworks.b;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 계획 계산. 기준은 web/js/planner.js이고 이 파일은 그것을 한 줄씩 옮긴 것이다(같은 답인지는 vectors/planner.json으로 시험, BPlannerTest).
 * 시각은 밀리초, 길이는 분. 자바스크립트처럼 숫자는 double로, 같은 순서로 더하고 곱한다(끝자리까지 같게).
 * 안드로이드 것을 쓰지 않아 컴퓨터에서도 돌린다. 규칙을 바꿀 때는 planner.js를 먼저 바꾸고 시험표를 다시 만든다.
 */
public final class BPlanner {
    private BPlanner() {}

    public static final double MIN = 60000;
    /** 시각이 지났는데 한 번도 안 울렸으면 이만큼 뒤에 바로 울린다 */
    public static final double SOON = 5000;

    /** 제목에 있으면 '나가는 약속인가요?'로 묻기만 하는 낱말(planner.js OUT_WORDS와 같아야 한다) */
    public static final String[] OUT_WORDS = { "병원", "치과", "의원", "내과", "외과", "피부과", "안과", "이비인후과", "정형외과", "한의원", "약국", "검진",
        "면접", "미팅", "약속", "모임", "회식", "저녁", "점심", "브런치", "데이트", "결혼식", "돌잔치", "장례식", "미용실", "헤어", "네일",
        "학원", "수업", "레슨", "강의", "출근", "공항", "비행기", "기차", "ktx", "srt", "터미널", "영화", "공연", "콘서트", "전시",
        "여행", "헬스", "필라테스", "요가", "은행", "주민센터", "구청", "시청", "상담", "동창", "친구" };

    /** planner.js ONLINE(/(zoom|줌|google ?meet|구글 ?미트|팀즈|teams|webex|온라인|화상|비대면|https?:\/\/|www\.|통화|전화)/i)을 풀어 쓴 것. 영문자만 대소문자를 가리지 않는다 */
    private static final String[] ONLINE_WORDS = { "zoom", "줌", "googlemeet", "google meet", "구글미트", "구글 미트", "팀즈", "teams", "webex",
        "온라인", "화상", "비대면", "http://", "https://", "www.", "통화", "전화" };

    // ───────── 들어오는 것 ─────────

    /** 설정. 빠진 값은 planner.js DEFAULTS와 같은 기본값 */
    public static final class Settings {
        public double prepDefault = 30, travelDefault = 30, buffer = 10, heads = 10, holdEvery = 3, holdMax = 3;
        public boolean morningOn = true;
        public String morningAt = "08:00";
        public boolean h24 = false;
        public List<String> calendars = null;
        public String writeCal = null;
        public String sound = "alarm";
        public boolean remindOwn = true;
    }

    /** 휴대폰 캘린더 약속 하나(반복 일정은 한 번씩) */
    public static final class Event {
        public String id = "undefined";
        public double begin;
        public Double end;
        public String title = "", location = "", calName = "";
        public boolean allDay;
        /** planner.js에는 없음: 화면이 캘린더 색 · 열기에 쓴다 */
        public String calId, eventId;
    }

    /** 캘린더 권한이 없을 때 이 앱에만 넣은 것 */
    public static final class Item {
        public String id = "undefined";
        public double at;
        public Double endAt;
        public String title = "", place = "";
        public boolean allDay;
        public Boolean out;
    }

    /** 약속별로 사용자가 정한 것(overrides[key]) */
    public static final class Ov {
        public Boolean out;
        public Double prep, travel;
        public boolean off;
    }

    /** 기록 한 줄 {key, act, kind?, n?, t} */
    public static final class LogEntry {
        public String key, act, kind;
        public Double n;
        public double t = Double.NaN;

        public LogEntry() {}

        public LogEntry(String key, String act, String kind, Double n, double t) {
            this.key = key;
            this.act = act;
            this.kind = kind;
            this.n = n;
            this.t = t;
        }
    }

    /** 아침 요약을 볼 날(자정은 부르는 쪽이 계산해 넘긴다) */
    public static final class Day {
        public String ymd = "undefined";
        public double midnight = Double.NaN;
    }

    public static final class Input {
        public double now = Double.NaN;
        public List<Day> days = new ArrayList<>();
        public List<Event> events = new ArrayList<>();
        public List<Item> items = new ArrayList<>();
        public Settings settings = new Settings();
        public Map<String, Ov> overrides = new HashMap<>();
        public Map<String, Double> places = new HashMap<>();
        public Map<String, Boolean> kw = new HashMap<>();
        public List<LogEntry> log = new ArrayList<>();
    }

    // ───────── 나가는 것 ─────────

    public static final class Tight {
        public String key, title;
        public double minutes;
    }

    /** 약속 하나의 계획(planner.js plan()의 항목과 같은 칸) */
    public static final class Entry {
        public String key, src, calName = "", title = "", place = "";
        public boolean allDay;
        public double start;
        public Double end;
        public boolean out;
        public String outWhy = "none";
        public boolean suggest;
        public double prep;
        public String prepWhy = "default";
        public double travel;
        public String travelWhy = "default";
        public boolean off;
        public double buffer;
        public Double prepAt, leaveAt, headsAt;
        public double snoozed, snRemind;
        public Double startedAt, leftAt, doneAt, lateAt;
        public boolean rangPrep, rangLeave, rangRemind;
        public String state = "idle";
        public Tight tight;
        /** planner.js에는 없음(화면 · 휴대폰 쪽이 쓴다). 이 앱에 넣은 것은 null */
        public String calId, eventId;

        /** 화면에 넘길 모양. 빈 시각은 null */
        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", key);
            m.put("src", src);
            m.put("calName", calName);
            m.put("title", title);
            m.put("place", place);
            m.put("allDay", allDay);
            m.put("start", num(start));
            m.put("end", num(end));
            m.put("out", out);
            m.put("outWhy", outWhy);
            m.put("suggest", suggest);
            m.put("prep", num(prep));
            m.put("prepWhy", prepWhy);
            m.put("travel", num(travel));
            m.put("travelWhy", travelWhy);
            m.put("off", off);
            m.put("buffer", num(buffer));
            m.put("prepAt", num(prepAt));
            m.put("leaveAt", num(leaveAt));
            m.put("headsAt", num(headsAt));
            m.put("snoozed", num(snoozed));
            m.put("snRemind", num(snRemind));
            m.put("startedAt", num(startedAt));
            m.put("leftAt", num(leftAt));
            m.put("doneAt", num(doneAt));
            m.put("lateAt", num(lateAt));
            m.put("rangPrep", rangPrep);
            m.put("rangLeave", rangLeave);
            m.put("rangRemind", rangRemind);
            m.put("state", state);
            if (tight == null) {
                m.put("tight", null);
            } else {
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("key", tight.key);
                t.put("title", tight.title);
                t.put("minutes", num(tight.minutes));
                m.put("tight", t);
            }
            m.put("eventId", eventId);
            m.put("calId", calId);
            return m;
        }
    }

    /** 걸 알람 {id, key, kind, at, strong} */
    public static final class Alarm {
        public String id, key, kind;
        public double at;
        public boolean strong;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("key", key);
            m.put("kind", kind);
            m.put("at", num(at));
            m.put("strong", strong);
            return m;
        }
    }

    public static final class Sample {
        public String key;
        public double t, minutes;
    }

    /** 실제 준비 시간(배운 값). 3번이 안 되면 prep은 null */
    public static final class Learned {
        public Double prep;
        public List<Sample> samples = new ArrayList<>();
    }

    // ───────── 작은 도구(자바스크립트와 같은 뜻) ─────────

    public static double ceil5(double m) {
        return Math.ceil(m / 5) * 5;
    }

    public static double clamp(double v, double a, double b) {
        return Math.max(a, Math.min(b, v));
    }

    private static boolean fin(double d) {
        return !Double.isNaN(d) && !Double.isInfinite(d);
    }

    /** 자바스크립트에서 참으로 치는 값인지(0 · NaN · 빈 글 · null은 거짓) */
    static boolean truthy(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean) return (Boolean) v;
        if (v instanceof Number) {
            double d = ((Number) v).doubleValue();
            return d != 0 && !Double.isNaN(d);
        }
        if (v instanceof String) return !((String) v).isEmpty();
        return true;
    }

    private static double orZero(Double d) {
        return truthy(d) ? d : 0;
    }

    /** 정수면 Long으로(화면에 1793944800000처럼 보이게), 아니면 Double. 숫자가 아니면 null */
    public static Object num(Double d) {
        if (d == null || !fin(d)) return null;
        double v = d;
        if (v == Math.rint(v) && Math.abs(v) <= 9007199254740992.0) return (long) v;
        return v;
    }

    /** 자바스크립트가 숫자를 글로 바꾸는 것(정수는 소수점 없이) */
    public static String jsNum(double v) {
        if (Double.isNaN(v)) return "NaN";
        if (Double.isInfinite(v)) return v > 0 ? "Infinity" : "-Infinity";
        if (v == Math.rint(v) && Math.abs(v) < 1e21) return Long.toString((long) v);
        return Double.toString(v);
    }

    /** 'c:' + ev.id 처럼 글에 이어 붙일 때의 모양 */
    private static String jsConcat(Map<String, Object> m, String k) {
        if (m == null || !m.containsKey(k)) return "undefined";
        Object v = m.get(k);
        if (v == null) return "null";
        if (v instanceof Number) return jsNum(((Number) v).doubleValue());
        return String.valueOf(v);
    }

    /** x || '' */
    private static String strOr(Object v) {
        if (!truthy(v)) return "";
        if (v instanceof Number) return jsNum(((Number) v).doubleValue());
        return String.valueOf(v);
    }

    private static boolean isNumber(Object v) {
        return v instanceof Number;
    }

    /** Number.isFinite(v) */
    private static boolean isFiniteNumber(Object v) {
        return v instanceof Number && fin(((Number) v).doubleValue());
    }

    private static double numOr(Object v, double d) {
        return v instanceof Number ? ((Number) v).doubleValue() : d;
    }

    /** x || null (숫자만) */
    private static Double numOrNull(Object v) {
        return v instanceof Number && truthy(v) ? ((Number) v).doubleValue() : null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object v) {
        return v instanceof Map ? (Map<String, Object>) v : null;
    }

    @SuppressWarnings("unchecked")
    private static List<Object> asList(Object v) {
        return v instanceof List ? (List<Object>) v : Collections.emptyList();
    }

    /** 자바스크립트 \s(빈칸 · 줄바꿈 · 전각 빈칸 등) */
    static boolean isJsSpace(int c) {
        if (c == 9 || c == 10 || c == 11 || c == 12 || c == 13 || c == 0x20 || c == 0xA0 || c == 0x1680 || c == 0x2028 || c == 0x2029
            || c == 0x202F || c == 0x205F || c == 0x3000 || c == 0xFEFF) return true;
        return c >= 0x2000 && c <= 0x200A;
    }

    /** \p{P}(문장 부호) 또는 \p{S}(기호) */
    private static boolean isPunctOrSymbol(int c) {
        switch (Character.getType(c)) {
            case Character.CONNECTOR_PUNCTUATION:
            case Character.DASH_PUNCTUATION:
            case Character.START_PUNCTUATION:
            case Character.END_PUNCTUATION:
            case Character.INITIAL_QUOTE_PUNCTUATION:
            case Character.FINAL_QUOTE_PUNCTUATION:
            case Character.OTHER_PUNCTUATION:
            case Character.MATH_SYMBOL:
            case Character.CURRENCY_SYMBOL:
            case Character.MODIFIER_SYMBOL:
            case Character.OTHER_SYMBOL:
                return true;
            default:
                return false;
        }
    }

    /** 같은 제목을 알아보는 열쇠: 소문자, 빈칸 · 숫자 · 문장 부호 · 기호를 뺀다(정규식 대신 한 글자씩: 안드로이드 정규식은 \s · \d 뜻이 달라서) */
    public static String normTitle(String t) {
        String s = (t == null ? "" : t).toLowerCase(Locale.ROOT);
        StringBuilder b = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); ) {
            int c = s.codePointAt(i);
            i += Character.charCount(c);
            if (isJsSpace(c) || (c >= '0' && c <= '9') || isPunctOrSymbol(c)) continue;
            b.appendCodePoint(c);
        }
        return b.toString();
    }

    /** 같은 장소를 알아보는 열쇠: 앞뒤 빈칸을 빼고, 빈칸은 하나로, 소문자 */
    public static String normPlace(String p) {
        String s = p == null ? "" : p;
        int a = 0, z = s.length();
        while (a < z && isJsSpace(s.charAt(a))) a++;
        while (z > a && isJsSpace(s.charAt(z - 1))) z--;
        StringBuilder b = new StringBuilder(z - a);
        boolean sp = false;
        for (int i = a; i < z; i++) {
            char ch = s.charAt(i);
            if (isJsSpace(ch)) {
                if (!sp) b.append(' ');
                sp = true;
            } else {
                b.append(ch);
                sp = false;
            }
        }
        return b.toString().toLowerCase(Locale.ROOT);
    }

    private static String asciiLower(String s) {
        char[] a = s.toCharArray();
        for (int i = 0; i < a.length; i++) if (a[i] >= 'A' && a[i] <= 'Z') a[i] = (char) (a[i] + 32);
        return new String(a);
    }

    /** 장소가 온라인(화상 회의 · 통화)인지 */
    public static boolean isOnline(String p) {
        String s = asciiLower(p == null ? "" : p);
        for (String w : ONLINE_WORDS) if (s.contains(w)) return true;
        return false;
    }

    private static boolean hasOutWord(String title) {
        String s = (title == null ? "" : title).toLowerCase(Locale.ROOT);
        for (String w : OUT_WORDS) if (s.contains(w)) return true;
        return false;
    }

    /** /^\d{2}:\d{2}$/ */
    private static boolean isHm(String s) {
        if (s == null || s.length() != 5 || s.charAt(2) != ':') return false;
        for (int i : new int[] { 0, 1, 3, 4 }) if (s.charAt(i) < '0' || s.charAt(i) > '9') return false;
        return true;
    }

    // ───────── 느슨한 모양(JSON을 자바 Map · List로 바꾼 것)에서 읽기 ─────────

    /**
     * {now, days, events, items, settings, overrides, places, kw, log}를 읽는다. 자바스크립트가 읽는 것과 같은 뜻으로
     * (예: ev.title || '', typeof it.at === 'number', Number.isFinite(o.prep)) 읽는다.
     * 다른 점: 숫자 설정에 숫자가 아닌 값이 오면 기본값을 쓴다(저장할 때 BStore가 그런 값을 지운다).
     */
    public static Input input(Map<String, Object> j) {
        Input in = new Input();
        if (j == null) return in;
        in.now = numOr(j.get("now"), Double.NaN);
        for (Object o : asList(j.get("days"))) {
            Map<String, Object> m = asMap(o);
            if (m == null) continue;
            Day d = new Day();
            d.ymd = jsConcat(m, "ymd");
            d.midnight = numOr(m.get("midnight"), Double.NaN);
            in.days.add(d);
        }
        in.events = events(j.get("events"));
        in.items = items(j.get("items"));
        in.settings = settings(asMap(j.get("settings")));
        in.overrides = overrides(asMap(j.get("overrides")));
        in.places = places(asMap(j.get("places")));
        in.kw = kw(asMap(j.get("kw")));
        in.log = log(j.get("log"));
        return in;
    }

    public static List<Event> events(Object list) {
        List<Event> out = new ArrayList<>();
        for (Object o : asList(list)) {
            Map<String, Object> m = asMap(o);
            if (m == null || !isNumber(m.get("begin"))) continue;
            Event e = new Event();
            e.id = jsConcat(m, "id");
            e.begin = ((Number) m.get("begin")).doubleValue();
            e.end = numOrNull(m.get("end"));
            e.title = strOr(m.get("title"));
            e.location = strOr(m.get("location"));
            e.allDay = truthy(m.get("allDay"));
            e.calName = strOr(m.get("calName"));
            Object cid = m.get("calendarId");
            e.calId = cid == null ? null : (cid instanceof Number ? jsNum(((Number) cid).doubleValue()) : String.valueOf(cid));
            e.eventId = m.get("id") == null ? null : jsConcat(m, "id");
            out.add(e);
        }
        return out;
    }

    public static List<Item> items(Object list) {
        List<Item> out = new ArrayList<>();
        for (Object o : asList(list)) {
            Map<String, Object> m = asMap(o);
            if (m == null || !isNumber(m.get("at"))) continue;
            Item it = new Item();
            it.id = jsConcat(m, "id");
            it.at = ((Number) m.get("at")).doubleValue();
            it.endAt = numOrNull(m.get("endAt"));
            it.title = strOr(m.get("title"));
            it.place = strOr(m.get("place"));
            it.allDay = truthy(m.get("allDay"));
            Object ob = m.get("out");
            it.out = ob instanceof Boolean ? (Boolean) ob : null;
            out.add(it);
        }
        return out;
    }

    public static Settings settings(Map<String, Object> m) {
        Settings s = new Settings();
        if (m == null) return s;
        s.prepDefault = numOr(m.get("prepDefault"), s.prepDefault);
        s.travelDefault = numOr(m.get("travelDefault"), s.travelDefault);
        s.buffer = numOr(m.get("buffer"), s.buffer);
        s.heads = numOr(m.get("heads"), s.heads);
        s.holdEvery = numOr(m.get("holdEvery"), s.holdEvery);
        s.holdMax = numOr(m.get("holdMax"), s.holdMax);
        // Object.assign과 같이: 칸이 있으면(null이라도) 그 값의 참 · 거짓
        if (m.containsKey("morningOn")) s.morningOn = truthy(m.get("morningOn"));
        if (m.containsKey("morningAt")) {
            Object v = m.get("morningAt");
            s.morningAt = v instanceof String ? (String) v : v instanceof Number ? jsNum(((Number) v).doubleValue()) : null;
        }
        if (m.containsKey("h24")) s.h24 = truthy(m.get("h24"));
        if (m.containsKey("remindOwn")) s.remindOwn = truthy(m.get("remindOwn"));
        Object cals = m.get("calendars");
        if (cals instanceof List) {
            s.calendars = new ArrayList<>();
            for (Object c : asList(cals)) if (c != null) s.calendars.add(c instanceof Number ? jsNum(((Number) c).doubleValue()) : String.valueOf(c));
        }
        Object wc = m.get("writeCal");
        if (wc != null) s.writeCal = wc instanceof Number ? jsNum(((Number) wc).doubleValue()) : String.valueOf(wc);
        if (m.get("sound") instanceof String) s.sound = (String) m.get("sound");
        return s;
    }

    public static Map<String, Ov> overrides(Map<String, Object> m) {
        Map<String, Ov> out = new HashMap<>();
        if (m == null) return out;
        for (Map.Entry<String, Object> x : m.entrySet()) {
            Map<String, Object> o = asMap(x.getValue());
            if (o == null) continue;
            Ov v = new Ov();
            Object ob = o.get("out");
            v.out = ob instanceof Boolean ? (Boolean) ob : null;
            v.prep = isFiniteNumber(o.get("prep")) ? ((Number) o.get("prep")).doubleValue() : null;
            v.travel = isFiniteNumber(o.get("travel")) ? ((Number) o.get("travel")).doubleValue() : null;
            v.off = Boolean.TRUE.equals(o.get("off"));
            out.put(x.getKey(), v);
        }
        return out;
    }

    public static Map<String, Double> places(Map<String, Object> m) {
        Map<String, Double> out = new HashMap<>();
        if (m == null) return out;
        for (Map.Entry<String, Object> x : m.entrySet()) {
            if (isFiniteNumber(x.getValue())) out.put(x.getKey(), ((Number) x.getValue()).doubleValue());
        }
        return out;
    }

    public static Map<String, Boolean> kw(Map<String, Object> m) {
        Map<String, Boolean> out = new HashMap<>();
        if (m == null) return out;
        for (Map.Entry<String, Object> x : m.entrySet()) {
            if (x.getValue() instanceof Boolean) out.put(x.getKey(), (Boolean) x.getValue());
        }
        return out;
    }

    public static List<LogEntry> log(Object list) {
        List<LogEntry> out = new ArrayList<>();
        for (Object o : asList(list)) {
            Map<String, Object> m = asMap(o);
            if (m == null) continue;
            LogEntry e = new LogEntry();
            e.key = m.get("key") instanceof String ? (String) m.get("key") : null;
            e.act = m.get("act") instanceof String ? (String) m.get("act") : null;
            e.kind = m.get("kind") instanceof String ? (String) m.get("kind") : null;
            e.n = isNumber(m.get("n")) ? ((Number) m.get("n")).doubleValue() : null;
            e.t = numOr(m.get("t"), Double.NaN);
            out.add(e);
        }
        return out;
    }

    // ───────── 계획 ─────────

    /**
     * 실제 준비 시간: '시작했어요' → '나갔어요' 사이(3~240분). 최근 5번의 가운데 값을 5분 단위로 올림(10~120), 3번 이상일 때만 쓴다
     */
    public static Learned learned(List<LogEntry> log) {
        Learned r = new Learned();
        List<LogEntry> sorted = new ArrayList<>(log == null ? Collections.<LogEntry>emptyList() : log);
        try {
            Collections.sort(sorted, (a, b) -> {
                double d = a.t - b.t;
                return d < 0 ? -1 : d > 0 ? 1 : 0;
            });
        } catch (IllegalArgumentException ignored) {
            // t가 숫자가 아닌 줄이 섞이면 순서를 정할 수 없다(우리 기록에는 없음)
        }
        Map<String, Double> starts = new HashMap<>();
        for (LogEntry e : sorted) {
            if ("start".equals(e.act)) {
                starts.put(e.key, e.t);
            } else if ("left".equals(e.act) && starts.containsKey(e.key)) {
                double m = jsRound((e.t - starts.get(e.key)) / MIN);
                if (m >= 3 && m <= 240) {
                    Sample s = new Sample();
                    s.key = e.key;
                    s.t = e.t;
                    s.minutes = m;
                    r.samples.add(s);
                }
                starts.remove(e.key);
            }
        }
        List<Sample> last = r.samples.subList(Math.max(0, r.samples.size() - 5), r.samples.size());
        if (last.size() < 3) return r;
        List<Double> s = new ArrayList<>();
        for (Sample x : last) s.add(x.minutes);
        Collections.sort(s);
        int n = s.size();
        double med = n % 2 == 1 ? s.get((n - 1) / 2) : (s.get(n / 2 - 1) + s.get(n / 2)) / 2;
        r.prep = clamp(ceil5(med), 10, 120);
        return r;
    }

    /** 약속 하나의 기록: 시작 · 나감 · 했음 · 미룬 분(단계별) · 울렸는지 */
    private static final class St {
        Double startedAt, leftAt, doneAt, lateAt;
        double snPrep, snLeave, snRemind;
        boolean rangPrep, rangLeave, rangRemind;
    }

    private static St stateOf(String key, List<LogEntry> log) {
        St r = new St();
        for (LogEntry e : log) {
            if (e.key == null || !e.key.equals(key)) continue;
            String act = e.act == null ? "" : e.act;
            switch (act) {
                case "start":
                    r.startedAt = Math.max(orZero(r.startedAt), e.t);
                    break;
                case "left":
                    r.leftAt = Math.max(orZero(r.leftAt), e.t);
                    break;
                case "done":
                    r.doneAt = Math.max(orZero(r.doneAt), e.t);
                    break;
                case "late":
                    r.lateAt = Math.max(orZero(r.lateAt), e.t);
                    break;
                case "snooze": {
                    double n = orZero(e.n);
                    if ("leave".equals(e.kind)) r.snLeave += n;
                    else if ("remind".equals(e.kind)) r.snRemind += n;
                    else r.snPrep += n;
                    break;
                }
                case "rang":
                    if ("prep".equals(e.kind)) r.rangPrep = true;
                    else if ("leave".equals(e.kind)) r.rangLeave = true;
                    else if ("remind".equals(e.kind)) r.rangRemind = true;
                    break;
                case "undo":
                    if ("start".equals(e.kind)) r.startedAt = null;
                    else if ("left".equals(e.kind)) r.leftAt = null;
                    else if ("done".equals(e.kind)) r.doneAt = null;
                    break;
                default:
                    break;
            }
        }
        return r;
    }

    private static final class Src {
        String key, src, title, place, calName, calId, eventId;
        double start;
        Double end;
        boolean allDay;
        Boolean explicitOut;
    }

    /** 캘린더 약속 + 이 앱에만 넣은 것(캘린더 권한이 없을 때) */
    private static List<Src> sources(Input in) {
        List<Src> out = new ArrayList<>();
        for (Event ev : in.events) {
            Src x = new Src();
            x.key = "c:" + ev.id + ":" + jsNum(ev.begin);
            x.src = "cal";
            x.title = ev.title == null ? "" : ev.title;
            x.place = ev.location == null ? "" : ev.location;
            x.start = ev.begin;
            x.end = truthy(ev.end) ? ev.end : null;
            x.allDay = ev.allDay;
            x.calName = ev.calName == null ? "" : ev.calName;
            x.explicitOut = null;
            x.calId = ev.calId;
            x.eventId = ev.eventId;
            out.add(x);
        }
        for (Item it : in.items) {
            Src x = new Src();
            x.key = "o:" + it.id;
            x.src = "own";
            x.title = it.title == null ? "" : it.title;
            x.place = it.place == null ? "" : it.place;
            x.start = it.at;
            x.end = truthy(it.endAt) ? it.endAt : null;
            x.allDay = it.allDay;
            x.calName = "";
            x.explicitOut = it.out;
            out.add(x);
        }
        return out;
    }

    private static final Ov NO_OV = new Ov();

    public static List<Entry> plan(Input in) {
        Settings S = in.settings;
        double now = in.now;
        Learned L = learned(in.log);
        List<Entry> list = new ArrayList<>();
        for (Src x : sources(in)) {
            Ov o = in.overrides.get(x.key);
            if (o == null) o = NO_OV;
            String pk = normPlace(x.place), tk = normTitle(x.title);
            // 나가는 약속인지: 내가 정한 것 > 넣을 때 정한 것 > 같은 제목에 전에 정한 것 > 장소(온라인 아님) > (제목 낱말은 묻기만)
            boolean out = false;
            String outWhy = "none";
            if (x.allDay) outWhy = "allday";
            else if (o.out != null) { out = o.out; outWhy = "user"; }
            else if (x.explicitOut != null) { out = x.explicitOut; outWhy = "user"; }
            else if (!tk.isEmpty() && in.kw.containsKey(tk)) { out = in.kw.get(tk); outWhy = "memory"; }
            else if (!pk.isEmpty() && !isOnline(x.place)) { out = true; outWhy = "place"; }
            else if (!isOnline(x.place) && hasOutWord(x.title)) outWhy = "word";
            double prep = S.prepDefault;
            String prepWhy = "default";
            if (o.prep != null) { prep = o.prep; prepWhy = "user"; }
            else if (truthy(L.prep)) { prep = L.prep; prepWhy = "learned"; }
            double travel = S.travelDefault;
            String travelWhy = "default";
            if (o.travel != null) { travel = o.travel; travelWhy = "user"; }
            else if (!pk.isEmpty() && in.places.containsKey(pk)) { travel = in.places.get(pk); travelWhy = "place"; }
            St st = stateOf(x.key, in.log);
            double snoozed = st.snPrep + st.snLeave;
            Entry e = new Entry();
            e.key = x.key;
            e.src = x.src;
            e.calName = x.calName;
            e.title = x.title;
            e.place = x.place;
            e.allDay = x.allDay;
            e.start = x.start;
            e.end = x.end;
            e.out = out;
            e.outWhy = outWhy;
            e.suggest = "word".equals(outWhy);
            e.prep = prep;
            e.prepWhy = prepWhy;
            e.travel = travel;
            e.travelWhy = travelWhy;
            e.off = o.off;
            e.buffer = S.buffer;
            e.snoozed = snoozed;
            e.snRemind = st.snRemind;
            e.startedAt = st.startedAt;
            e.leftAt = st.leftAt;
            e.doneAt = st.doneAt;
            e.lateAt = st.lateAt;
            e.rangPrep = st.rangPrep;
            e.rangLeave = st.rangLeave;
            e.rangRemind = st.rangRemind;
            e.calId = x.calId;
            e.eventId = x.eventId;
            if (out) {
                // 미룬 만큼 뒤로(미루기는 도착 여유를 쓴다): 준비 시작은 준비 단계에서 미룬 만큼, 출발은 모두 미룬 만큼
                double leave0 = x.start - (travel + S.buffer) * MIN;
                e.prepAt = leave0 - prep * MIN + st.snPrep * MIN;
                e.leaveAt = leave0 + snoozed * MIN;
                if (S.heads > 0 && S.heads < prep) e.headsAt = e.leaveAt - S.heads * MIN;
            }
            if (out && truthy(e.leftAt)) e.state = "left";
            else if (out && truthy(e.startedAt)) e.state = "prep";
            else if (!out && truthy(e.doneAt)) e.state = "done";
            else if (!x.allDay && now >= x.start) e.state = "past";
            list.add(e);
        }
        Collections.sort(list, (a, b) -> {
            int c = a.allDay == b.allDay ? 0 : a.allDay ? -1 : 1;
            if (c != 0) return c;
            double d = a.start - b.start;
            if (d != 0 && !Double.isNaN(d)) return d < 0 ? -1 : 1;
            int k = a.key.compareTo(b.key);
            return k < 0 ? -1 : k > 0 ? 1 : 0;
        });
        // 빠듯함: 앞 약속이 끝나기 전에 다음 약속 준비를 시작해야 하는 경우(둘 다 나가는 약속). 끝 시각이 없으면 한 시간으로 본다
        List<Entry> outs = new ArrayList<>();
        for (Entry e : list) if (e.out && !e.off) outs.add(e);
        for (int i = 1; i < outs.size(); i++) {
            Entry a = outs.get(i - 1), b = outs.get(i);
            double aEnd = truthy(a.end) && a.end > a.start ? a.end : a.start + 60 * MIN;
            if (b.start > a.start && b.prepAt < aEnd) {
                Tight t = new Tight();
                t.key = a.key;
                t.title = a.title;
                t.minutes = jsRound((aEnd - b.prepAt) / MIN);
                b.tight = t;
            }
        }
        return list;
    }

    /** Math.round(자바스크립트): 반은 위로(자바 Math.round와 같음), NaN · 무한은 그대로 */
    static double jsRound(double v) {
        return fin(v) ? (double) Math.round(v) : v;
    }

    /**
     * 지금(now) 뒤에 울릴 알람. 시각이 이미 지났는데 한 번도 안 울렸으면 곧바로(5초 뒤) 울린다.
     * 대답이 없을 때 다시 울리는 것(붙잡기)은 울린 뒤 휴대폰 쪽(BAlarmReceiver)이 붙인다
     */
    public static List<Alarm> alarms(List<Entry> entries, Input in) {
        Settings S = in.settings;
        double now = in.now;
        List<Alarm> out = new ArrayList<>();
        for (Entry e : entries) {
            if (e.off || e.allDay) continue;
            if (e.out) {
                if ("left".equals(e.state) || now >= e.start) continue;
                if ("idle".equals(e.state)) {
                    if (e.prepAt > now) push(out, "prep", e, e.prepAt, true);
                    else if (!e.rangPrep && now < e.leaveAt) push(out, "prep", e, now + SOON, true);
                }
                if (truthy(e.headsAt) && e.headsAt > now) push(out, "heads", e, e.headsAt, false);
                if (e.leaveAt > now) push(out, "leave", e, e.leaveAt, true);
                else if (!e.rangLeave) push(out, "leave", e, now + SOON, true);
            } else if ("own".equals(e.src) && S.remindOwn && !"done".equals(e.state)) {
                double at = e.start + e.snRemind * MIN;
                if (at > now) push(out, "remind", e, at, true);
                else if (!e.rangRemind && now < e.start + 30 * MIN) push(out, "remind", e, now + SOON, true);
            }
        }
        // 아침 요약: 그날 나가는 약속(또는 이 앱에 넣은 알림)이 있고, 그날 첫 준비 시작보다 이를 때만
        if (S.morningOn && isHm(S.morningAt == null ? "" : S.morningAt)) {
            double hh = Integer.parseInt(S.morningAt.substring(0, 2)), mm = Integer.parseInt(S.morningAt.substring(3, 5));
            for (Day day : in.days) {
                double at = day.midnight + (hh * 60 + mm) * MIN, end = day.midnight + 1440 * MIN;
                boolean any = false;
                double firstPrep = Double.POSITIVE_INFINITY;
                for (Entry e : entries) {
                    if (e.off || e.allDay || !(e.start >= day.midnight) || !(e.start < end) || !(e.out || "own".equals(e.src))) continue;
                    any = true;
                    if (e.out) firstPrep = Math.min(firstPrep, e.prepAt == null ? 0 : e.prepAt);
                }
                if (!any || at <= now + 1000) continue;
                if (at < firstPrep) {
                    Alarm a = new Alarm();
                    a.id = "morning:" + day.ymd;
                    a.key = "day:" + day.ymd;
                    a.kind = "morning";
                    a.at = at;
                    a.strong = false;
                    out.add(a);
                }
            }
        }
        Collections.sort(out, (a, b) -> {
            double d = a.at - b.at;
            if (d != 0 && !Double.isNaN(d)) return d < 0 ? -1 : 1;
            int k = a.id.compareTo(b.id);
            return k < 0 ? -1 : k > 0 ? 1 : 0;
        });
        return out;
    }

    private static void push(List<Alarm> out, String kind, Entry e, double at, boolean strong) {
        Alarm a = new Alarm();
        a.id = kind + ":" + e.key;
        a.key = e.key;
        a.kind = kind;
        a.at = at;
        a.strong = strong;
        out.add(a);
    }

    /**
     * 미루기: 남은 도착 여유의 절반(올림)씩이라 미룰수록 간격이 준다(10 → 5, 5 → 3, 2 → 1분).
     * 0이면 미루기를 내지 않고 '지금 시작 · 늦는다고 알리기'만 낸다(대표 결정 11/6)
     */
    public static double snoozeLeft(Entry e) {
        double r = Math.max(0, e.buffer - e.snoozed);
        return r >= 2 ? Math.ceil(r / 2) : r;
    }

    /** 지금 시작하면 몇 분 늦는지(5분 단위 올림, 늦지 않으면 0) */
    public static double lateIfStartNow(Entry e, double now) {
        double m = (now + (e.prep + e.travel) * MIN - e.start) / MIN;
        return m > 0 ? ceil5(m) : 0;
    }

    /** 지금 나가면 몇 분 늦는지(5분 단위 올림, 늦지 않으면 0) */
    public static double lateIfLeaveNow(Entry e, double now) {
        double m = (now + e.travel * MIN - e.start) / MIN;
        return m > 0 ? ceil5(m) : 0;
    }
}
