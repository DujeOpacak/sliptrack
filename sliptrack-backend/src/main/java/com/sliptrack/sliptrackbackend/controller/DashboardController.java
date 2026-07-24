package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.dto.CategoryAmountResponse;
import com.sliptrack.sliptrackbackend.dto.DashboardSummaryResponse;
import com.sliptrack.sliptrackbackend.dto.ProviderAmountResponse;
import com.sliptrack.sliptrackbackend.dto.TimelinePointResponse;
import com.sliptrack.sliptrackbackend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String providerName
    ) {
        return ResponseEntity.ok(dashboardService.getSummary(categoryId, providerName));
    }

    @GetMapping("/by-category")
    public ResponseEntity<List<CategoryAmountResponse>> getByCategory() {
        return ResponseEntity.ok(dashboardService.getByCategory());
    }

    @GetMapping("/by-provider")
    public ResponseEntity<List<ProviderAmountResponse>> getByProvider() {
        return ResponseEntity.ok(dashboardService.getByProvider());
    }

    @GetMapping("/timeline")
    public ResponseEntity<List<TimelinePointResponse>> getTimeline() {
        return ResponseEntity.ok(dashboardService.getTimeline());
    }
}
