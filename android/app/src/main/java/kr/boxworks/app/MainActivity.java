package kr.boxworks.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BxAlarmPlugin.class);
        registerPlugin(BxSpeechPlugin.class);
        registerPlugin(BxCalendarPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
