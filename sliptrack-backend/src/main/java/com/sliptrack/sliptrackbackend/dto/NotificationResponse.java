package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String message;
    private Boolean read;
    private Long paymentSlipId;
    private LocalDateTime sentAt;
}
