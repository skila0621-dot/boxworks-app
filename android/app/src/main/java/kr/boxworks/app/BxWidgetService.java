package kr.boxworks.app;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

/**
 * '오늘 일정' 위젯의 목록(시험판 36, 대표 요청 11/3 "일정이 많아지는 경우도 있다"): 그날 일정을 위아래로 밀어 끝까지 본다.
 * 줄은 BxWidgetProvider.rows/row로 만들고, 위젯마다 보는 날(‹ ›)과 앱의 '루틴 포함 / 일정만'을 따른다.
 */
public class BxWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        int id = intent == null ? AppWidgetManager.INVALID_APPWIDGET_ID
            : intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        return new Rows(getApplicationContext(), id);
    }

    static class Rows implements RemoteViewsService.RemoteViewsFactory {
        private final Context c;
        private final int id;
        private List<JSONObject> rows = new ArrayList<>();
        private int[] marks = new int[0];
        private long now = System.currentTimeMillis();

        Rows(Context c, int id) {
            this.c = c;
            this.id = id;
        }

        @Override
        public void onCreate() {
        }

        @Override
        public void onDataSetChanged() {
            now = System.currentTimeMillis();
            BxTime.load(c);
            try {
                JSONObject d = BxWidgetProvider.load(c);
                long day = BxWidgetProvider.dayOf(c, id, now);
                rows = BxWidgetProvider.rows(d, BxWidgetProvider.onlyItems(d), day);
                marks = BxWidgetProvider.marks(rows, day, now);
            } catch (Exception e) {
                rows = new ArrayList<>();
                marks = new int[0];
            }
        }

        @Override
        public void onDestroy() {
            rows = new ArrayList<>();
        }

        @Override
        public int getCount() {
            return rows.size();
        }

        @Override
        public RemoteViews getViewAt(int pos) {
            if (pos < 0 || pos >= rows.size()) return BxWidgetProvider.divider(c, "");
            return BxWidgetProvider.row(c, rows.get(pos), now, pos < marks.length ? marks[pos] : 0);
        }

        /** 불러오는 동안 보이는 줄(없으면 휴대폰이 영어 'Loading…'을 띄움) */
        @Override
        public RemoteViews getLoadingView() {
            return BxWidgetProvider.divider(c, "");
        }

        @Override
        public int getViewTypeCount() {
            return 2;
        }

        @Override
        public long getItemId(int pos) {
            return pos;
        }

        @Override
        public boolean hasStableIds() {
            return false;
        }
    }
}
