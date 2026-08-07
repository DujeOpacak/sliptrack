package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class SubCategoryAmountResponse {

    private Long subCategoryId;
    private String subCategoryName;
    private Long categoryId;
    private String categoryName;
    private BigDecimal totalAmount;
    private Long count;
}
