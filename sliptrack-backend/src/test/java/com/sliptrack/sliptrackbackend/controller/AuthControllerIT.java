package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.AbstractIntegrationTest;
import com.sliptrack.sliptrackbackend.dto.LoginRequest;
import com.sliptrack.sliptrackbackend.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerIT extends AbstractIntegrationTest {

    @Test
    void registerCreatesUserAndReturnsTokens() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Ana");
        request.setLastName("Anić");
        request.setEmail("ana@example.com");
        request.setPassword(DEFAULT_PASSWORD);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value("ana@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void registerWithExistingEmailReturnsConflict() throws Exception {
        registerAndGetAccessToken("duplikat@example.com");

        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Netko");
        request.setLastName("Drugi");
        request.setEmail("duplikat@example.com");
        request.setPassword(DEFAULT_PASSWORD);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void loginWithWrongPasswordReturnsUnauthorized() throws Exception {
        registerAndGetAccessToken("login-test@example.com");

        LoginRequest request = new LoginRequest();
        request.setEmail("login-test@example.com");
        request.setPassword("pogresna-lozinka");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/payment-slips"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithValidTokenSucceeds() throws Exception {
        String accessToken = registerAndGetAccessToken("valid-token@example.com");

        mockMvc.perform(get("/api/payment-slips").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    void refreshRotatesTokenAndOldRefreshTokenBecomesInvalid() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Refresh");
        request.setLastName("Test");
        request.setEmail("refresh-test@example.com");
        request.setPassword(DEFAULT_PASSWORD);

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode registerJson = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String originalRefreshToken = registerJson.get("refreshToken").asText();

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\": \"" + originalRefreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        JsonNode refreshJson = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        assertThat(refreshJson.get("refreshToken").asText()).isNotEqualTo(originalRefreshToken);

        // Rotacija — stari refresh token je sad opozvan, ponovna upotreba mora pasti.
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\": \"" + originalRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meReturnsCurrentUserWhenAuthenticated() throws Exception {
        String accessToken = registerAndGetAccessToken("me-test@example.com");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me-test@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }
}
