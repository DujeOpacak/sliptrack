package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class DashboardSummaryResponse {

    private BigDecimal totalPaid;
    private BigDecimal totalUnpaid;
    private long paidCount;
    private long unpaidCount;
}
