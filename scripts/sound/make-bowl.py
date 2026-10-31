# 싱잉볼 소리 합성(박스웍스 명상·싱잉볼 루틴). 우리가 직접 만든 소리라 저작권 걱정이 없다.
# 2판(2026-10-31, 대표 지적 "울림이 너무 짧고 한 번 울린 뒤 비어 버린다, 더 맑고 긴 소리, 종류 여러 가지"):
#  - 네 가지: clear 맑은 볼, deep 깊은 볼, crystal 크리스탈 볼, chime 작은 종
#  - 울림을 40~60초로 길게(바탕음 t60 36~76초). 높은 배음은 빨리 줄여 맑게, 친 순간 잡음은 줄임
#  - 한 번 치기(시작·중간 종) + 세 번 치기(끝, 4초 간격)
# 쓰는 법: python3 make-bowl.py <출력 폴더>  → bx_bowl_<종류>.wav, bx_bowl_<종류>_end.wav
import numpy as np, scipy.io.wavfile as wf, sys, os
SR = 44100

# 종류마다: 바탕 높이(Hz), 배음(비율, 세기, t60초), 맴돌이(빠르기 Hz, 깊이), 길이(초), 친 소리 세기
KINDS = {
    # 맑은 볼: 중간 높이, 배음은 적당히, 맴돌이 부드럽게
    'clear':   dict(f0=330.0, parts=[(1.0, 1.0, 62.0), (2.76, 0.30, 30.0), (5.40, 0.08, 12.0), (8.93, 0.025, 5.0)], beat=(0.75, 0.16), dur=55.0, click=0.03),
    # 깊은 볼: 낮고 따뜻하게, 맴돌이가 조금 더 깊다
    'deep':    dict(f0=146.8, parts=[(1.0, 1.0, 72.0), (2.71, 0.45, 38.0), (5.18, 0.16, 16.0), (8.43, 0.05, 7.0)], beat=(0.48, 0.26), dur=60.0, click=0.035),
    # 크리스탈 볼: 거의 순한 음 하나가 아주 길게, 맴돌이는 아주 얕게
    'crystal': dict(f0=523.3, parts=[(1.0, 1.0, 76.0), (2.0, 0.05, 22.0), (3.0, 0.015, 9.0)], beat=(0.32, 0.07), dur=60.0, click=0.012),
    # 작은 종: 높고 또렷하게, 조금 짧게
    'chime':   dict(f0=880.0, parts=[(1.0, 1.0, 36.0), (2.0, 0.20, 16.0), (2.76, 0.14, 9.0), (5.40, 0.04, 3.0)], beat=(1.1, 0.12), dur=40.0, click=0.02),
}

def strike(k, dur=None, amp=1.0, seed=1):
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
    attack = np.minimum(1.0, t / 0.012)
    # 끝 3초는 천천히 닫는다(뚝 끊기지 않게)
    tail = int(SR * 3.0)
    y[-tail:] *= np.linspace(1.0, 0.0, tail) ** 2
    return amp * y * attack

def norm(y, peak=0.78):
    return y / (np.max(np.abs(y)) + 1e-9) * peak

def write(path, y):
    wf.write(path, SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))

out = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out, exist_ok=True)
for name, k in KINDS.items():
    one = norm(strike(k, seed=1))
    write(os.path.join(out, 'bx_bowl_%s.wav' % name), one)
    gap = 4.0
    total = k['dur'] + 2 * gap
    three = np.zeros(int(SR * total))
    for i in range(3):
        at = int(SR * gap * i)
        s = strike(k, dur=total - gap * i, amp=1.0 - 0.1 * i, seed=3 + i)
        three[at:at + len(s)] += s[:len(three) - at]
    write(os.path.join(out, 'bx_bowl_%s_end.wav' % name), norm(three))
print('ok')
