# 명상·공부 배경 소리 만들기(시험판 33, 대표 요청·결정 11/3, 결정 기록 D-12).
# 녹음 넷은 모두 CC0(공개 녹음: 상업용 포함 자유롭게 쓰고 고칠 수 있고, 출처 표시 의무 없음). 출처와 확인 기록은 BG-SOURCES.md
#  - 파도: 잔잔한 파도가 2~3m 앞 모래에 닿는 소리, 120초
#  - 숲속 새소리: 침엽수 숲 새벽 합창(가까이서 크게 우는 새 하나가 아니라 여러 새가 고르게), 120초
#  - 바람: 나무 사이로 부는 고른 바람, 120초
#  - 갈대: 쓸 만한 갈대 녹음이 없어 가장 비슷한 '마른 풀이 바람에 스치는 소리'(대표가 들어 보고 정함), 90초
#  - 백색소음은 파일이 아니라 휴대폰에서 그때그때 만든다(BxSoundService). 여기서는 그 세기만 맞춰 본다
# 하는 일: 녹음 → 48kHz 두 채널 → 낮은 웅웅거림(마이크에 닿는 바람)을 거름 → 반복 구간을 잘라 끝과 처음을 3초 동안
#   섞어 이음새 없이 되풀이되게 → 귀에 들리는 세기(LUFS)를 맞춤 → OGG(Vorbis q6, 한 번만)
# 시험판 54(대표 11/4 22:32 '사운드들이 전체적으로 다 거칠다', 측정 조사 11/5): 바람 · 갈대의 고음 키움(+6 · +5dB)을 빼고
#   낮은 쪽을 다듬음(120Hz 아래 거르기 + 250Hz 아래 −4dB). 압축은 q3 → q6(6kHz 위가 한쪽으로 뭉개지던 것, '점 스테레오')
# 쓰는 법: python3 -I make-bg.py <녹음 폴더> <출력 폴더>  → bx_bg_<이름>.ogg
# 녹음 폴더의 파일은 sha256이 맞는지 먼저 본다(다른 파일이면 멈춤). ffmpeg는 녹음을 소리 자료로만 푼다
import hashlib, json, os, subprocess, sys
import numpy as np, scipy.signal as ss, pyloudnorm as pyln

SR = 48000
XF = 3.0  # 이음새를 섞는 길이(초)

# 세기(LUFS): 파도·갈대 −22, 바람은 스피커에서 3dB 작게 들려 −21. 새소리는 짧게 튀는 소리가 있어 −24, 백색소음은 고르게 꽉 차 오래 들으면 피곤해 −25
SOUNDS = {
    'waves': dict(src='waves/1/sea-calm-hq-v2.mp3', sha='3c1a6051b5c10b1df608d7b160e9385a51a9badbb08ea65fa8c7498008d1f9e6',
                  start=72.0, length=120.0, lufs=-22.0),
    'birds': dict(src='forest-birds/1/dawn.mp3', sha='33c18b00b2980a072c14daecffc875baa6ace2346a3c9f830003df1eb1586e0e',
                  start=353.0, length=120.0, hp=(100, 2), lufs=-24.0),
    # 바람은 거의 다 300Hz 아래(웅— 하는 낮은 소리)라 휴대폰 스피커에서는 7dB쯤 작게 들린다. 200Hz 아래를 덜고 1kHz 위를 6dB 올려
    # '쏴—' 하는 결이 스피커에서도 들리게(스피커에서 작아지는 정도 7 → 3dB)
    'wind': dict(src='wind/1/wind.mp3', sha='da6ba4e941385f9e1ce70a7690f85512f5db281cc8526d1521ec742597bf4e8b',
                 start=11.0, length=120.0, hp=(120, 2), low=(250.0, -4.0), lufs=-20.0),  # 고음을 안 키우니 휴대폰 스피커에서 작게 들려 1dB 올림(최고점 −3dB 아래로)
    'reeds': dict(src='reeds/1/dry-grass-wind.ogg', sha='80bfbb90a7845994d4005ec679dd275ff5ca2a4eceeb69e6716ddac6c909d9d9',
                  start=40.0, length=90.0, hp=(120, 2), low=(250.0, -4.0), lufs=-22.0),
}
NOISE_LUFS = -25.0


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def decode(path):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-map', '0:a:0', '-af', 'aresample=%d:resampler=soxr' % SR,
                        '-ac', '2', '-f', 'f32le', '-acodec', 'pcm_f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype='<f4').astype(np.float64).reshape(-1, 2)


def high_shelf(f0, gain_db, q=0.707):
    # RBJ 오디오 EQ 요리책의 높은 쪽 선반
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; c, s = np.cos(w), np.sin(w); al = s / (2 * q); sa = 2 * np.sqrt(A) * al
    b = [A * ((A + 1) + (A - 1) * c + sa), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sa)]
    a = [(A + 1) - (A - 1) * c + sa, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sa]
    return np.array(b) / a[0], np.array(a) / a[0]


def low_shelf(f0, gain_db, q=0.707):
    # RBJ 오디오 EQ 요리책의 낮은 쪽 선반
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; c, s = np.cos(w), np.sin(w); al = s / (2 * q); sa = 2 * np.sqrt(A) * al
    b = [A * ((A + 1) - (A - 1) * c + sa), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sa)]
    a = [(A + 1) + (A - 1) * c + sa, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sa]
    return np.array(b) / a[0], np.array(a) / a[0]


def make_loop(y, start, length):
    """start부터 length초. 끝 다음 3초를 처음 3초에 같은 힘으로 섞어(sin/cos) 끝에서 처음으로 끊김 없이 넘어가게"""
    a, L, n = int(round(start * SR)), int(round(length * SR)), int(round(XF * SR))
    seg = y[a:a + L + n]
    if len(seg) < L + n:
        raise SystemExit('구간이 녹음보다 깁니다')
    t = (np.arange(n) + 0.5) / n
    out = seg[:L].copy()
    out[:n] = seg[:n] * np.sin(0.5 * np.pi * t)[:, None] + seg[L:L + n] * np.cos(0.5 * np.pi * t)[:, None]
    return out


def lufs(x):
    return pyln.Meter(SR).integrated_loudness(x)


def encode(x, path):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-map_metadata', '-1',
                    '-c:a', 'libvorbis', '-q:a', '6', path], input=x.astype('<f4').tobytes(), check=True)


def noise(sec, seed=7):
    """휴대폰 쪽(BgPlayer) 소음과 같은 방법(시험판 54 '부드러운 소음'): 두 채널 따로 고른 잡음 → 분홍 소음(Paul Kellet 필터)
    → 100Hz 아래 거르기(2차) → 6kHz 위를 완만히 눅임(1차). 전 백색소음은 8kHz 위가 47%라 날카로웠다(날카로움 2.52 → 1.82 acum)"""
    rng = np.random.default_rng(seed)
    x = rng.uniform(-1, 1, (int(sec * SR), 2))
    b = [0.99886, 0.99332, 0.96900, 0.86650, 0.55000, -0.7616]
    k = [0.0555179, 0.0750759, 0.1538520, 0.3104856, 0.5329522, -0.0168980]
    y = np.zeros_like(x)
    for bi, ki in zip(b, k):
        y += ss.lfilter([ki], [1, -bi], x, axis=0)
    y += np.vstack([np.zeros((1, 2)), x[:-1]]) * 0.115926 + x * 0.5362
    y = ss.sosfilt(ss.butter(2, 100, 'highpass', fs=SR, output='sos'), y, axis=0)
    return ss.sosfilt(ss.butter(1, 6000, 'lowpass', fs=SR, output='sos'), y, axis=0)


def main():
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    report = {}
    for name, k in SOUNDS.items():
        p = os.path.join(src_dir, k['src'])
        if sha256(p) != k['sha']:
            raise SystemExit(name + ': 녹음 파일이 기록과 다릅니다')
        y = decode(p)
        if 'hp' in k:
            f, order = k['hp']
            y = ss.sosfilt(ss.butter(order, f, 'highpass', fs=SR, output='sos'), y, axis=0)
        if 'shelf' in k:
            b, a = high_shelf(*k['shelf'])
            y = ss.lfilter(b, a, y, axis=0)
        if 'low' in k:
            b, a = low_shelf(*k['low'])
            y = ss.lfilter(b, a, y, axis=0)
        x = make_loop(y, k['start'], k['length'])
        g = k['lufs'] - lufs(x)
        x = x * 10 ** (g / 20)
        peak = 20 * np.log10(np.abs(x).max())
        if peak > -1.0:
            raise SystemExit(name + ': 너무 큰 순간이 있습니다(%.1f dBFS)' % peak)
        out = os.path.join(out_dir, 'bx_bg_' + name + '.ogg')
        encode(x, out)
        report[name] = dict(lufs=round(lufs(x), 2), gain_db=round(g, 2), peak_dbfs=round(peak, 2), sec=k['length'], bytes=os.path.getsize(out))
    # 백색소음: 진폭 1일 때의 세기를 재서, 목표 세기가 되는 배율을 휴대폰 쪽(BxSoundService.NOISE_GAIN)에 쓴다
    n = noise(60)
    report['noise'] = dict(lufs_at_1=round(lufs(n), 2), gain=round(10 ** ((NOISE_LUFS - lufs(n)) / 20), 4), lufs=NOISE_LUFS)
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
