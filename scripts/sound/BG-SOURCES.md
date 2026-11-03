# 배경 소리 출처와 저작권 확인 (시험판 33)

명상·공부 배경 소리 네 가지는 모두 **CC0 1.0**(공개 녹음) 녹음이다. CC0는 상업용을 포함해 복사·수정·배포를 자유롭게 허락하고, 출처를 밝히지 않아도 된다. 그래도 앱의 명상 › 소리와 호흡 맨 아래에 "BigSoundBank · Freesound의 공개 녹음(CC0)"이라고 한 줄 적어 두었다. 백색소음은 녹음이 아니다. 휴대폰이 그때그때 만든다(`BgPlayer`).

확인한 날은 2026-11-03이다. 라이선스는 각 녹음의 원래 페이지에서 읽었다. 녹음을 받아 온 저장소의 코드 라이선스는 근거로 삼지 않았다.

| 앱 이름 | 녹음(원래 페이지) | 만든 사람 | 원래 페이지 표시 | 앱 파일 |
|---|---|---|---|---|
| 파도 | [Small waves and beach #1](https://bigsoundbank.com/small-waves-and-beach-1-s1446.html) (BigSoundBank #1446) | Joseph SARDIN | "CC0 (public domain): Free and royalty-free" | `bx_bg_waves.ogg` |
| 숲속 새소리 | [Bird ambience. Coniferous forest dawn chorus.](https://freesound.org/people/SamsterBirdies/sounds/745273/) (Freesound 745273) | SamsterBirdies | "Creative Commons 0" | `bx_bg_birds.ogg` |
| 바람 | [young trees creaking in the wind](https://freesound.org/people/Garuda1982/sounds/624737/) (Freesound 624737) | Garuda1982 | "Creative Commons 0" (아래 주의) | `bx_bg_wind.ogg` |
| 갈대 | [Dry grass rustling in the wind, in the desert of Chile.](https://freesound.org/people/felix.blume/sounds/146436/) (Freesound 146436) | felix.blume | "Creative Commons 0" | `bx_bg_reeds.ogg` |

- **바람 주의.** 11/3에 녹음을 찾은 조사에서는 이 Freesound 페이지에서 "Creative Commons 0"을 읽었다. 하지만 같은 날 다시 확인하려고 열었을 때는 사이트 오류로 열리지 않았다. 이 녹음을 쓰는 longquiet 저장소의 기록도 CC0 1.0이다([sounds.json](https://github.com/CameronBrooks11/longquiet/blob/6412768d501e91d5eb8936a973235e776e3382cd/sounds/sounds.json)). 출시 전에 페이지를 한 번 더 열어 확인한다.
- **갈대.** 60초가 넘고, 잘리지 않고, 쓸 수 있는 라이선스인 갈대 녹음은 찾지 못했다(찾은 두 개는 26초에 소리가 깨지거나, 1분이 안 되는 가공본뿐이었다). 그래서 가장 비슷한 "마른 풀이 바람에 스치는 소리"를 갈대 자리에 넣었다. 대표가 들어 보고 이름을 정한다.

## 받아 온 파일(손실 압축본)

원본(WAV·FLAC)은 BigSoundBank와 Freesound에 있다. 이 작업 환경에서는 그 사이트에서 직접 받을 수 없어서, 같은 녹음을 담아 둔 공개 저장소의 손실 압축본(MP3·OGG)을 받았다. 녹음 길이가 원래 페이지에 적힌 길이와 맞는지 확인했다(새소리 9:49.097, 바람 6:40.029, 갈대 3:00.052. 파도는 원본 4:10에서 잘라 4분으로 이어 붙인 파일이다).

| 앱 이름 | 받은 곳(커밋 고정) | sha256 |
|---|---|---|
| 파도 | [mik2288mik-dev/ASTROT-NEW `public/audio/library/sea-calm-hq-v2.mp3`](https://github.com/mik2288mik-dev/ASTROT-NEW/blob/20ccac9ca530967e3c2d0d52061c70178af1d843/public/audio/library/sea-calm-hq-v2.mp3) | `3c1a6051b5c10b1df608d7b160e9385a51a9badbb08ea65fa8c7498008d1f9e6` |
| 숲속 새소리 | [CameronBrooks11/longquiet 릴리스 `audio-2026.10.15/dawn.mp3`](https://github.com/CameronBrooks11/longquiet/releases/download/audio-2026.10.15/dawn.mp3) | `33c18b00b2980a072c14daecffc875baa6ace2346a3c9f830003df1eb1586e0e` |
| 바람 | [CameronBrooks11/longquiet 릴리스 `audio-2026.10.15/wind.mp3`](https://github.com/CameronBrooks11/longquiet/releases/download/audio-2026.10.15/wind.mp3) | `da6ba4e941385f9e1ce70a7690f85512f5db281cc8526d1521ec742597bf4e8b` |
| 갈대 | [deranjer/spall `examples/sandbox/assets/audio/biomes/dry-grass-wind.ogg`](https://github.com/deranjer/spall/blob/6ac3728df2e5a04a292ae488143860fe3bab130f/examples/sandbox/assets/audio/biomes/dry-grass-wind.ogg) | `80bfbb90a7845994d4005ec679dd275ff5ca2a4eceeb69e6716ddac6c909d9d9` |

longquiet 릴리스 파일은 그 저장소의 `sounds/sounds.json`(커밋 `6412768`)에 적힌 sha256과 맞는다.

## 만드는 방법(make-bg.py)

1. 48kHz 두 채널로 풀고(soxr), 마이크에 바람이 닿아 생긴 낮은 웅웅거림을 거른다.
   - 새소리: 100Hz 아래를 거른다.
   - 바람: 200Hz 아래를 덜고 1kHz 위를 6dB 올린다. 원래는 거의 다 300Hz 아래라 휴대폰 스피커에서 7dB쯤 작게 들렸는데, 3dB로 줄었다.
   - 갈대: 280Hz 아래를 4차로 거르고, 2.5kHz 위를 5dB 올린다.
2. 소리가 고른 구간을 자른다. 끝 다음 3초를 처음 3초에 같은 힘으로 섞어서, 끝에서 처음으로 끊김 없이 넘어간다.
   - 파도: 72–192초(120초)
   - 새소리: 353–473초(120초)
   - 바람: 11–131초(120초). 170–205초의 나무 삐걱 소리와 돌풍은 피했다.
   - 갈대: 40–130초(90초)
3. 세기를 맞춘다.
   - 파도·갈대: −22 LUFS
   - 바람: −21 LUFS(스피커에서 작게 들려서)
   - 새소리: −24 LUFS(짧게 튀는 소리가 있어서)
   - 백색소음: −25 LUFS(오래 들으면 피곤해서). 휴대폰 쪽 `BgPlayer.NOISE_GAIN = 0.0676`
4. OGG Vorbis(q3)로 저장한다. 다시 풀어 확인한 결과는 다음과 같다.
   - 길이는 표본 하나까지 정확하다.
   - 이음새에서 튀는 정도는 보통 표본 사이 차이보다 작다.
   - 웅·삐 하는 한 높이 소리는 없다. 새소리의 3kHz 하나는 새 울음이다.
   - 네 파일을 합쳐 5.9MB다.

사람 귀로 듣고 확인하지는 않았다. 대표가 휴대폰에서 들어 보고 정한다. 출시 전에는 같은 CC0 원본(무손실)을 받아 같은 방법으로 다시 만들면 손실 압축을 두 번 거치지 않는다.
