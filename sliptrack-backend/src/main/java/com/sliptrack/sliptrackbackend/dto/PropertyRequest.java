package com.sliptrack.sliptrackbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 255)
    private String address;
}
