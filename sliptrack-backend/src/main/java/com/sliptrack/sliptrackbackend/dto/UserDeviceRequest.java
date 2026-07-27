package com.sliptrack.sliptrackbackend.dto;

import com.sliptrack.sliptrackbackend.enums.DevicePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDeviceRequest {

    @NotBlank
    private String deviceToken;

    @NotNull
    private DevicePlatform platform;
}
