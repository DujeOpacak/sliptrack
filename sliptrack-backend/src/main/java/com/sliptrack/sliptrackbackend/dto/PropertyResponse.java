package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class PropertyResponse {

    private Long id;
    private String name;
    private String address;
    private LocalDateTime createdAt;
}
