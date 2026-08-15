package com.sliptrack.sliptrackbackend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PaymentSlipRequest {

    @NotBlank
    @Pattern(regexp = "HR\\d{19}", message = "IBAN mora biti u hrvatskom formatu (HR + 19 znamenki)")
    private String iban;

    public void setIban(String iban) {
        this.iban = iban == null ? null : iban.replaceAll("\\s+", "").toUpperCase();
    }

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal amount;

    @Size(max = 255)
    private String referenceNumber;

    @Size(max = 255)
    private String paymentModel;

    @Size(max = 255)
    private String providerName;

    @Size(max = 255)
    private String description;

    @NotNull
    private LocalDate dueDate;

    @NotNull
    private Long categoryId;

    private Long subCategoryId;

    private Long propertyId;

    private boolean wasScanned;
}
