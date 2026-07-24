package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class SubCategoryResponse {

    private Long id;
    private String name;
    private boolean allowsProperty;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}
