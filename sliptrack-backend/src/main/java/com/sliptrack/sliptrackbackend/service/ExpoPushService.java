package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.model.UserDevice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ExpoPushService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.create();

    public void sendToDevices(List<UserDevice> devices, String title, String body) {
        for (UserDevice device : devices) {
            sendToToken(device.getDeviceToken(), title, body);
        }
    }

    private void sendToToken(String deviceToken, String title, String body) {
        try {
            restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .body(Map.of(
                            "to", deviceToken,
                            "title", title,
                            "body", body,
                            "sound", "default"
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Slanje push notifikacije nije uspjelo za uređaj (token {}): {}", deviceToken, e.getMessage());
        }
    }
}
