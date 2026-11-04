package kr.boxworks.app;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.os.Build;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.nio.ShortBuffer;
import java.util.Arrays;

/**
 * 배경 소리 하나를 끊김 없이 되풀이해 트는 재생기(시험판 33, 대표 요청·결정 11/3, 결정 기록 D-12).
 * 파일(res/raw/bx_bg_*.ogg)은 끝과 처음이 이어지게 만든 반복 구간이라(scripts/sound/make-bg.py) 한 번 풀어 메모리에 두고 돈다.
 * 백색소음은 파일 없이 여기서 만든다(시험판 54 '부드러운 소음'): 두 채널 따로 고른 잡음 → 분홍 소음(Paul Kellet 필터)
 * → 100Hz 아래 거르기(2차 버터워스) → 6kHz 위를 완만히 눅임(1차). make-bg.py의 noise와 같은 방법.
 * 전에는 거의 하얀 잡음이라 8kHz 위가 47% — 거칠고 날카로웠다(대표 11/4 22:32). 이름은 '백색소음' 그대로.
 * 소리 크기는 휴대폰 미디어 소리(음량 단추)를 따른다. 켤 때 서서히 커지고, 끌 때 서서히 줄어든다.
 */
final class BgPlayer extends Thread {
    interface Listener {
        void ended(BgPlayer p);
    }

    /** waves 파도 · birds 숲속 새소리 · wind 바람 · reeds 갈대 · noise 백색소음 */
    static final String[] SOUNDS = {"waves", "birds", "wind", "reeds", "noise"};
    /** make-bg.py가 잰 값: 진폭 1인 백색소음은 −1.6 LUFS, 이 배율을 곱하면 −25 LUFS(파일 소리보다 3dB 작게) */
    static final float NOISE_GAIN = 0.0312f; // make-bg.py가 잰 값(−25 LUFS)
    private static final int NOISE_RATE = 48000;
    private static final int FRAMES = 1024;

    final String sound;
    private final Context ctx;
    private final long startAt;
    private final long until;
    private final float fadeInSec;
    private final float untilFadeSec;
    private final Listener listener;
    private volatile boolean stopping = false;
    private volatile float stopFadeSec = 1.2f;
    private volatile boolean paused = false;
    private volatile float duck = 1f;
    /** 사용자가 정한 배경 소리 크기(0~1, 시험판 44). 틀고 있는 동안 바꾸면 바로 따른다 */
    static volatile float vol = -1f;

    private static float vol(Context c) {
        float v = vol;
        if (v < 0f) {
            v = SoundPrefs.bg(c);
            vol = v;
        }
        return v;
    }

    /**
     * startAt: 이때부터 소리를 낸다(명상 첫 종). until: 이때 줄이기 시작해 untilFadeSec 동안 줄이고 끝낸다(0이면 끌 때까지)
     */
    BgPlayer(Context c, String sound, long startAt, long until, float fadeInSec, float untilFadeSec, Listener l) {
        super("bx-bg-" + sound);
        this.ctx = c.getApplicationContext();
        this.sound = sound;
        this.startAt = startAt;
        this.until = until;
        this.fadeInSec = fadeInSec;
        this.untilFadeSec = untilFadeSec;
        this.listener = l;
    }

    static boolean valid(String s) {
        if (s == null) return false;
        for (String x : SOUNDS) if (x.equals(s)) return true;
        return false;
    }

    static String label(String s) {
        if ("waves".equals(s)) return "파도";
        if ("birds".equals(s)) return "숲속 새소리";
        if ("wind".equals(s)) return "바람";
        if ("reeds".equals(s)) return "갈대";
        if ("noise".equals(s)) return "백색소음";
        return "";
    }

    /** fadeSec 동안 줄이고 끝낸다 */
    void finish(float fadeSec) {
        stopFadeSec = fadeSec;
        stopping = true;
    }

    /** 전화 등으로 잠깐 멈춤 · 다시 이어짐 */
    void setPaused(boolean p) {
        paused = p;
    }

    /** 다른 소리(내비 안내 등)가 잠깐 날 때 작게 */
    void setDuck(float d) {
        duck = d;
    }

    private static void nap(long ms) {
        try {
            Thread.sleep(Math.max(1, ms));
        } catch (InterruptedException ignored) {
        }
    }

    @Override
    public void run() {
        android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_AUDIO);
        AudioTrack track = null;
        try {
            final boolean noise = "noise".equals(sound);
            Pcm pcm = noise ? null : decode(ctx, sound);
            if (!noise && pcm == null) return;
            final int rate = noise ? NOISE_RATE : pcm.rate;
            final int ch = noise ? 2 : pcm.ch;
            // 명상: 첫 종이 울릴 때까지 기다린다
            while (!stopping && System.currentTimeMillis() < startAt) nap(Math.min(100, startAt - System.currentTimeMillis()));
            if (stopping) return;
            int mask = ch == 1 ? AudioFormat.CHANNEL_OUT_MONO : AudioFormat.CHANNEL_OUT_STEREO;
            int min = AudioTrack.getMinBufferSize(rate, mask, AudioFormat.ENCODING_PCM_16BIT);
            int bytes = Math.max(min * 2, rate * ch * 2 / 4);
            track = new AudioTrack.Builder()
                .setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build())
                .setAudioFormat(new AudioFormat.Builder()
                    .setSampleRate(rate)
                    .setChannelMask(mask)
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .build())
                .setBufferSizeInBytes(bytes)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build();
            track.play();
            final short[] data = noise ? null : pcm.data;
            final int frames = noise ? 0 : pcm.frames;
            final short[] buf = new short[FRAMES * ch];
            final float fadeIn = 1f / (rate * Math.max(0.05f, fadeInSec));
            final float quick = 1f / (rate * 0.3f);
            // 소음 상태: xorshift 잡음 → 분홍(필터 7개) → 100Hz 고역 통과(2차) → 6kHz 저역 통과(1차)
            int seed = (int) System.nanoTime() | 1;
            final float[][] pk = new float[ch][7];
            // 2차 버터워스 고역 통과 100Hz(RBJ, Q = 1/√2)
            final double hw = 2 * Math.PI * 100 / rate, hc = Math.cos(hw), hal = Math.sin(hw) / (2 * 0.7071067811865476), ha0 = 1 + hal;
            final float hb0 = (float) ((1 + hc) / 2 / ha0), hb1 = (float) (-(1 + hc) / ha0), hb2 = hb0;
            final float ha1 = (float) (-2 * hc / ha0), ha2 = (float) ((1 - hal) / ha0);
            // 1차 버터워스 저역 통과 6kHz(쌍선형)
            final double lk = Math.tan(Math.PI * 6000 / rate);
            final float lb = (float) (lk / (1 + lk)), la = (float) ((lk - 1) / (lk + 1));
            final float[] hx1 = new float[ch], hx2 = new float[ch], hy1 = new float[ch], hy2 = new float[ch];
            final float[] lx1 = new float[ch], ly1 = new float[ch];
            float g = 0f;
            int pos = 0;
            boolean held = false;
            boolean dead = false;
            while (!dead) {
                if (!stopping && until > 0 && System.currentTimeMillis() >= until) finish(untilFadeSec);
                final boolean stop = stopping;
                float target;
                float step;
                if (stop) {
                    target = 0f;
                    step = 1f / (rate * Math.max(0.05f, stopFadeSec));
                } else if (paused) {
                    target = 0f;
                    step = quick;
                } else {
                    target = duck * vol(ctx);
                    step = g < target ? fadeIn : quick;
                }
                // 잠깐 멈춤: 다 줄었으면 재생을 멈추고 기다린다
                if (!stop && paused && g <= 0f) {
                    if (!held) {
                        track.pause();
                        held = true;
                    }
                    nap(100);
                    continue;
                }
                if (held) {
                    track.play();
                    held = false;
                }
                for (int f = 0; f < FRAMES; f++) {
                    if (g < target) {
                        g += step;
                        if (g > target) g = target;
                    } else if (g > target) {
                        g -= step;
                        if (g < target) g = target;
                    }
                    for (int c = 0; c < ch; c++) {
                        float s;
                        if (data == null) {
                            seed ^= seed << 13;
                            seed ^= seed >>> 17;
                            seed ^= seed << 5;
                            float w = seed * (1f / 2147483648f);
                            final float[] kb = pk[c];
                            kb[0] = 0.99886f * kb[0] + w * 0.0555179f;
                            kb[1] = 0.99332f * kb[1] + w * 0.0750759f;
                            kb[2] = 0.96900f * kb[2] + w * 0.1538520f;
                            kb[3] = 0.86650f * kb[3] + w * 0.3104856f;
                            kb[4] = 0.55000f * kb[4] + w * 0.5329522f;
                            kb[5] = -0.7616f * kb[5] - w * 0.0168980f;
                            float pnk = kb[0] + kb[1] + kb[2] + kb[3] + kb[4] + kb[5] + kb[6] + w * 0.5362f;
                            kb[6] = w * 0.115926f;
                            float hpv = hb0 * pnk + hb1 * hx1[c] + hb2 * hx2[c] - ha1 * hy1[c] - ha2 * hy2[c];
                            hx2[c] = hx1[c]; hx1[c] = pnk; hy2[c] = hy1[c]; hy1[c] = hpv;
                            float lpv = lb * hpv + lb * lx1[c] - la * ly1[c];
                            lx1[c] = hpv; ly1[c] = lpv;
                            s = lpv * NOISE_GAIN;
                        } else {
                            s = data[pos * ch + c] * (1f / 32768f);
                        }
                        float v = s * g * 32767f;
                        buf[f * ch + c] = (short) (v > 32767f ? 32767 : (v < -32768f ? -32768 : v));
                    }
                    if (data != null && ++pos >= frames) pos = 0;
                }
                int off = 0;
                while (off < buf.length) {
                    int w = track.write(buf, off, buf.length - off);
                    if (w < 0) {
                        dead = true;
                        break;
                    }
                    if (w == 0) nap(5);
                    off += w;
                }
                if (stop && g <= 0f) break;
            }
        } catch (Throwable ignored) {
            // 소리를 낼 수 없음(풀기 실패·메모리 부족 등): 조용히 끝낸다
        } finally {
            if (track != null) {
                try {
                    track.stop();
                } catch (Exception ignored) {
                }
                try {
                    track.release();
                } catch (Exception ignored) {
                }
            }
            if (listener != null) listener.ended(this);
        }
    }

    static final class Pcm {
        short[] data;
        int frames;
        int ch;
        int rate;
    }

    /** OGG를 16비트 PCM으로 한 번에 푼다(120초 두 채널 48kHz ≈ 23MB). 길이는 파일에 적힌 길이에 맞춘다 */
    static Pcm decode(Context c, String sound) {
        int id = c.getResources().getIdentifier("bx_bg_" + sound, "raw", c.getPackageName());
        if (id == 0) return null;
        MediaExtractor ex = new MediaExtractor();
        MediaCodec codec = null;
        try {
            AssetFileDescriptor afd = c.getResources().openRawResourceFd(id);
            try {
                ex.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            } finally {
                afd.close();
            }
            int track = -1;
            MediaFormat fmt = null;
            for (int i = 0; i < ex.getTrackCount(); i++) {
                MediaFormat f = ex.getTrackFormat(i);
                String mime = f.getString(MediaFormat.KEY_MIME);
                if (mime != null && mime.startsWith("audio/")) {
                    track = i;
                    fmt = f;
                    break;
                }
            }
            if (track < 0) return null;
            ex.selectTrack(track);
            int rate = fmt.getInteger(MediaFormat.KEY_SAMPLE_RATE);
            int ch = fmt.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
            long durUs = fmt.containsKey(MediaFormat.KEY_DURATION) ? fmt.getLong(MediaFormat.KEY_DURATION) : 0;
            int expected = durUs > 0 ? (int) Math.round(durUs * (double) rate / 1e6) : 0;
            short[] out = new short[expected > 0 ? (expected + rate) * ch : rate * ch * 130];
            int n = 0;
            boolean floatPcm = false;
            codec = MediaCodec.createDecoderByType(fmt.getString(MediaFormat.KEY_MIME));
            codec.configure(fmt, null, null, 0);
            codec.start();
            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            boolean inEos = false;
            boolean outEos = false;
            int idle = 0;
            while (!outEos && idle < 500) {
                if (!inEos) {
                    int ii = codec.dequeueInputBuffer(10000);
                    if (ii >= 0) {
                        ByteBuffer ib = codec.getInputBuffer(ii);
                        int sz = ib == null ? -1 : ex.readSampleData(ib, 0);
                        if (sz < 0) {
                            codec.queueInputBuffer(ii, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            inEos = true;
                        } else {
                            codec.queueInputBuffer(ii, 0, sz, ex.getSampleTime(), 0);
                            ex.advance();
                        }
                    }
                }
                int oi = codec.dequeueOutputBuffer(info, 10000);
                if (oi >= 0) {
                    idle = 0;
                    ByteBuffer ob = codec.getOutputBuffer(oi);
                    if (ob != null && info.size > 0) {
                        ob.position(info.offset);
                        ob.limit(info.offset + info.size);
                        ob.order(ByteOrder.nativeOrder());
                        if (floatPcm) {
                            FloatBuffer fb = ob.asFloatBuffer();
                            int k = fb.remaining();
                            if (n + k > out.length) out = Arrays.copyOf(out, Math.max(out.length * 2, n + k));
                            for (int j = 0; j < k; j++) {
                                float v = fb.get() * 32767f;
                                out[n++] = (short) (v > 32767f ? 32767 : (v < -32768f ? -32768 : v));
                            }
                        } else {
                            ShortBuffer sb = ob.asShortBuffer();
                            int k = sb.remaining();
                            if (n + k > out.length) out = Arrays.copyOf(out, Math.max(out.length * 2, n + k));
                            sb.get(out, n, k);
                            n += k;
                        }
                    }
                    codec.releaseOutputBuffer(oi, false);
                    if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outEos = true;
                } else if (oi == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    MediaFormat of = codec.getOutputFormat();
                    if (of.containsKey(MediaFormat.KEY_SAMPLE_RATE)) rate = of.getInteger(MediaFormat.KEY_SAMPLE_RATE);
                    if (of.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) ch = of.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && of.containsKey(MediaFormat.KEY_PCM_ENCODING)) {
                        floatPcm = of.getInteger(MediaFormat.KEY_PCM_ENCODING) == AudioFormat.ENCODING_PCM_FLOAT;
                    }
                } else if (oi == MediaCodec.INFO_TRY_AGAIN_LATER) {
                    idle++;
                }
            }
            if (ch < 1 || ch > 2) return null;
            int frames = n / ch;
            if (frames < rate) return null;
            if (expected > 0 && frames > expected) {
                frames = expected;
            } else if (expected > 0 && frames < expected) {
                // 휴대폰이 앞이나 끝을 조금 덜 풀었으면 이음새에서 '틱' 소리가 나지 않게 10ms를 같은 힘으로 섞는다
                int k = rate / 100;
                for (int i = 0; i < k; i++) {
                    double t = (i + 0.5) / k;
                    float fi = (float) Math.sin(Math.PI / 2 * t);
                    float fo = (float) Math.cos(Math.PI / 2 * t);
                    for (int cc = 0; cc < ch; cc++) {
                        int ai = i * ch + cc;
                        int bi = (frames - k + i) * ch + cc;
                        float v = out[ai] * fi + out[bi] * fo;
                        out[ai] = (short) (v > 32767f ? 32767 : (v < -32768f ? -32768 : v));
                    }
                }
                frames -= k;
            }
            Pcm p = new Pcm();
            p.data = out;
            p.frames = frames;
            p.ch = ch;
            p.rate = rate;
            return p;
        } catch (Throwable e) {
            return null;
        } finally {
            if (codec != null) {
                try {
                    codec.stop();
                } catch (Exception ignored) {
                }
                try {
                    codec.release();
                } catch (Exception ignored) {
                }
            }
            try {
                ex.release();
            } catch (Exception ignored) {
            }
        }
    }
}
