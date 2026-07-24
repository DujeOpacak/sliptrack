package com.sliptrack.sliptrackbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyRequest {

    @NotBlank
    private String name;

    private String address;
}
