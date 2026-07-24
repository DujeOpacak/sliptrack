package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ProviderAmountResponse {

    private String providerName;
    private BigDecimal totalAmount;
    private Long count;
}
