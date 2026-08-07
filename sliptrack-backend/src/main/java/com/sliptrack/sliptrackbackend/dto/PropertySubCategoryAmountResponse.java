package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class PropertySubCategoryAmountResponse {

    private Long propertyId;
    private String propertyName;
    private Long subCategoryId;
    private String subCategoryName;
    private BigDecimal totalAmount;
    private Long count;
}
