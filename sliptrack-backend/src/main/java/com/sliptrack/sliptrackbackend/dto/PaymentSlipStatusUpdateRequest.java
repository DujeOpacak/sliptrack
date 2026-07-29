package com.sliptrack.sliptrackbackend.dto;

import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PaymentSlipStatusUpdateRequest {

    @NotNull
    private PaymentStatus status;

    private LocalDate paidAt;
}
