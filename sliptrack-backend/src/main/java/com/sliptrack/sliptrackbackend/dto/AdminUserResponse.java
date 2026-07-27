package com.sliptrack.sliptrackbackend.dto;

import com.sliptrack.sliptrackbackend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AdminUserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private Boolean active;
    private LocalDateTime createdAt;
}
