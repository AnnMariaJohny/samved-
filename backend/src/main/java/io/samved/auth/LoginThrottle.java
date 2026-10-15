package io.samved.auth;

import io.samved.common.ApiException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Bounded, per-process protection for credential and registration requests; no forwarded IP is trusted. */
@Component
public class LoginThrottle {
    private record Window(long start,int count) { }
    private final Map<String,Window> windows=new LinkedHashMap<>();
    public synchronized void check(String address) {
        long now=System.currentTimeMillis();
        windows.entrySet().removeIf(e -> now-e.getValue().start()>60_000);
        Window w=windows.get(address);
        if(w!=null && w.count()>=20) throw ApiException.tooManyRequests("Too many attempts. Wait one minute and try again.");
        if(windows.size()>=10000) windows.remove(windows.keySet().iterator().next());
        windows.put(address,new Window(w==null?now:w.start(),w==null?1:w.count()+1));
    }
}
