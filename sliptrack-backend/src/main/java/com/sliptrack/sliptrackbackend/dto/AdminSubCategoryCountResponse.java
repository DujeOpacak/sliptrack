package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminSubCategoryCountResponse {

    private Long subCategoryId;
    private String subCategoryName;
    private Long categoryId;
    private Long count;
}
