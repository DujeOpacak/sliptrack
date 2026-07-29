package com.sliptrack.sliptrackbackend.dto;

import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class PaymentSlipResponse {

    private Long id;
    private String iban;
    private BigDecimal amount;
    private String referenceNumber;
    private String paymentModel;
    private String providerName;
    private String description;
    private LocalDate dueDate;
    private PaymentStatus status;
    private LocalDate paidAt;
    private String imageUrl;

    private Long categoryId;
    private String categoryName;

    private Long subCategoryId;
    private String subCategoryName;

    private Long propertyId;
    private String propertyName;

    private LocalDateTime scannedAt;
    private LocalDateTime createdAt;
}
