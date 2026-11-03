package kr.boxworks.app;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 명상·공부 배경 소리(시험판 33). 웹에서는 Capacitor.Plugins.BxSound로 부른다.
 * play({sound, mode: 'only'|'med', startAt, until}) · preview({sound}) 6초 미리 듣기 · stop() · status() · 'state' 알림
 */
@CapacitorPlugin(name = "BxSound")
public class BxSoundPlugin extends Plugin {
    private static volatile BxSoundPlugin inst;
    private static BgPlayer preview;

    @Override
    public void load() {
        inst = this;
    }

    @PluginMethod
    public void play(PluginCall call) {
        String sound = call.getString("sound", "");
        String mode = call.getString("mode", "only");
        JSObject d = call.getData();
        long startAt = d.optLong("startAt", 0);
        long until = d.optLong("until", 0);
        if (!BgPlayer.valid(sound)) {
            call.reject("배경 소리 이름이 맞지 않아요");
            return;
        }
        try {
            BxSoundService.play(getContext(), sound, "med".equals(mode) ? "med" : "only", startAt, until);
            call.resolve(state());
        } catch (Exception e) {
            call.reject("배경 소리를 틀지 못했어요", e);
        }
    }

    /** 칸을 누르면 6초 동안 들려 준다(0.6초 동안 커지고 마지막 1.5초 동안 줄어듦). sound가 없으면 멈춤 */
    @PluginMethod
    public void preview(PluginCall call) {
        String sound = call.getString("sound", "");
        if (BgPlayer.valid(sound)) previewPlay(getContext(), sound);
        else previewStop();
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        previewStop();
        BxSoundService.requestStop(getContext());
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject o = state();
        o.put("medCancel", SoundPrefs.medCancel(getContext()));
        o.put("bell", SoundPrefs.bell(getContext()));
        o.put("bg", SoundPrefs.bg(getContext()));
        call.resolve(o);
    }

    /** 시험판 44: 소리 크기(0~1). bell 종소리 · bg 배경 소리. 틀고 있는 배경 소리는 바로 따른다 */
    @PluginMethod
    public void setVolume(PluginCall call) {
        JSObject d = call.getData();
        Double bell = d.has("bell") ? d.optDouble("bell", 1) : null;
        Double bg = d.has("bg") ? d.optDouble("bg", 1) : null;
        SoundPrefs.set(getContext(), bell, bg);
        call.resolve();
    }

    static synchronized void previewPlay(Context c, String sound) {
        if (preview != null) preview.finish(0.3f);
        final BgPlayer p = new BgPlayer(c, sound, 0, System.currentTimeMillis() + 6000, 0.6f, 1.5f, ended -> {
            synchronized (BxSoundPlugin.class) {
                if (preview == ended) preview = null;
            }
        });
        preview = p;
        p.start();
    }

    static synchronized void previewStop() {
        if (preview != null) preview.finish(0.3f);
        preview = null;
    }

    static JSObject state() {
        JSObject o = new JSObject();
        String s = BxSoundService.nowSound;
        o.put("playing", s != null && !s.isEmpty());
        o.put("sound", s == null ? "" : s);
        o.put("mode", BxSoundService.nowMode);
        o.put("until", BxSoundService.nowUntil);
        return o;
    }

    /** 서비스가 켜지거나 꺼질 때 화면에 알린다(알림의 '끄기', 명상 끝 등) */
    static void changed() {
        BxSoundPlugin p = inst;
        if (p == null) return;
        try {
            p.notifyListeners("state", state());
        } catch (Exception ignored) {
        }
    }
}
