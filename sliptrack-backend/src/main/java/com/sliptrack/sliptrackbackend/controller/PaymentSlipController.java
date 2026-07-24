package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.dto.PaymentSlipAuditResponse;
import com.sliptrack.sliptrackbackend.dto.PaymentSlipRequest;
import com.sliptrack.sliptrackbackend.dto.PaymentSlipResponse;
import com.sliptrack.sliptrackbackend.dto.PaymentSlipStatusUpdateRequest;
import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import com.sliptrack.sliptrackbackend.service.PaymentSlipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payment-slips")
@RequiredArgsConstructor
public class PaymentSlipController {

    private final PaymentSlipService paymentSlipService;

    @GetMapping
    public ResponseEntity<List<PaymentSlipResponse>> getAll(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long subCategoryId,
            @RequestParam(required = false) String providerName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateTo
    ) {
        return ResponseEntity.ok(paymentSlipService.getAll(status, categoryId, subCategoryId, providerName, dueDateFrom, dueDateTo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentSlipResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentSlipService.getById(id));
    }

    @PostMapping
    public ResponseEntity<PaymentSlipResponse> create(@Valid @RequestBody PaymentSlipRequest request) {
        return ResponseEntity.ok(paymentSlipService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentSlipResponse> update(@PathVariable Long id, @Valid @RequestBody PaymentSlipRequest request) {
        return ResponseEntity.ok(paymentSlipService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PaymentSlipResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody PaymentSlipStatusUpdateRequest request) {
        return ResponseEntity.ok(paymentSlipService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        paymentSlipService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<List<PaymentSlipAuditResponse>> getAudit(@PathVariable Long id) {
        return ResponseEntity.ok(paymentSlipService.getAudit(id));
    }
}
