package kr.boxworks.b;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.provider.CalendarContract;

/**
 * 앱을 열지 않아도 다시 계획(SPEC 6절): 캘린더가 바뀌면(내용 감시, 5~30초 모아서) · 6시간마다.
 * 내용 감시 작업은 한 번 돌면 끝나므로 돌 때마다 다시 등록한다(재부팅 뒤에는 BBootReceiver가 등록).
 */
public class BReplanJob extends JobService {
    static final int JOB_CALENDAR = 0xB001;
    static final int JOB_PERIODIC = 0xB002;
    private static final long PERIOD_MS = 6 * 60 * 60 * 1000L;

    /** 등록돼 있지 않으면 등록한다(캘린더 감시는 권한이 있을 때만) */
    static void ensure(Context c) {
        try {
            JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js == null) return;
            if (BCalendar.canRead(c) && js.getPendingJob(JOB_CALENDAR) == null) scheduleCalendar(c, js);
            if (js.getPendingJob(JOB_PERIODIC) == null) {
                js.schedule(new JobInfo.Builder(JOB_PERIODIC, new ComponentName(c, BReplanJob.class))
                    .setPeriodic(PERIOD_MS)
                    .setPersisted(true)
                    .build());
            }
        } catch (Exception ignored) {
        }
    }

    private static void scheduleCalendar(Context c, JobScheduler js) {
        try {
            js.schedule(new JobInfo.Builder(JOB_CALENDAR, new ComponentName(c, BReplanJob.class))
                .addTriggerContentUri(new JobInfo.TriggerContentUri(CalendarContract.Events.CONTENT_URI,
                    JobInfo.TriggerContentUri.FLAG_NOTIFY_FOR_DESCENDANTS))
                .setTriggerContentUpdateDelay(5000)
                .setTriggerContentMaxDelay(30000)
                .build());
        } catch (Exception ignored) {
        }
    }

    @Override
    public boolean onStartJob(final JobParameters params) {
        final Context c = getApplicationContext();
        final boolean calendar = params.getJobId() == JOB_CALENDAR;
        BEngine.bg(() -> {
            try {
                BEngine.replan(c, false);
                BPlugin.emit(calendar ? "calendar" : "periodic", null);
            } finally {
                if (calendar) {
                    JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
                    if (js != null && BCalendar.canRead(c)) scheduleCalendar(c, js);
                }
                jobFinished(params, false);
            }
        });
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        // 다시 계획은 짧게 끝나므로 멈추면 다음 신호를 기다린다(캘린더 감시는 다시 등록)
        if (params.getJobId() == JOB_CALENDAR) {
            JobScheduler js = (JobScheduler) getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js != null && BCalendar.canRead(this)) scheduleCalendar(this, js);
        }
        return false;
    }
}
