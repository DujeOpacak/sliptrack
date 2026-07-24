package com.sliptrack.sliptrackbackend.dto;

import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class PaymentSlipAuditResponse {

    private Long id;
    private PaymentStatus oldStatus;
    private PaymentStatus newStatus;
    private String changedByEmail;
    private LocalDateTime changedAt;
}
