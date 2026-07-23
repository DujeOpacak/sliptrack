package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CategoryResponse {

    private Long id;
    private String name;
    private LocalDateTime createdAt;
}
