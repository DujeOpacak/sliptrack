package com.sliptrack.sliptrackbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AdminStatsResponse {

    private long totalUsers;
    private long activeUsers;
    private long totalPaymentSlips;
    private List<AdminCategoryCountResponse> topCategories;
}
