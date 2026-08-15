package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.model.UserDevice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ExpoPushService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.create();

    public void sendToDevices(List<UserDevice> devices, String title, String body, Long paymentSlipId) {
        for (UserDevice device : devices) {
            sendToToken(device.getDeviceToken(), title, body, paymentSlipId);
        }
    }

    private void sendToToken(String deviceToken, String title, String body, Long paymentSlipId) {
        try {
            Map<String, Object> payload = new HashMap<>(Map.of(
                    "to", deviceToken,
                    "title", title,
                    "body", body,
                    "sound", "default",
                    "channelId", "default"
            ));

            // Ako je predicted notifikacija ne salje se id uplatnice jer ne postoji
            if (paymentSlipId != null) {
                payload.put("data", Map.of("paymentSlipId", paymentSlipId));
            }

            String response = restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (response != null && response.contains("\"status\":\"error\"")) {
                log.warn("Expo push API vratio grešku za uređaj (token {}): {}", deviceToken, response);
            }
        } catch (Exception e) {
            log.warn("Slanje push notifikacije nije uspjelo za uređaj (token {}): {}", deviceToken, e.getMessage());
        }
    }
}
