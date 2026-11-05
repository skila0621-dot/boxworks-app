package kr.boxworks.b;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import org.json.JSONObject;

/**
 * 투명 화면: 알림의 '늦는다고 알리기'를 누르면 여기서 공유 창을 연다(뒤에서는 화면을 열 수 없는 제한 때문, SPEC 4절).
 * 늦는 분과 글은 누른 지금 기준으로 계산하고 log late(n)를 남긴다. 받는 사람은 사용자가 고른다.
 */
public class BShareActivity extends Activity {
    @Override
    @SuppressWarnings("deprecation")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent i = getIntent();
        String key = i == null ? null : i.getStringExtra(BNotify.EXTRA_KEY);
        String kind = i == null ? null : i.getStringExtra(BNotify.EXTRA_KIND);
        String snapJson = i == null ? null : i.getStringExtra(BNotify.EXTRA_SNAP);
        if (key != null && !key.isEmpty()) {
            JSONObject snap = snapJson == null ? null : BJson.parseObj(snapJson);
            BActions.lateShare(this, key, kind, snap);
        }
        finish();
        overridePendingTransition(0, 0);
    }
}
