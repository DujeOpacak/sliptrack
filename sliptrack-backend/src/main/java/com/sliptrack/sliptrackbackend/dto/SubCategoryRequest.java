package com.sliptrack.sliptrackbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubCategoryRequest {

    @NotBlank
    private String name;

    private boolean allowsProperty;

    @NotNull
    private Long categoryId;
}
