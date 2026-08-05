package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.dto.AuthResponse;
import com.sliptrack.sliptrackbackend.dto.CurrentUserResponse;
import com.sliptrack.sliptrackbackend.dto.LoginRequest;
import com.sliptrack.sliptrackbackend.dto.RefreshRequest;
import com.sliptrack.sliptrackbackend.dto.RegisterRequest;
import com.sliptrack.sliptrackbackend.dto.TokenResponse;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import com.sliptrack.sliptrackbackend.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final AuthService authService;
    private final CurrentUserService currentUserService;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        setRefreshCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setRefreshCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody(required = false) RefreshRequest request,
                                                   HttpServletRequest httpRequest, HttpServletResponse response) {
        String rawRefreshToken = resolveRefreshToken(request, httpRequest);
        TokenResponse tokenResponse = authService.refresh(rawRefreshToken);
        setRefreshCookie(response, tokenResponse.getRefreshToken());
        return ResponseEntity.ok(tokenResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshRequest request,
                                        HttpServletRequest httpRequest, HttpServletResponse response) {
        String rawRefreshToken = resolveRefreshToken(request, httpRequest);
        authService.logout(rawRefreshToken);
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(CurrentUserResponse.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build());
    }

    private String resolveRefreshToken(RefreshRequest request, HttpServletRequest httpRequest) {
        String cookieToken = extractCookieToken(httpRequest);
        if (cookieToken != null) {
            return cookieToken;
        }
        if (request != null && request.getRefreshToken() != null) {
            return request.getRefreshToken();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token nedostaje");
    }

    private String extractCookieToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(refreshTokenExpirationMs / 1000)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
