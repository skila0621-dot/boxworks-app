# 싱잉볼 소리 합성(박스웍스 명상). 실제 싱잉볼처럼 배음이 정수배가 아니고(1 : 2.71 : 5.18 : 8.43),
# 두 갈래로 아주 조금 어긋난 소리가 겹쳐 '웅웅' 맴도는 떨림이 생긴다. 친 순간의 짧은 '톡' 소리를 더한다.
import numpy as np, scipy.io.wavfile as wf, sys
SR = 44100
def strike(f0=220.0, dur=12.0, amp=1.0, bright=1.0, seed=1):
    t = np.arange(int(SR * dur)) / SR
    parts = [(1.0, 1.0, 22.0), (2.71, 0.5 * bright, 12.0), (5.18, 0.22 * bright, 6.0), (8.43, 0.09 * bright, 3.0)]
    y = np.zeros_like(t)
    for ratio, a, t60 in parts:
        f = f0 * ratio
        env = np.exp(-6.9 * t / t60)
        beat = 0.5 + 0.5 * np.cos(2 * np.pi * (0.9 + ratio * 0.15) * t)  # 맴도는 떨림
        y += a * env * (0.6 * np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.0035 * t + 1.1)) * (0.75 + 0.25 * beat)
    rng = np.random.default_rng(seed)
    click = rng.standard_normal(int(SR * 0.012)) * np.exp(-np.arange(int(SR * 0.012)) / (SR * 0.002)) * 0.08
    y[:len(click)] += click
    attack = np.minimum(1.0, t / 0.006)
    return amp * y * attack
def out(name, y):
    fade = int(SR * 2.5); y[-fade:] *= np.linspace(1, 0, fade)
    y = y / np.max(np.abs(y)) * 0.7
    wf.write(name + '.wav', SR, (y * 32767).astype(np.int16))
one = strike(); out('bx_bowl', one)                                  # 시작
soft = strike(f0=262.0, dur=8.0, bright=0.6, seed=2) * 0.7; out('bx_bowl_soft', soft)   # 중간 종(가볍게)
three = np.zeros(int(SR * 14.0))                                    # 끝: 세 번
for i, at in enumerate([0.0, 2.4, 4.8]):
    s = strike(dur=14.0 - at, amp=1.0 - i * 0.12, seed=3 + i); a = int(SR * at); three[a:a + len(s)] += s[:len(three) - a]
out('bx_bowl3', three)
print('ok')
