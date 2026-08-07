package com.sliptrack.sliptrackbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubCategoryRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    private boolean allowsProperty;

    @NotNull
    private Long categoryId;
}
