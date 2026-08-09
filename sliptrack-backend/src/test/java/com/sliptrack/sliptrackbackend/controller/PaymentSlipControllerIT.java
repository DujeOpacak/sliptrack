package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.AbstractIntegrationTest;
import com.sliptrack.sliptrackbackend.model.Category;
import com.sliptrack.sliptrackbackend.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PaymentSlipControllerIT extends AbstractIntegrationTest {

    @Autowired
    private CategoryRepository categoryRepository;

    private Long categoryId;

    @BeforeEach
    void seedCategory() {
        Category category = categoryRepository.save(Category.builder().name("Komunalije").build());
        categoryId = category.getId();
    }

    private String validPaymentSlipJson() {
        return """
                {
                  "iban": "HR1210010051863000160",
                  "amount": 51.82,
                  "referenceNumber": "1234567890",
                  "paymentModel": "HR01",
                  "providerName": "HEP ELEKTRA",
                  "description": "Struja - srpanj 2026",
                  "dueDate": "2026-08-15",
                  "categoryId": %d,
                  "wasScanned": false
                }
                """.formatted(categoryId);
    }

    @Test
    void createThenGetByIdReturnsSlipToOwner() throws Exception {
        String token = registerAndGetAccessToken("owner@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/payment-slips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPaymentSlipJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.iban").value("HR1210010051863000160"))
                .andExpect(jsonPath("$.status").value("UNPAID"))
                .andReturn();

        long slipId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/payment-slips/" + slipId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerName").value("HEP ELEKTRA"));
    }

    @Test
    void createWithInvalidIbanReturnsBadRequest() throws Exception {
        String token = registerAndGetAccessToken("bad-iban@example.com");

        String invalidJson = """
                {
                  "iban": "HR123",
                  "amount": 51.82,
                  "dueDate": "2026-08-15",
                  "categoryId": %d
                }
                """.formatted(categoryId);

        mockMvc.perform(post("/api/payment-slips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.iban").exists());
    }

    @Test
    void accessingAnotherUsersSlipReturnsNotFoundNotForbidden() throws Exception {
        String ownerToken = registerAndGetAccessToken("owner2@example.com");
        String strangerToken = registerAndGetAccessToken("stranger@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/payment-slips")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPaymentSlipJson()))
                .andExpect(status().isOk())
                .andReturn();

        long slipId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Vlasništvo se štiti u service sloju bez @PreAuthorize — tuđa uplatnica vraća 404,
        // ne 403, da se ne otkrije postojanje resursa (vidi CLAUDE.md Property/PaymentSlip bullet).
        mockMvc.perform(get("/api/payment-slips/" + slipId).header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateStatusToPaidSetsPaidAtAndCreatesAuditEntry() throws Exception {
        String token = registerAndGetAccessToken("status-test@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/payment-slips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPaymentSlipJson()))
                .andExpect(status().isOk())
                .andReturn();

        long slipId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/payment-slips/" + slipId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"PAID\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paidAt").isNotEmpty());

        mockMvc.perform(get("/api/payment-slips/" + slipId + "/audit").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].newStatus").value("PAID"));
    }

    @Test
    void deleteRemovesSlipForOwner() throws Exception {
        String token = registerAndGetAccessToken("delete-test@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/payment-slips")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPaymentSlipJson()))
                .andExpect(status().isOk())
                .andReturn();

        long slipId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(delete("/api/payment-slips/" + slipId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/payment-slips/" + slipId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
