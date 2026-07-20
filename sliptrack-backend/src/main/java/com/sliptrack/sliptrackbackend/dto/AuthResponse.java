package com.sliptrack.sliptrackbackend.dto;

import com.sliptrack.sliptrackbackend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
}
