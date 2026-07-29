package com.sliptrack.sliptrackbackend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PaymentSlipRequest {

    @NotBlank
    private String iban;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal amount;

    private String referenceNumber;

    private String paymentModel;

    private String providerName;

    private String description;

    private LocalDate dueDate;

    @NotNull
    private Long categoryId;

    private Long subCategoryId;

    private Long propertyId;

    private boolean wasScanned;
}
