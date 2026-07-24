package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.PaymentSlipAudit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentSlipAuditRepository extends JpaRepository<PaymentSlipAudit, Long> {

    @EntityGraph(attributePaths = {"changedBy"})
    List<PaymentSlipAudit> findByPaymentSlipIdOrderByChangedAtDesc(Long paymentSlipId);

    void deleteByPaymentSlipId(Long paymentSlipId);
}
