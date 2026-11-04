package kr.boxworks.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageDecoder;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.webkit.MimeTypeMap;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.PickVisualMediaRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 일정 첨부(시험판 42, 대표 요청 11/3 18:15 · 정할 것 17번). 웹에서는 Capacitor.Plugins.BxAttach.
 * 권한을 하나도 받지 않는다: 사진은 휴대폰 사진 선택기, 찍기는 휴대폰 카메라 앱, 파일은 휴대폰 파일 창.
 * 고른 것은 곧바로 앱 안(files/attach)으로 복사한다. 고른 주소는 휴대폰을 다시 켜면 못 쓰게 되기 때문이다.
 * 사진은 긴 변 2048px JPEG로 줄이고(고효율 HEIC도 JPEG로, 앱 화면이 HEIC를 못 보여 줌), 목록용 작은 그림을 따로 만든다.
 * 원본은 휴대폰 갤러리에 그대로 둔다(대표 기본값 11/3). 앱을 지우면 같이 지워지고, 백업 파일(zip)에는 들어간다.
 * 클라우드 자동 백업에서는 이 폴더를 뺀다(res/xml/bx_data_extraction.xml: 25MB를 넘으면 앱 전체 백업이 멈춤).
 */
@CapacitorPlugin(name = "BxAttach")
public class BxAttachPlugin extends Plugin {
    static final String DIR = "attach";
    static final int MAX_EDGE = 2048, THUMB_EDGE = 360, JPEG_Q = 82, THUMB_Q = 72, MAX_PICK = 10;
    static final long MAX_FILE = 20L * 1024 * 1024;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private File pendingShot = null;

    private File dir() {
        File d = new File(getContext().getFilesDir(), DIR);
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private String authority() {
        return getContext().getPackageName() + ".fileprovider";
    }

    /** 'attach/…' 안의 파일만(다른 곳은 열지도 지우지도 않음) */
    private File safeFile(String rel) {
        if (rel == null || !rel.startsWith(DIR + "/") || rel.contains("..")) return null;
        try {
            File f = new File(getContext().getFilesDir(), rel);
            String root = dir().getCanonicalPath() + File.separator;
            return f.getCanonicalPath().startsWith(root) ? f : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String newId() {
        return "a" + Long.toString(System.currentTimeMillis(), 36) + Integer.toString((int) (Math.random() * 46655), 36);
    }

    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("base", getContext().getFilesDir().getAbsolutePath());
        r.put("max", MAX_PICK);
        r.put("maxFile", MAX_FILE);
        call.resolve(r);
    }

    /* ---------- 사진 고르기: 휴대폰 사진 선택기(권한 없음, 없는 휴대폰은 파일 창으로) ---------- */
    @PluginMethod
    public void pickImages(PluginCall call) {
        int max = Math.max(1, Math.min(MAX_PICK, call.getInt("max", MAX_PICK)));
        Intent i;
        try {
            PickVisualMediaRequest req = new PickVisualMediaRequest.Builder()
                .setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly.INSTANCE)
                .build();
            i = max > 1 ? new ActivityResultContracts.PickMultipleVisualMedia(max).createIntent(getContext(), req)
                : new ActivityResultContracts.PickVisualMedia().createIntent(getContext(), req);
        } catch (Exception e) {
            i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("image/*");
            i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, max > 1);
        }
        try {
            startActivityForResult(call, i, "imagesResult");
        } catch (ActivityNotFoundException e) {
            call.reject("사진을 고르는 창을 열지 못했어요", "unavailable");
        }
    }

    @ActivityCallback
    private void imagesResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        final List<Uri> uris = urisOf(result);
        if (uris.isEmpty()) { resolveFiles(call, new JSArray(), 0, 0); return; }
        io.execute(() -> {
            JSArray out = new JSArray();
            int failed = 0, over = Math.max(0, uris.size() - MAX_PICK);
            for (int k = 0; k < uris.size() && k < MAX_PICK; k++) {
                try { out.put(saveImage(uris.get(k), null)); } catch (Throwable t) { failed++; }
            }
            resolveFiles(call, out, failed, over);
        });
    }

    /* ---------- 사진 찍기: 휴대폰 카메라 앱(카메라 권한을 받지 않음) ---------- */
    @PluginMethod
    public void takePhoto(PluginCall call) {
        try {
            File tmp = new File(getContext().getCacheDir(), "bx_shot_" + System.currentTimeMillis() + ".jpg");
            Uri out = FileProvider.getUriForFile(getContext(), authority(), tmp);
            Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            i.putExtra(MediaStore.EXTRA_OUTPUT, out);
            i.setClipData(ClipData.newRawUri("", out));
            i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            pendingShot = tmp;
            startActivityForResult(call, i, "shotResult");
        } catch (ActivityNotFoundException e) {
            pendingShot = null;
            call.reject("카메라 앱을 찾지 못했어요", "unavailable");
        } catch (Exception e) {
            pendingShot = null;
            call.reject("카메라를 열지 못했어요", "error");
        }
    }

    @ActivityCallback
    private void shotResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        final File tmp = pendingShot;
        pendingShot = null;
        if (result.getResultCode() != Activity.RESULT_OK || tmp == null || !tmp.exists() || tmp.length() == 0) {
            if (tmp != null) tmp.delete();
            resolveFiles(call, new JSArray(), 0, 0);
            return;
        }
        io.execute(() -> {
            JSArray out = new JSArray();
            int failed = 0;
            try {
                out.put(saveImage(Uri.fromFile(tmp), "사진 " + new SimpleDateFormat("M월 d일 a h:mm", Locale.KOREAN).format(new Date()) + ".jpg"));
            } catch (Throwable t) {
                failed = 1;
            } finally {
                tmp.delete();
            }
            resolveFiles(call, out, failed, 0);
        });
    }

    /* ---------- 파일: 휴대폰 파일 창(PDF · 문서 등, 한 개 20MB까지). 사진 파일은 사진처럼 줄인다 ---------- */
    @PluginMethod
    public void pickFiles(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        try {
            startActivityForResult(call, i, "filesResult");
        } catch (ActivityNotFoundException e) {
            call.reject("파일을 고르는 창을 열지 못했어요", "unavailable");
        }
    }

    @ActivityCallback
    private void filesResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        final List<Uri> uris = urisOf(result);
        if (uris.isEmpty()) { resolveFiles(call, new JSArray(), 0, 0); return; }
        io.execute(() -> {
            JSArray out = new JSArray();
            int failed = 0, big = 0, over = Math.max(0, uris.size() - MAX_PICK);
            ContentResolver cr = getContext().getContentResolver();
            for (int k = 0; k < uris.size() && k < MAX_PICK; k++) {
                Uri u = uris.get(k);
                try {
                    String mime = cr.getType(u);
                    String name = displayName(u, null);
                    long size = sizeOf(u);
                    if (mime != null && mime.startsWith("image/") && !mime.equals("image/gif") && !mime.equals("image/svg+xml")) {
                        out.put(saveImage(u, name));
                        continue;
                    }
                    if (size > MAX_FILE) { big++; continue; }
                    out.put(saveFile(u, name, mime));
                } catch (TooBig t) {
                    big++;
                } catch (Throwable t) {
                    failed++;
                }
            }
            JSObject r = new JSObject();
            r.put("files", out);
            r.put("failed", failed);
            r.put("big", big);
            r.put("over", over);
            call.resolve(r);
        });
    }

    private void resolveFiles(PluginCall call, JSArray files, int failed, int over) {
        JSObject r = new JSObject();
        r.put("files", files);
        r.put("failed", failed);
        r.put("big", 0);
        r.put("over", over);
        call.resolve(r);
    }

    private static List<Uri> urisOf(ActivityResult result) {
        List<Uri> list = new ArrayList<>();
        if (result == null || result.getResultCode() != Activity.RESULT_OK || result.getData() == null) return list;
        Intent d = result.getData();
        ClipData cd = d.getClipData();
        if (cd != null) {
            for (int i = 0; i < cd.getItemCount(); i++) {
                Uri u = cd.getItemAt(i).getUri();
                if (u != null) list.add(u);
            }
        }
        if (list.isEmpty() && d.getData() != null) list.add(d.getData());
        return list;
    }

    private String displayName(Uri u, String fallback) {
        try (Cursor c = getContext().getContentResolver().query(u, new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                String n = c.getString(0);
                if (n != null && !n.trim().isEmpty()) return n.trim();
            }
        } catch (Exception ignored) {
        }
        if (fallback != null) return fallback;
        String p = u.getLastPathSegment();
        return p == null ? "파일" : p;
    }

    private long sizeOf(Uri u) {
        try (Cursor c = getContext().getContentResolver().query(u, new String[] {OpenableColumns.SIZE}, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getLong(0);
        } catch (Exception ignored) {
        }
        return -1;
    }

    private static class TooBig extends Exception {
    }

    private JSObject saveFile(Uri src, String name, String mime) throws Exception {
        String ext = "";
        int dot = name == null ? -1 : name.lastIndexOf('.');
        if (dot > 0 && dot < name.length() - 1) ext = name.substring(dot + 1).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        if (ext.isEmpty() && mime != null) {
            String e = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);
            if (e != null) ext = e;
        }
        if (ext.length() > 8) ext = ext.substring(0, 8);
        String id = newId();
        File f = new File(dir(), id + (ext.isEmpty() ? "" : "." + ext));
        long n = 0;
        try (InputStream in = getContext().getContentResolver().openInputStream(src); OutputStream out = new FileOutputStream(f)) {
            if (in == null) throw new Exception("no stream");
            byte[] buf = new byte[64 * 1024];
            int r;
            while ((r = in.read(buf)) > 0) {
                n += r;
                if (n > MAX_FILE) throw new TooBig();
                out.write(buf, 0, r);
            }
        } catch (Exception e) {
            f.delete();
            throw e;
        }
        if (mime == null && !ext.isEmpty()) mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        JSObject o = new JSObject();
        o.put("id", id);
        o.put("kind", "file");
        o.put("path", DIR + "/" + f.getName());
        o.put("name", name == null ? f.getName() : name);
        o.put("mime", mime == null ? "application/octet-stream" : mime);
        o.put("size", f.length());
        return o;
    }

    private JSObject saveImage(Uri src, String name) throws Exception {
        Bitmap bm = decode(src, MAX_EDGE);
        if (bm == null) throw new Exception("decode");
        String id = newId();
        File f = new File(dir(), id + ".jpg"), t = new File(dir(), id + "_t.jpg");
        try {
            writeJpeg(bm, f, JPEG_Q);
            Bitmap tb = scale(bm, THUMB_EDGE);
            writeJpeg(tb, t, THUMB_Q);
            if (tb != bm) tb.recycle();
        } catch (Exception e) {
            f.delete();
            t.delete();
            throw e;
        }
        JSObject o = new JSObject();
        o.put("id", id);
        o.put("kind", "img");
        o.put("path", DIR + "/" + f.getName());
        o.put("thumb", DIR + "/" + t.getName());
        String n = name != null ? name : displayName(src, "사진.jpg");
        // 이름 끝이 .heic · .png여도 저장한 것은 JPEG
        o.put("name", n.replaceAll("(?i)\\.(heic|heif|png|webp|bmp)$", ".jpg"));
        o.put("mime", "image/jpeg");
        o.put("size", f.length());
        o.put("w", bm.getWidth());
        o.put("h", bm.getHeight());
        bm.recycle();
        return o;
    }

    /** 긴 변을 maxEdge 이하로 줄여 읽는다. 사진의 회전 정보(EXIF)를 반영한다 */
    private Bitmap decode(Uri src, final int maxEdge) throws Exception {
        if (Build.VERSION.SDK_INT >= 28) {
            ImageDecoder.Source s = "file".equals(src.getScheme()) && src.getPath() != null
                ? ImageDecoder.createSource(new File(src.getPath()))
                : ImageDecoder.createSource(getContext().getContentResolver(), src);
            return ImageDecoder.decodeBitmap(s, (decoder, info, source) -> {
                int w = info.getSize().getWidth(), h = info.getSize().getHeight(), m = Math.max(w, h);
                if (m > maxEdge) {
                    float k = maxEdge / (float) m;
                    decoder.setTargetSize(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
                }
                decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);
            });
        }
        ContentResolver cr = getContext().getContentResolver();
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        try (InputStream in = cr.openInputStream(src)) { BitmapFactory.decodeStream(in, null, o); }
        int m = Math.max(o.outWidth, o.outHeight), sample = 1;
        while (m / (sample * 2) >= maxEdge) sample *= 2;
        BitmapFactory.Options o2 = new BitmapFactory.Options();
        o2.inSampleSize = sample;
        Bitmap bm;
        try (InputStream in = cr.openInputStream(src)) { bm = BitmapFactory.decodeStream(in, null, o2); }
        if (bm == null) return null;
        bm = scale(bm, maxEdge);
        int rot = 0;
        try (InputStream in = cr.openInputStream(src)) {
            if (in != null) {
                int or = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                rot = or == ExifInterface.ORIENTATION_ROTATE_90 ? 90 : or == ExifInterface.ORIENTATION_ROTATE_180 ? 180 : or == ExifInterface.ORIENTATION_ROTATE_270 ? 270 : 0;
            }
        } catch (Exception ignored) {
        }
        if (rot != 0) {
            Matrix mx = new Matrix();
            mx.postRotate(rot);
            Bitmap r = Bitmap.createBitmap(bm, 0, 0, bm.getWidth(), bm.getHeight(), mx, true);
            if (r != bm) bm.recycle();
            bm = r;
        }
        return bm;
    }

    private static Bitmap scale(Bitmap bm, int maxEdge) {
        int w = bm.getWidth(), h = bm.getHeight(), m = Math.max(w, h);
        if (m <= maxEdge) return bm;
        float k = maxEdge / (float) m;
        return Bitmap.createScaledBitmap(bm, Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)), true);
    }

    private static void writeJpeg(Bitmap bm, File f, int q) throws Exception {
        try (OutputStream out = new BufferedOutputStream(new FileOutputStream(f))) {
            if (!bm.compress(Bitmap.CompressFormat.JPEG, q, out)) throw new Exception("compress");
        }
    }

    /* ---------- 열기: 사진은 앱 안 보기 화면(웹), 그 밖의 파일과 '다른 앱으로 열기'는 휴대폰 앱으로 ---------- */
    @PluginMethod
    public void open(PluginCall call) {
        File f = safeFile(call.getString("path"));
        if (f == null || !f.exists()) {
            call.reject("이 휴대폰에 파일이 없어요", "missing");
            return;
        }
        try {
            Uri u = FileProvider.getUriForFile(getContext(), authority(), f);
            Intent v = new Intent(Intent.ACTION_VIEW);
            v.setDataAndType(u, call.getString("mime", "*/*"));
            v.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent ch = Intent.createChooser(v, call.getString("title", "열 앱 고르기"));
            ch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(ch);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("이 파일을 열 수 있는 앱이 없어요", "no_app");
        } catch (Exception e) {
            call.reject("파일을 열지 못했어요", "error");
        }
    }

    /* ---------- 정리: 어느 일정에도 붙어 있지 않은 파일(웹이 골라 넘김)을 지운다 ---------- */
    @PluginMethod
    public void list(PluginCall call) {
        JSArray a = new JSArray();
        File[] fs = dir().listFiles();
        if (fs != null) {
            for (File f : fs) {
                if (!f.isFile()) continue;
                JSObject o = new JSObject();
                o.put("path", DIR + "/" + f.getName());
                o.put("size", f.length());
                o.put("mtime", f.lastModified());
                a.put(o);
            }
        }
        JSObject r = new JSObject();
        r.put("files", a);
        call.resolve(r);
    }

    @PluginMethod
    public void remove(PluginCall call) {
        JSArray paths = call.getArray("paths", new JSArray());
        int n = 0;
        for (int i = 0; i < paths.length(); i++) {
            File f = safeFile(paths.optString(i, null));
            if (f != null && f.exists() && f.delete()) n++;
        }
        JSObject r = new JSObject();
        r.put("removed", n);
        call.resolve(r);
    }

    /* ---------- 백업 파일(zip): boxworks.json + attach/… (압축하지 않고 담음, 사진은 이미 JPEG) ---------- */
    @PluginMethod
    public void zip(PluginCall call) {
        final String json = call.getString("json", "");
        final JSArray files = call.getArray("files", new JSArray());
        final String name = call.getString("name", "backup.zip").replaceAll("[\\\\/:*?\"<>|]", "_");
        io.execute(() -> {
            File out = new File(getContext().getCacheDir(), name);
            int n = 0;
            try (ZipOutputStream z = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(out)))) {
                putStored(z, "boxworks.json", json.getBytes(StandardCharsets.UTF_8));
                for (int i = 0; i < files.length(); i++) {
                    String rel = files.optString(i, null);
                    File f = safeFile(rel);
                    if (f == null || !f.exists()) continue;
                    putStored(z, rel, readAll(f));
                    n++;
                }
            } catch (Exception e) {
                out.delete();
                call.reject("백업 파일을 만들지 못했어요", "error");
                return;
            }
            JSObject r = new JSObject();
            r.put("uri", Uri.fromFile(out).toString());
            r.put("path", out.getAbsolutePath());
            r.put("size", out.length());
            r.put("files", n);
            call.resolve(r);
        });
    }

    private static void putStored(ZipOutputStream z, String name, byte[] b) throws Exception {
        ZipEntry e = new ZipEntry(name);
        e.setMethod(ZipEntry.STORED);
        e.setSize(b.length);
        e.setCompressedSize(b.length);
        CRC32 c = new CRC32();
        c.update(b);
        e.setCrc(c.getValue());
        z.putNextEntry(e);
        z.write(b);
        z.closeEntry();
    }

    private static byte[] readAll(File f) throws Exception {
        try (InputStream in = new FileInputStream(f); ByteArrayOutputStream out = new ByteArrayOutputStream((int) Math.max(32, f.length()))) {
            byte[] buf = new byte[64 * 1024];
            int r;
            while ((r = in.read(buf)) > 0) out.write(buf, 0, r);
            return out.toByteArray();
        }
    }
}
