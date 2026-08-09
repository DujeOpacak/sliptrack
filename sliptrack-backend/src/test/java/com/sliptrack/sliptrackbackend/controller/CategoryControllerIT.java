package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.AbstractIntegrationTest;
import com.sliptrack.sliptrackbackend.model.Category;
import com.sliptrack.sliptrackbackend.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryControllerIT extends AbstractIntegrationTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void userCanReadCategories() throws Exception {
        categoryRepository.save(Category.builder().name("Komunalije").build());
        String userToken = registerAndGetAccessToken("reader@example.com");

        mockMvc.perform(get("/api/categories").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Komunalije"));
    }

    @Test
    void userCannotCreateCategory() throws Exception {
        String userToken = registerAndGetAccessToken("blocked-create@example.com");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Nova kategorija\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateCategory() throws Exception {
        String adminToken = createAdminAndGetAccessToken("admin-create@example.com");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Zdravstvo\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Zdravstvo"));
    }

    @Test
    void userCannotDeleteCategory() throws Exception {
        Category category = categoryRepository.save(Category.builder().name("Sport").build());
        String userToken = registerAndGetAccessToken("blocked-delete@example.com");

        mockMvc.perform(delete("/api/categories/" + category.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deletingCategoryWithExistingPaymentSlipReturnsConflict() throws Exception {
        Category category = categoryRepository.save(Category.builder().name("Osiguranje").build());
        String adminToken = createAdminAndGetAccessToken("admin-conflict@example.com");
        String userToken = registerAndGetAccessToken("slip-owner@example.com");

        String slipJson = """
                {
                  "iban": "HR1210010051863000160",
                  "amount": 20.00,
                  "dueDate": "2026-09-01",
                  "categoryId": %d
                }
                """.formatted(category.getId());

        mockMvc.perform(post("/api/payment-slips")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(slipJson))
                .andExpect(status().isOk());

        // FK-conflict obrazac (vidi CLAUDE.md): brisanje mora vratiti čist 409, ne neuhvaćen
        // DataIntegrityViolationException/500 kad FK constraint padne.
        mockMvc.perform(delete("/api/categories/" + category.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void deletingUnusedCategorySucceeds() throws Exception {
        Category category = categoryRepository.save(Category.builder().name("Za brisanje").build());
        String adminToken = createAdminAndGetAccessToken("admin-delete-ok@example.com");

        mockMvc.perform(delete("/api/categories/" + category.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }
}
