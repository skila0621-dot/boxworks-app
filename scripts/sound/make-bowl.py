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
# 쓰는 법: python3 make-bowl.py <출력 폴더> [종류,종류]  → bx_bowl_<종류>.wav, bx_bowl_<종류>_end.wav
#   OGG: ffmpeg -i bx_bowl_<종류>.wav -c:a libvorbis -q:a 2 bx_bowl_<종류>.ogg (44.1kHz 한 채널)
import numpy as np, scipy.io.wavfile as wf, sys, os
SR = 44100
# 4판: 소리가 0에서 다 커지기까지(초). 대표 지적 11/3 '시작이 너무 갑작스럽다'
SWELL = 2.5
# 끝 종: 오르는 시간 · 전체 길이 · 마지막에 줄이는 시간(초)
END_RISE, END_LEN, END_TAIL = 0.15, 30.0, 10.0

# 종류마다: 바탕 높이(Hz), 배음(비율, 세기, t60초), 맴돌이(빠르기 Hz, 깊이), 길이(초), 친 소리 세기
KINDS = {
    # 맑은 볼(3판): 깊은 볼과 크리스탈 볼 사이 높이(G3). 배음은 둘만 남기고 일찍 줄인다
    'clear':   dict(f0=196.0, parts=[(1.0, 1.0, 64.0), (2.76, 0.24, 26.0), (5.40, 0.04, 9.0)], beat=(0.62, 0.18), dur=55.0, click=0.015, attack=0.030),
    # 깊은 볼: 낮고 따뜻하게, 맴돌이가 조금 더 깊다(2판 그대로, 대표가 편하다고 한 소리)
    'deep':    dict(f0=146.8, parts=[(1.0, 1.0, 72.0), (2.71, 0.45, 38.0), (5.18, 0.16, 16.0), (8.43, 0.05, 7.0)], beat=(0.48, 0.26), dur=60.0, click=0.035),
    # 크리스탈 볼(3판): 거의 순한 음 하나(C4, 2판보다 한 옥타브 아래)가 아주 길게, 문질러 울리듯 천천히 부푼다
    'crystal': dict(f0=261.6, parts=[(1.0, 1.0, 76.0), (2.0, 0.03, 20.0), (3.0, 0.008, 8.0)], beat=(0.30, 0.08), dur=60.0, click=0.0, attack=0.080),
    # 작은 종(3판): 볼보다 조금 높지만(D4) 또렷한 쇳소리는 줄였다. 조금 짧게
    'chime':   dict(f0=293.7, parts=[(1.0, 1.0, 34.0), (2.0, 0.10, 12.0), (2.76, 0.05, 6.0)], beat=(0.9, 0.12), dur=40.0, click=0.01, attack=0.030),
}

def strike(k, dur=None, amp=1.0, seed=1, rise=SWELL, tail_sec=3.0):
    dur = dur or k['dur']
    t = np.arange(int(SR * dur)) / SR
    y = np.zeros_like(t)
    rate, depth = k['beat']
    for i, (ratio, a, t60) in enumerate(k['parts']):
        f = k['f0'] * ratio
        env = np.exp(-6.9 * t / t60)
        # 아주 조금 어긋난 두 소리를 겹쳐 '웅—' 하고 맴도는 떨림. 깊이는 종류마다
        pair = 0.62 * np.sin(2 * np.pi * f * t) + 0.38 * np.sin(2 * np.pi * f * (1.0 + 0.0012 / (1 + i)) * t + 0.7 * i)
        mod = 1.0 - depth + depth * (0.5 + 0.5 * np.cos(2 * np.pi * rate * (1 + 0.18 * i) * t))
        y += a * env * pair * mod
    # 친 순간: 아주 짧고 부드러운 '톡'(잡음을 걸러 둥글게)
    rng = np.random.default_rng(seed)
    n = int(SR * 0.02)
    click = rng.standard_normal(n)
    click = np.convolve(click, np.ones(24) / 24, mode='same') * np.exp(-np.arange(n) / (SR * 0.004)) * k['click'] * 6
    y[:n] += click
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

def norm(y, peak=0.78):
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
    wf.write(path, SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))

out = sys.argv[1] if len(sys.argv) > 1 else '.'
only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
os.makedirs(out, exist_ok=True)
# 세기(배율)는 부풀기 전(3판) 소리로 정한다. 부푼 소리로 다시 재면 처음 큰 순간이 없어져 몸통이 5~8dB 커졌다(4판에서 확인)
ref = heard(norm(strike(KINDS['deep'], seed=1, rise=0)))
for name, k in KINDS.items():
    if only and name not in only:
        continue
    base = strike(k, seed=1, rise=0)
    f1 = 0.78 / (np.max(np.abs(base)) + 1e-9)
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
    f3 = 0.78 / (np.max(np.abs(three0)) + 1e-9)
    write(os.path.join(out, 'bx_bowl_%s_end.wav' % name), three * f3 * gain)
    print(name, 'gain %.2f' % gain)
print('ok')
