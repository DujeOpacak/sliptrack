package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class CategoryAmountResponse {

    private Long categoryId;
    private String categoryName;
    private BigDecimal totalAmount;
    private Long count;
}
