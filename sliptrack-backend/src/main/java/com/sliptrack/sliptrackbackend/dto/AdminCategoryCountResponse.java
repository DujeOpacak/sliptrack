package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminCategoryCountResponse {

    private Long categoryId;
    private String categoryName;
    private Long count;
}
