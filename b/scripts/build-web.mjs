// web/ 를 앱용 www/ 로 옮긴다(덧칠 없이 그대로 복사). Capacitor가 www/ 를 휴대폰 앱에 넣는다
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(join(root, 'www'), { recursive: true, force: true });
mkdirSync(join(root, 'www'), { recursive: true });
cpSync(join(root, 'web'), join(root, 'www'), { recursive: true });
console.log('www 준비됨');
