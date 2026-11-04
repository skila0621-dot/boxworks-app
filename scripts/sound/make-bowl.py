# 싱잉볼 소리 합성(박스웍스 명상·싱잉볼 루틴). 우리가 직접 만든 소리라 저작권 걱정이 없다.
# 2판(2026-10-31, 대표 지적 "울림이 너무 짧고 한 번 울린 뒤 비어 버린다, 더 맑고 긴 소리, 종류 여러 가지"):
#  - 네 가지: clear 맑은 볼, deep 깊은 볼, crystal 크리스탈 볼, chime 작은 종
#  - 울림을 40~60초로 길게(바탕음 t60 36~76초). 높은 배음은 빨리 줄여 맑게, 친 순간 잡음은 줄임
#  - 한 번 치기(시작·중간 종) + 세 번 치기(끝, 4초 간격)
# 3판(2026-11-03, 대표 지적 "깊은 볼 말고는 너무 높은 음역의 날카로운 소리라 불편하다, 덜 날카롭게"):
#  - 깊은 볼(146.8Hz)은 그대로. 나머지 셋을 깊은 볼 쪽 음역으로 낮춤: 맑은 볼 330→196Hz, 크리스탈 볼 523→262Hz, 작은 종 880→294Hz
#  - 높은 배음을 더 줄이고, 치는 순간을 부드럽게(맑은 볼·작은 종 30ms, 크리스탈 볼은 문질러 부풀듯 80ms)
#  - 높은 소리일수록 같은 세기에도 크게 들리므로, 귀에 들리는 세기(A 가중) 차이를 반쯤 줄여 깊은 볼 쪽으로 맞춘다
# 4판(2026-11-03 오후, 대표 지적 "종소리의 시작이 너무 갑작스럽다, 작게 시작해 천천히 커지게"):
#  - 시작 종·중간 종: 치는 순간 대신 2.5초 동안 부드럽게 부풀어 오른다(반 코사인). 친 순간 '톡'도 이 안에서 들리지 않게 된다
#  - 끝 종(세 번): 대표 지적 11/3 "명상이 끝나도 소리가 계속 나와 끝을 모르겠다, 끝은 소리로 분명히" → 0.15초 만에 오르는 또렷한 세 번,
#    울림은 30초 안에 닫는다(마지막 10초 동안 줄임). 예전 끝 종은 60초 넘게 울려 배경 소리와 섞였다
#  - 세기는 3판과 같다(부풀기 전 소리로 배율을 정함)
# 5판(2026-11-05, 대표 지적 11/4 22:32 '사운드들이 전체적으로 다 거칠다' → 측정 조사): 휴대폰 스피커가 낼 수 있게
#  - 전: 소리의 92~100%가 300Hz 아래(바탕음 하나에 몰림) → 폰 스피커가 거의 못 내는 음역이라 크게 틀면 찌그러짐(스피커 모형에서 14~20dB 작아짐)
#  - 실제 싱잉볼처럼 위 배음(바탕의 약 2.7 · 5.2 · 8.4 · 12배)을 −9 ~ −20dB로 살리고, 높을수록 빨리 줄인다(울림 시간 ∝ 1/높이)
#  - 떨림(맴돌이)은 배음마다 조금 어긋난 두 소리로만(0.4~2Hz, 3~6dB). 전에 모든 배음에 같이 걸던 깊은 떨림(13~21dB)은 뺌
#  - 친 순간은 부드러운 채(5ms) + 아주 작은 닿는 소리(−36dB), 작은 방 울림(1.2초, −18dB), 칠 때마다 ±0.2% 높이 차이
#  - 높이 · 2.5초 부풀기 · 끝 종 세 번(30초 안에 닫음)은 그대로(대표 결정). 48kHz로 만들고 16bit로 줄일 때 TPDF 디더, 최고점 −6dB
# 쓰는 법: python3 make-bowl.py <출력 폴더> [종류,종류]  → bx_bowl_<종류>.wav, bx_bowl_<종류>_end.wav
#   FLAC(손실 없음): ffmpeg -i bx_bowl_<종류>.wav -c:a flac -compression_level 12 bx_bowl_<종류>.flac (48kHz 한 채널)
import numpy as np, scipy.io.wavfile as wf, scipy.signal as ss, sys, os
SR = 48000
# 4판: 소리가 0에서 다 커지기까지(초). 대표 지적 11/3 '시작이 너무 갑작스럽다'
SWELL = 2.5
# 끝 종: 오르는 시간 · 전체 길이 · 마지막에 줄이는 시간(초)
END_RISE, END_LEN, END_TAIL = 0.15, 30.0, 10.0

# 종류마다: 바탕 높이(Hz), 배음(비율, 세기, t60초), 맴돌이(빠르기 Hz, 깊이), 길이(초), 친 소리 세기
# 5판: 배음 = (바탕의 몇 배, 세기 dB, 울림 t60초). 실제 볼(CCRMA 21cm 티베트 볼: 1 · 2.96 · 5.41 · 8.75 · 12.56배, −18 · −16 · −16 · −13dB)에 가깝게
KINDS = {
    # 맑은 볼: G3. 위 배음을 고르게(둘째 배음 541Hz가 휴대폰에서 들리는 몸통)
    'clear':   dict(f0=196.0, parts=[(1.0, 0, 64.0), (2.76, -3, 34.0), (5.40, -7, 18.0), (8.90, -11, 9.0), (12.6, -16, 4.5)], beat=1.0, dur=55.0, click=0.6, attack=0.030),
    # 깊은 볼: 낮고 따뜻하게(대표가 편하다고 한 소리). 둘째 배음 398Hz를 살려 휴대폰에서도 들리게
    'deep':    dict(f0=146.8, parts=[(1.0, 0, 72.0), (2.71, -3, 40.0), (5.18, -7, 20.0), (8.43, -11, 10.0), (12.1, -16, 5.0)], beat=0.8, dur=60.0, click=0.8),
    # 크리스탈 볼: C4. 문질러 울리듯 천천히, 배음은 거의 정수배(석영 볼)지만 바탕만 남지 않게
    'crystal': dict(f0=261.6, parts=[(1.0, 0, 76.0), (2.0, -5, 40.0), (3.01, -9, 20.0), (4.03, -14, 9.0)], beat=0.6, dur=60.0, click=0.0, attack=0.080),
    # 작은 종: D4. 조금 짧게, 쇳소리는 부드럽게
    'chime':   dict(f0=293.7, parts=[(1.0, 0, 34.0), (2.0, -5, 18.0), (2.76, -7, 12.0), (5.40, -12, 6.0), (8.90, -17, 3.5)], beat=1.4, dur=40.0, click=0.5, attack=0.030),
}
# 작은 방 울림(1.2초, −18dB): 지수로 줄어드는 잡음 응답
_rng = np.random.default_rng(11)
_ir_t = np.arange(int(SR * 1.2)) / SR
IR = _rng.standard_normal(len(_ir_t)) * np.exp(-6.9 * _ir_t / 1.2)
IR = ss.sosfilt(ss.butter(2, [300, 6000], 'bandpass', fs=SR, output='sos'), IR)
IR = IR / np.sqrt((IR ** 2).sum()) * 10 ** (-18 / 20)

def strike(k, dur=None, amp=1.0, seed=1, rise=SWELL, tail_sec=3.0):
    dur = dur or k['dur']
    t = np.arange(int(SR * dur)) / SR
    y = np.zeros_like(t)
    rng = np.random.default_rng(seed)
    det = 1.0 + rng.uniform(-0.002, 0.002)  # 칠 때마다 ±0.2%
    for i, (ratio, db, t60) in enumerate(k['parts']):
        f = k['f0'] * ratio * det
        env = np.exp(-6.9 * t / t60)
        # 배음마다 조금 어긋난 두 소리(0.4~2Hz 차이, 세기 1 : 0.35 → 떨림 약 6dB). 모든 배음에 같이 거는 떨림은 없음
        df = k['beat'] * (0.5 + 0.35 * i) * (0.85 + 0.3 * rng.random())
        pair = np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) + 0.35 * np.sin(2 * np.pi * (f + df) * t + rng.uniform(0, 6.28))
        y += 10 ** (db / 20) * env * pair / 1.35
    # 친 순간: 부드러운 채(5ms 반 사인) + 아주 작은 닿는 소리(−36dB)
    n = int(SR * 0.005)
    y[:n] *= np.sin(0.5 * np.pi * np.arange(n) / n)
    m = int(SR * 0.03)
    noise = ss.sosfilt(ss.butter(2, [800, 5000], 'bandpass', fs=SR, output='sos'), rng.standard_normal(m)) * np.exp(-np.arange(m) / (SR * 0.006))
    y[:m] += noise / (np.abs(noise).max() + 1e-9) * 10 ** (-36 / 20) * k['click']
    # 작은 방 울림
    y = y + ss.fftconvolve(y, IR)[:len(y)]
    attack = np.minimum(1.0, t / k.get('attack', 0.012))
    # 끝은 천천히 닫는다(뚝 끊기지 않게). 끝 종은 10초
    tail = int(SR * tail_sec)
    y[-tail:] *= np.linspace(1.0, 0.0, tail) ** 2
    # 4판: 작게 시작해 천천히 커진다(반 코사인 2.5초)
    env = np.ones_like(t)
    if rise > 0:
        sw = int(SR * rise)
        env[:sw] = 0.5 - 0.5 * np.cos(np.pi * np.arange(sw) / sw)
    return amp * y * attack * env

def norm(y, peak=0.5):
    return y / (np.max(np.abs(y)) + 1e-9) * peak

def a_weight(f):
    # IEC 61672 A 가중(귀에 들리는 세기). 주파수(Hz) → 배율
    f2 = np.maximum(f, 1e-3) ** 2
    ra = (12194.0 ** 2 * f2 ** 2) / ((f2 + 20.6 ** 2) * np.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194.0 ** 2))
    return ra / 0.7943  # 1kHz에서 1

def heard(y, sec=5.0):
    seg = y[:int(SR * sec)]
    sp = np.abs(np.fft.rfft(seg)) ** 2
    f = np.fft.rfftfreq(len(seg), 1 / SR)
    return np.sqrt((sp * a_weight(f) ** 2).sum())

def write(path, y):
    # 16bit로 줄일 때 TPDF 디더(±1 LSB 삼각 잡음)
    d = (np.random.default_rng(5).random(len(y)) - np.random.default_rng(6).random(len(y)))
    wf.write(path, SR, np.clip(np.round(y * 32767 + d), -32768, 32767).astype(np.int16))

out = sys.argv[1] if len(sys.argv) > 1 else '.'
only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
os.makedirs(out, exist_ok=True)
# 세기(배율)는 부풀기 전(3판) 소리로 정한다. 부푼 소리로 다시 재면 처음 큰 순간이 없어져 몸통이 5~8dB 커졌다(4판에서 확인)
ref = heard(norm(strike(KINDS['deep'], seed=1, rise=0)))
for name, k in KINDS.items():
    if only and name not in only:
        continue
    base = strike(k, seed=1, rise=0)
    f1 = 0.5 / (np.max(np.abs(base)) + 1e-9)
    # 높은 소리가 더 크게 들리는 만큼을 반쯤 줄인다(A 가중은 작은 소리 기준이라 다 맞추면 알람 크기에서 너무 작게 들림)
    gain = 1.0 if name == 'deep' else min(1.0, ref / (heard(base * f1) + 1e-9)) ** 0.5
    write(os.path.join(out, 'bx_bowl_%s.wav' % name), strike(k, seed=1) * f1 * gain)
    gap = 4.0
    total = END_LEN
    three = np.zeros(int(SR * total))
    three0 = np.zeros(int(SR * total))
    for i in range(3):
        at = int(SR * gap * i)
        for arr, r in ((three, END_RISE), (three0, 0)):
            s3 = strike(k, dur=total - gap * i, amp=1.0 - 0.1 * i, seed=3 + i, rise=r, tail_sec=END_TAIL)
            arr[at:at + len(s3)] += s3[:len(arr) - at]
    f3 = 0.5 / (np.max(np.abs(three0)) + 1e-9)
    write(os.path.join(out, 'bx_bowl_%s_end.wav' % name), three * f3 * gain)
    print(name, 'gain %.2f' % gain)
print('ok')
