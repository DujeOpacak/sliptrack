package com.sliptrack.sliptrackbackend.dto;

import com.sliptrack.sliptrackbackend.enums.DevicePlatform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class UserDeviceResponse {

    private Long id;
    private String deviceToken;
    private DevicePlatform platform;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
