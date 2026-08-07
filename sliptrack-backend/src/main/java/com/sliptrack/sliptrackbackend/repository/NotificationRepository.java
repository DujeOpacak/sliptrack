package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderBySentAtDesc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    boolean existsByPaymentSlipIdAndMessageStartingWith(Long paymentSlipId, String prefix);

    @Modifying
    @Query("UPDATE Notification n SET n.paymentSlip = null WHERE n.paymentSlip.id = :paymentSlipId")
    void detachPaymentSlip(@Param("paymentSlipId") Long paymentSlipId);
}
