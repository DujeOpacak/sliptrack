package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.dto.AdminCategoryCountResponse;
import com.sliptrack.sliptrackbackend.dto.AdminStatsResponse;
import com.sliptrack.sliptrackbackend.dto.AdminSubCategoryCountResponse;
import com.sliptrack.sliptrackbackend.dto.AdminUserResponse;
import com.sliptrack.sliptrackbackend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<AdminUserResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.deactivate(id));
    }

    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<AdminUserResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.activate(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/categories/stats")
    public ResponseEntity<List<AdminCategoryCountResponse>> getCategoryStats() {
        return ResponseEntity.ok(adminService.getCategoryCounts());
    }

    @GetMapping("/subcategories/stats")
    public ResponseEntity<List<AdminSubCategoryCountResponse>> getSubCategoryStats() {
        return ResponseEntity.ok(adminService.getSubCategoryCounts());
    }
}
